import { z } from "zod";

export const goalSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().max(1000).optional(),
  thrustArea: z.string().min(1, "Thrust area is required"),
  uomType: z.enum(["NUMERIC_MIN", "NUMERIC_MAX", "TIMELINE", "ZERO"]),
  target: z.number().min(0),
  weightage: z.number()
    .min(10, "Minimum weightage is 10%")
    .max(100, "Maximum weightage is 100%"),
});

export const goalsSubmitSchema = z.object({
  goals: z
    .array(goalSchema)
    .min(1, "At least one goal required")
    .max(8, "Maximum 8 goals allowed")
    .refine(
      (goals) => goals.reduce((sum, g) => sum + g.weightage, 0) === 100,
      "Total weightage must equal exactly 100%"
    ),
});

export const approvalSchema = z.object({
  action: z.enum(["APPROVED", "REJECTED", "RETURNED"]),
  comment: z.string().max(1000).optional(),
  editedGoal: z.object({
    target: z.number().optional(),
    weightage: z.number().min(10).max(100).optional(),
  }).optional(),
});

export const checkInSchema = z.object({
  quarter: z.number().min(1).max(4),
  year: z.number().min(2020).max(2030),
  achievement: z.number().optional(),
  completionDate: z.string().optional(),
  status: z.enum(["NOT_STARTED", "ON_TRACK", "COMPLETED"]),
});