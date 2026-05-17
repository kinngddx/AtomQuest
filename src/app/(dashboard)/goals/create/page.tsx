"use client";


import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray,useWatch } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const THRUST_AREAS = [
  "Revenue Growth", "Customer Satisfaction", "Operational Excellence",
  "People Development", "Digital Transformation", "Cost Optimization",
  "Quality & Compliance", "Innovation", "Safety & Environment"
];

const UOM_TYPES = [
  { value: "NUMERIC_MIN", label: "Numeric (Higher is Better)", description: "e.g., Sales Revenue, Units Produced" },
  { value: "NUMERIC_MAX", label: "Numeric (Lower is Better)", description: "e.g., TAT, Cost, Error Rate" },
  { value: "TIMELINE", label: "Timeline (Date-based)", description: "e.g., Project Completion" },
  { value: "ZERO", label: "Zero-based", description: "e.g., Safety Incidents, Defects" },
];

const goalItemSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  thrustArea: z.string().min(1, "Select a thrust area"),
  uomType: z.enum(["NUMERIC_MIN", "NUMERIC_MAX", "TIMELINE", "ZERO"]),
  target: z.number().min(0, "Target must be positive"),
  weightage: z.number().min(10, "Min weightage is 10%").max(100, "Max weightage is 100%"),
});

const formSchema = z.object({
  goals: z.array(goalItemSchema)
    .min(1, "Add at least one goal")
    .max(8, "Maximum 8 goals allowed")
    .refine(
      (goals) => goals.reduce((sum, g) => sum + g.weightage, 0) === 100,
      { message: "Total weightage must equal exactly 100%" }
    ),
});

type FormData = z.infer<typeof formSchema>;

export default function CreateGoalsPage() {
  const router = useRouter();
  // const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      goals: [{ title: "", description: "", thrustArea: "", uomType: "NUMERIC_MIN", target: 0, weightage: 100 }]
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "goals" });

  // const watchedGoals = form.watch("goals");
  const watchedGoals = useWatch({ control: form.control, name: "goals" }) ?? form.getValues("goals")
  const totalWeightage = watchedGoals.reduce((sum, g) => sum + (Number(g.weightage) || 0), 0);
  const remainingWeightage = 100 - totalWeightage;
  const isWeightageValid = totalWeightage === 100;

  const addGoal = () => {
    if (fields.length >= 8) {
      toast.error("Maximum 8 goals allowed");
      return;
    }
    const suggestedWeightage = Math.max(10, Math.floor(remainingWeightage));
    append({ title: "", description: "", thrustArea: "", uomType: "NUMERIC_MIN", target: 0, weightage: suggestedWeightage });
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals: data.goals, action: "submit" }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit goals");
      }

      toast.success("Goals submitted for approval!");
      router.push("/goals");
 } catch (error) {
  const message =
    error instanceof Error
      ? error.message
      : "Something went wrong";

  toast.error(message);
} finally {
      setIsSubmitting(false);
    }
  };

  const saveDraft = async () => {
    const values = form.getValues();
    try {
      await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals: values.goals, action: "draft" }),
      });
      toast.success("Draft saved!");
    } catch {
      toast.error("Failed to save draft");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Create Goals</h1>
          <p className="text-muted-foreground mt-1">Define your annual goals for {new Date().getFullYear()}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={fields.length >= 8 ? "destructive" : "secondary"}>
            {fields.length}/8 Goals
          </Badge>
        </div>
      </div>

      {/* Weightage Progress */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Total Weightage</span>
            <div className="flex items-center gap-2">
              <span className={cn("text-sm font-bold", isWeightageValid ? "text-green-500" : totalWeightage > 100 ? "text-red-500" : "text-yellow-500")}>
                {totalWeightage}%
              </span>
              {isWeightageValid ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              )}
            </div>
          </div>
          <Progress value={Math.min(totalWeightage, 100)} className={cn(
            isWeightageValid ? "[&>div]:bg-green-500" :
            totalWeightage > 100 ? "[&>div]:bg-red-500" : "[&>div]:bg-yellow-500"
          )} />
          {!isWeightageValid && (
            <p className="text-xs text-muted-foreground mt-2">
              {totalWeightage > 100 ? `Over by ${totalWeightage - 100}%` : `${remainingWeightage}% remaining`}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Validation alerts */}
      {form.formState.errors.goals?.root && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{form.formState.errors.goals.root.message}</AlertDescription>
        </Alert>
      )}

      {/* Goal Forms */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {fields.map((field, index) => (
          <Card key={field.id} className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Goal {index + 1}</CardTitle>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Title */}
                <div className="col-span-2 space-y-1">
                  <Label>Goal Title *</Label>
                  <Input
                    {...form.register(`goals.${index}.title`)}
                    placeholder="e.g., Achieve ₹50L in Q4 Sales Revenue"
                  />
                  {form.formState.errors.goals?.[index]?.title && (
                    <p className="text-xs text-destructive">{form.formState.errors.goals[index]?.title?.message}</p>
                  )}
                </div>

                {/* Thrust Area */}
                <div className="space-y-1">
                  <Label>Thrust Area *</Label>
                  <Select onValueChange={(v) => form.setValue(`goals.${index}.thrustArea`, v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select area..." />
                    </SelectTrigger>
                    <SelectContent>
                      {THRUST_AREAS.map((area) => (
                        <SelectItem key={area} value={area}>{area}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* UoM Type */}
                <div className="space-y-1">
                  <Label>Unit of Measurement *</Label>
<Select onValueChange={(v) => form.setValue(`goals.${index}.uomType`, v as "NUMERIC_MIN" | "NUMERIC_MAX" | "TIMELINE" | "ZERO")}>                    <SelectTrigger>
                      <SelectValue placeholder="Select UoM..." />
                    </SelectTrigger>
                    <SelectContent>
                      {UOM_TYPES.map((uom) => (
                        <SelectItem key={uom.value} value={uom.value}>
                          <div>
                            <div className="font-medium">{uom.label}</div>
                            <div className="text-xs text-muted-foreground">{uom.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Target */}
                <div className="space-y-1">
                  <Label>Target Value *</Label>
                  <Input
                    type="number"
                    {...form.register(`goals.${index}.target`, { valueAsNumber: true })}
                    placeholder="Enter target..."
                  />
                </div>

                {/* Weightage */}
                <div className="space-y-1">
                  <Label>Weightage (%) * <span className="text-xs text-muted-foreground">min 10%</span></Label>
                  <Input
                    type="number"
                    min={10}
                    max={100}
                    {...form.register(`goals.${index}.weightage`, { valueAsNumber: true })}
                    placeholder="e.g., 20"
                    className={form.formState.errors.goals?.[index]?.weightage ? "border-destructive" : ""}
                  />
                  {form.formState.errors.goals?.[index]?.weightage && (
                    <p className="text-xs text-destructive">{form.formState.errors.goals[index]?.weightage?.message}</p>
                  )}
                </div>

                {/* Description */}
                <div className="col-span-2 space-y-1">
                  <Label>Description (Optional)</Label>
                  <Textarea
                    {...form.register(`goals.${index}.description`)}
                    placeholder="Provide additional context, milestones, or success criteria..."
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Add Goal Button */}
        {fields.length < 8 && (
          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed"
            onClick={addGoal}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Goal ({fields.length}/8)
          </Button>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button type="button" variant="outline" onClick={saveDraft}>
            Save as Draft
          </Button>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => router.push("/goals")}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isWeightageValid}
              className="min-w-32"
            >
              {isSubmitting ? "Submitting..." : "Submit for Approval"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}