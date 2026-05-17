import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ManagerApprovalsClient } from "@/components/manager/ManagerApprovalsClient";
import type { Goal, User, Approval } from "@prisma/client";

type GoalWithRelations = Goal & {
  owner: User;
  approvals: (Approval & { manager: User })[];
};

type EmployeeGroup = {
  employee: User;
  goals: GoalWithRelations[];
  totalWeightage: number;
};

export default async function ManagerApprovalsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const manager = await db.user.findUnique({ where: { id: userId } });
  if (!manager || manager.role !== "MANAGER") redirect("/dashboard");

  const teamGoals = await db.goal.findMany({
    where: {
      status: "SUBMITTED",
      owner: { managerId: userId },
    },
    include: {
      owner: true,
      approvals: {
        include: { manager: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const employeeMap = new Map<string, GoalWithRelations[]>();
  for (const goal of teamGoals) {
    const existing = employeeMap.get(goal.ownerId) || [];
    employeeMap.set(goal.ownerId, [...existing, goal]);
  }

  const employees: EmployeeGroup[] = Array.from(employeeMap.entries()).map(
    ([, goals]) => ({
      employee: goals[0].owner,
      goals,
      totalWeightage: goals.reduce((sum, g) => sum + g.weightage, 0),
    })
  );

  return <ManagerApprovalsClient employees={employees} managerId={userId} />;
}