// src/app/(dashboard)/checkins/page.tsx

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CheckInsClient } from "@/components/checkins/CheckInsClient";
import type { Goal, CheckIn } from "@prisma/client";

type GoalWithCheckIns = Goal & {
  checkIns: CheckIn[];
};

export default async function CheckInsPage() {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

  const goals: GoalWithCheckIns[] = await db.goal.findMany({
    where: {
      ownerId: userId,
      status: { in: ["APPROVED", "LOCKED"] },
    },
    include: {
      checkIns: {
        where: { year: currentYear },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <CheckInsClient
      goals={goals}
      currentQuarter={currentQuarter}
      currentYear={currentYear}
      userId={userId}
    />
  );
}