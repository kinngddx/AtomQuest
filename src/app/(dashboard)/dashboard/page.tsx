import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { EmployeeDashboardClient } from "@/components/dashboard/EmployeeDashboardClient";

/* TYPES */
type Goal = {
  id: string;
  status: string;
  weightage: number;
  target: number;
  uomType: string;
  checkIns: {
    quarter: number;
    year: number;
    achievement: number | null;
  }[];
};

type CheckIn = {
  quarter: number;
  year: number;
  achievement: number | null;
};

// type User = any;
type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

export default async function EmployeeDashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [user, goals, checkIns] = await Promise.all([
    db.user.findUnique({ where: { id: userId } }),
    db.goal.findMany({
      where: { ownerId: userId },
      include: { checkIns: true, approvals: true },
      orderBy: { createdAt: "desc" },
    }),
    db.checkIn.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!user) redirect("/");

  const typedGoals = goals as Goal[];

  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

  const approvedGoals = typedGoals.filter((g) =>
    ["APPROVED", "LOCKED"].includes(g.status)
  );

  const draftGoals = typedGoals.filter((g) => g.status === "DRAFT");

  const pendingGoals = typedGoals.filter((g) => g.status === "SUBMITTED");

  const totalWeightage = approvedGoals.reduce(
    (sum, g) => sum + g.weightage,
    0
  );

  const goalsWithProgress = approvedGoals.map((goal) => {
    const latestCheckIn = goal.checkIns.find(
      (c) => c.quarter === currentQuarter && c.year === currentYear
    );

    const progress = calculateProgress(goal, latestCheckIn?.achievement);

    return {
      ...goal,
      progress,
      checkIn: latestCheckIn,
    };
  });

  const avgProgress =
    goalsWithProgress.length > 0
      ? goalsWithProgress.reduce(
          (sum, g) => sum + (g.progress || 0),
          0
        ) / goalsWithProgress.length
      : 0;

  return (
    <EmployeeDashboardClient
      user={user}
      goals={goalsWithProgress}
      stats={{
        totalGoals: typedGoals.length,
        approvedGoals: approvedGoals.length,
        draftGoals: draftGoals.length,
        pendingGoals: pendingGoals.length,
        avgProgress: Math.round(avgProgress),
        totalWeightage,
        currentQuarter,
        currentYear,
      }}
    />
  );
}

/* PROGRESS CALC */
function calculateProgress(
  goal: {
    uomType: string;
    target: number;
  },
  achievement?: number | null
): number {
  if (achievement === null || achievement === undefined) return 0;

  switch (goal.uomType) {
    case "NUMERIC_MIN":
      return Math.min((achievement / goal.target) * 100, 150);

    case "NUMERIC_MAX":
      return goal.target > 0
        ? Math.min((goal.target / achievement) * 100, 150)
        : 0;

    case "ZERO":
      return achievement === 0 ? 100 : 0;

    default:
      return 0;
  }
}