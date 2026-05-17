"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Goal, User, Approval } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  User as UserIcon,
  Target,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

type GoalWithRelations = Goal & {
  owner: User;
  approvals: (Approval & { manager: User })[];
};

type EmployeeGroup = {
  employee: User;
  goals: GoalWithRelations[];
  totalWeightage: number;
};

interface Props {
  employees: EmployeeGroup[];
  managerId: string;
}

const UOM_LABELS: Record<string, string> = {
  NUMERIC_MIN: "Numeric ↑",
  NUMERIC_MAX: "Numeric ↓",
  TIMELINE: "Timeline",
  ZERO: "Zero-based",
};

export function ManagerApprovalsClient({ employees, managerId }: Props) {
  const router = useRouter();
  const [comments, setComments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const handleAction = async (
    goalId: string,
    action: "APPROVED" | "REJECTED" | "RETURNED"
  ) => {
    setLoading((prev) => ({ ...prev, [goalId]: true }));
    try {
      const res = await fetch(`/api/goals/${goalId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          comment: comments[goalId] || "",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Action failed");
      }

      const messages = {
        APPROVED: "Goal approved and locked ✓",
        REJECTED: "Goal rejected",
        RETURNED: "Goal returned for revision",
      };
      toast.success(messages[action]);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading((prev) => ({ ...prev, [goalId]: false }));
    }
  };

  const handleApproveAll = async (goals: GoalWithRelations[]) => {
    for (const goal of goals) {
      await handleAction(goal.id, "APPROVED");
    }
  };

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
        <h2 className="text-xl font-semibold">All caught up!</h2>
        <p className="text-muted-foreground mt-2">
          No pending goal approvals from your team.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pending Approvals</h1>
          <p className="text-muted-foreground mt-1">
            {employees.length} employee{employees.length !== 1 ? "s" : ""} awaiting
            review
          </p>
        </div>
        <Badge variant="secondary" className="text-sm px-3 py-1">
          <Clock className="h-3 w-3 mr-1" />
          {employees.reduce((sum, e) => sum + e.goals.length, 0)} goals total
        </Badge>
      </div>

      {/* Employee cards */}
      {employees.map(({ employee, goals, totalWeightage }) => (
        <Card key={employee.id} className="border-border overflow-hidden">
          {/* Employee header */}
          <CardHeader className="bg-muted/40 pb-3 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserIcon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{employee.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {employee.department || "General"} · {employee.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "text-xs font-medium px-2 py-1 rounded-md border",
                    totalWeightage === 100
                      ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400"
                  )}
                >
                  {totalWeightage}% total weightage
                  {totalWeightage === 100 ? " ✓" : " ✗"}
                </div>
                <Badge variant="secondary">{goals.length} goals</Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Goals table */}
            <div className="divide-y divide-border">
              {goals.map((goal) => (
                <div key={goal.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <p className="font-medium text-sm truncate">{goal.title}</p>
                      </div>
                      {goal.description && (
                        <p className="text-xs text-muted-foreground ml-5 mb-2 line-clamp-1">
                          {goal.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 ml-5">
                        <span className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                          {goal.thrustArea}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {UOM_LABELS[goal.uomType] || goal.uomType}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Target: <strong>{goal.target}</strong>
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold">{goal.weightage}%</p>
                      <p className="text-xs text-muted-foreground">weightage</p>
                    </div>
                  </div>

                  {/* Comment box per goal */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Comment (optional)
                    </Label>
                    <Textarea
                      placeholder="Add feedback or revision notes..."
                      rows={2}
                      className="text-xs resize-none"
                      value={comments[goal.id] || ""}
                      onChange={(e) =>
                        setComments((prev) => ({
                          ...prev,
                          [goal.id]: e.target.value,
                        }))
                      }
                    />
                  </div>

                  {/* Per-goal action buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs"
                      disabled={loading[goal.id]}
                      onClick={() => handleAction(goal.id, "APPROVED")}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      disabled={loading[goal.id]}
                      onClick={() => handleAction(goal.id, "RETURNED")}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Return
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-destructive border-destructive/40 hover:bg-destructive/10"
                      disabled={loading[goal.id]}
                      onClick={() => handleAction(goal.id, "REJECTED")}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Reject
                    </Button>
                    <span className="text-xs text-muted-foreground ml-auto">
                      Submitted {formatDate(goal.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Approve all footer */}
            <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Approving locks all goals — employees cannot edit after approval
              </p>
              <Button
                size="sm"
                className="h-8 text-xs"
                disabled={
                  totalWeightage !== 100 ||
                  goals.some((g) => loading[g.id])
                }
                onClick={() => handleApproveAll(goals)}
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                Approve All {goals.length} Goals
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}