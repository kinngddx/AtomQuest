import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export default async function AdminDashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const admin = await db.user.findUnique({ where: { id: userId } });
  if (!admin || admin.role !== "ADMIN") redirect("/dashboard");

  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

  const [users, goals, checkIns, auditLogs, cycles] = await Promise.all([
    db.user.findMany({ orderBy: { createdAt: "asc" } }),
    db.goal.findMany({
      where: { cycleYear: currentYear },
      include: { owner: true, checkIns: true },
    }),
    db.checkIn.findMany({ where: { year: currentYear } }),
    db.auditLog.findMany({
      include: { user: true, goal: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.cycle.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  // typed reducers — no any
  const byDepartment = Object.entries(
    goals.reduce((acc: Record<string, number>, g) => {
      const dept = g.owner.department || "General";
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, count]) => ({ name, count }));

  const byThrustArea = Object.entries(
    goals.reduce((acc: Record<string, number>, g) => {
      acc[g.thrustArea] = (acc[g.thrustArea] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, count]) => ({ name, count }));

  const byStatus = Object.entries(
    goals.reduce((acc: Record<string, number>, g) => {
      acc[g.status] = (acc[g.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, count]) => ({ name, count }));

  const stats = {
    totalUsers: users.length,
    totalGoals: goals.length,
    approvedGoals: goals.filter((g) =>
      ["APPROVED", "LOCKED"].includes(g.status)
    ).length,
    pendingApprovals: goals.filter((g) => g.status === "SUBMITTED").length,
    checkInCompletion:
      checkIns.length > 0
        ? (checkIns.filter((c) => c.status !== "NOT_STARTED").length /
            checkIns.length) *
          100
        : 0,
    byDepartment,
    byThrustArea,
    byStatus,
    monthlyCheckIns: [1, 2, 3, 4].map((q) => ({
      quarter: `Q${q}`,
      completed: checkIns.filter(
        (c) => c.quarter === q && c.status !== "NOT_STARTED"
      ).length,
      total: checkIns.filter((c) => c.quarter === q).length,
    })),
    users,
    currentQuarter,
    currentYear,
    cycles,
  };

  return (
    <AdminDashboardClient stats={stats} auditLogs={auditLogs} />
  );
}

