import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()));

  const [goals, checkIns, users] = await Promise.all([
    db.goal.findMany({ where: { cycleYear: year }, include: { owner: true, checkIns: true } }),
    db.checkIn.findMany({ where: { year }, include: { goal: true, user: true } }),
    db.user.findMany(),
  ]);

  // Build analytics — all computed BEFORE the return
  const byStatus = goals.reduce((acc: Record<string, number>, g) => {
    acc[g.status] = (acc[g.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byThrustArea = goals.reduce((acc: Record<string, number>, g) => {
    acc[g.thrustArea] = (acc[g.thrustArea] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const completionByDept = users.reduce(
    (acc: Record<string, { total: number; submitted: number; approved: number }>, u) => {
      const dept = u.department || "General";
      if (!acc[dept]) acc[dept] = { total: 0, submitted: 0, approved: 0 };
      const userGoals = goals.filter((g) => g.ownerId === u.id);
      acc[dept].total += userGoals.length;
      acc[dept].submitted += userGoals.filter((g) => g.status !== "DRAFT").length;
      acc[dept].approved += userGoals.filter((g) =>
        ["APPROVED", "LOCKED"].includes(g.status)
      ).length;
      return acc;
    },
    {} as Record<string, { total: number; submitted: number; approved: number }>
  );

  const checkInCompletion = [1, 2, 3, 4].map((q) => {
    const forQuarter = checkIns.filter((c) => c.quarter === q);
    const completed = forQuarter.filter((c) => c.status !== "NOT_STARTED").length;
    const total = forQuarter.length;
    return {
      quarter: `Q${q}`,
      completed,
      total,
      rate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  return NextResponse.json({
    totalGoals: goals.length,
    byStatus,
    byThrustArea,
    byDepartment: completionByDept,
    checkInCompletion,
  });
}