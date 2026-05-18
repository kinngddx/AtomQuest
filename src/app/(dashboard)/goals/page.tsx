import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { GoalStatusBadge } from "@/components/goals/GoalStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Plus, Target, Lock } from "lucide-react";
import { calculateProgress } from "@/lib/progress";
import { formatDate } from "@/lib/utils";

export default async function GoalsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const goals = await db.goal.findMany({
    where: { ownerId: userId },
    include: {
      checkIns: { orderBy: { quarter: "desc" } },
      approvals: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
  const totalWeightage = goals
    .filter((g) => ["APPROVED", "LOCKED"].includes(g.status))
    .reduce((sum, g) => sum + g.weightage, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Goals</h1>
          <p className="text-muted-foreground mt-1">FY {currentYear}</p>
        </div>
        <Link href="/goals/create">
          <Button><Plus className="h-4 w-4 mr-2" />Create Goals</Button>
        </Link>
      </div>

      {goals.length > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Approved Weightage</span>
              <span className={totalWeightage === 100 ? "text-green-500 font-bold text-sm" : "text-yellow-500 font-bold text-sm"}>
                {totalWeightage}% {totalWeightage === 100 ? "✓" : ""}
              </span>
            </div>
            <Progress value={Math.min(totalWeightage, 100)} />
          </CardContent>
        </Card>
      )}

      {goals.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed rounded-xl">
          <Target className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">No goals yet</h2>
          <p className="text-muted-foreground mt-2 mb-6">Create your goals for FY {currentYear}</p>
          <Link href="/goals/create">
            <Button><Plus className="h-4 w-4 mr-2" />Create Goals</Button>
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {goals.map((goal) => {
          const latestCheckIn = goal.checkIns.find(
            (c) => c.quarter === currentQuarter && c.year === currentYear
          );
          const progress = calculateProgress(
            goal.uomType as "NUMERIC_MIN" | "NUMERIC_MAX" | "TIMELINE" | "ZERO",
            goal.target,
            latestCheckIn?.achievement
          );
          return (
            <Card key={goal.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {goal.status === "LOCKED" && <Lock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
                      <p className="font-medium text-sm">{goal.title}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{goal.thrustArea}</span>
                      <span className="text-xs text-muted-foreground">Target: {goal.target.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">Created {formatDate(goal.createdAt)}</span>
                    </div>
                    {["APPROVED", "LOCKED"].includes(goal.status) && (
                      <div className="flex items-center gap-3 mt-3">
                        <Progress value={Math.min(progress, 100)} className="flex-1 h-1.5" />
                        <span className={`text-xs font-semibold min-w-[36px] text-right ${
                          progress >= 100 ? "text-green-500" :
                          progress >= 75 ? "text-blue-500" :
                          progress >= 50 ? "text-yellow-500" : "text-red-500"
                        }`}>{progress}%</span>
                      </div>
                    )}
                    {goal.status === "REJECTED" && goal.approvals[0]?.comment && (
                      <p className="text-xs text-destructive mt-2">Reason: {goal.approvals[0].comment}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <GoalStatusBadge status={goal.status as "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "LOCKED"} />
                    <span className="text-xs font-semibold">{goal.weightage}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}