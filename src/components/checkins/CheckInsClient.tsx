// src/components/checkins/CheckInsClient.tsx

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

import { calculateProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

import type { Goal, CheckIn } from "@prisma/client";

const STATUS_OPTIONS = [
  { value: "NOT_STARTED", label: "Not Started" },
  { value: "ON_TRACK", label: "On Track" },
  { value: "COMPLETED", label: "Completed" },
];

const QUARTER_LABELS: Record<number, string> = {
  1: "Q1 (July)",
  2: "Q2 (October)",
  3: "Q3 (January)",
  4: "Q4 / Annual (March)",
};

type GoalWithCheckIns = Goal & {
  checkIns: CheckIn[];
};

type CheckInsClientProps = {
  goals: GoalWithCheckIns[];
  currentQuarter: number;
  currentYear: number;
  userId: string;
};

export function CheckInsClient({
  goals,
  currentQuarter,
  currentYear,
}: CheckInsClientProps) {
  const router = useRouter();

  const [achievements, setAchievements] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const handleSave = async (goalId: string) => {
    setSaving((prev) => ({
      ...prev,
      [goalId]: true,
    }));

    try {
      const res = await fetch(`/api/goals/${goalId}/checkin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quarter: currentQuarter,
          year: currentYear,
          achievement:
            achievements[goalId] !== undefined
              ? Number(achievements[goalId])
              : undefined,
          status: statuses[goalId] || "ON_TRACK",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save");
      }

      toast.success("Check-in saved!");
      router.refresh();
    } catch {
      toast.error("Failed to save check-in");
    } finally {
      setSaving((prev) => ({
        ...prev,
        [goalId]: false,
      }));
    }
  };

  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />

        <h2 className="text-xl font-semibold">
          No active goals
        </h2>

        <p className="text-muted-foreground mt-2">
          You need approved goals to submit check-ins
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Quarterly Check-ins
        </h1>

        <p className="text-muted-foreground mt-1">
          {QUARTER_LABELS[currentQuarter]} · FY {currentYear}
        </p>
      </div>

      <div className="space-y-4">
        {goals.map((goal) => {
          const existingCheckIn = goal.checkIns.find(
            (c) =>
              c.quarter === currentQuarter &&
              c.year === currentYear
          );

          const achievement =
            achievements[goal.id] !== undefined
              ? Number(achievements[goal.id])
              : existingCheckIn?.achievement;

          const progress = calculateProgress(
            goal.uomType,
            goal.target,
            achievement
          );

          const isCompleted =
            existingCheckIn?.status === "COMPLETED";

          return (
            <Card
              key={goal.id}
              className={cn(
                isCompleted &&
                  "border-green-500/30 bg-green-500/5"
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-sm font-semibold">
                      {goal.title}
                    </CardTitle>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                        {goal.thrustArea}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        Target: {goal.target.toLocaleString()}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        Weight: {goal.weightage}%
                      </span>
                    </div>
                  </div>

                  {isCompleted ? (
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  ) : existingCheckIn ? (
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      Updated
                    </Badge>
                  ) : null}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>

                    <span
                      className={cn(
                        "font-semibold",
                        progress >= 100
                          ? "text-green-500"
                          : progress >= 75
                          ? "text-blue-500"
                          : progress >= 50
                          ? "text-yellow-500"
                          : "text-red-500"
                      )}
                    >
                      {progress}%
                    </span>
                  </div>

                  <Progress
                    value={Math.min(progress, 100)}
                    className={cn(
                      "h-2",
                      progress >= 100
                        ? "[&>div]:bg-green-500"
                        : progress >= 75
                        ? "[&>div]:bg-blue-500"
                        : progress >= 50
                        ? "[&>div]:bg-yellow-500"
                        : "[&>div]:bg-red-500"
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">
                      Actual Achievement
                    </Label>

                    <Input
                      type="number"
                      placeholder={
                        existingCheckIn?.achievement?.toString() ||
                        "Enter actual..."
                      }
                      value={
                        achievements[goal.id] ??
                        existingCheckIn?.achievement ??
                        ""
                      }
                      onChange={(e) =>
                        setAchievements((prev) => ({
                          ...prev,
                          [goal.id]: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">
                      Status
                    </Label>

                    <Select
                      defaultValue={
                        existingCheckIn?.status || "ON_TRACK"
                      }
                      onValueChange={(v) =>
                        setStatuses((prev) => ({
                          ...prev,
                          [goal.id]: v,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem
                            key={s.value}
                            value={s.value}
                          >
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {existingCheckIn?.managerComment && (
                  <div className="p-3 rounded-lg bg-muted text-xs">
                    <p className="font-medium text-muted-foreground mb-1">
                      Manager Feedback:
                    </p>

                    <p>{existingCheckIn.managerComment}</p>
                  </div>
                )}

                <Button
                  size="sm"
                  className="w-full"
                  disabled={saving[goal.id]}
                  onClick={() => handleSave(goal.id)}
                >
                  {saving[goal.id]
                    ? "Saving..."
                    : existingCheckIn
                    ? "Update Check-in"
                    : "Save Check-in"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}