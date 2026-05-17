import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { z } from "zod";

const goalSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  thrustArea: z.string().min(1),
  uomType: z.enum(["NUMERIC_MIN", "NUMERIC_MAX", "TIMELINE", "ZERO"]),
  target: z.number(),
  weightage: z.number().min(10).max(100),
});

const createGoalsSchema = z.object({
  goals: z.array(goalSchema).min(1).max(8),
  action: z.enum(["draft", "submit"]),
});

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");
  const status = searchParams.get("status");

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // let where: any = {};
  // ❌ BEFORE


// ✅ AFTER
const where: {
  ownerId?: string;
  status?: string;
  owner?: { managerId: string };
} = {};

  if (user.role === "EMPLOYEE") {
    where.ownerId = userId;
  } else if (user.role === "MANAGER") {
    if (employeeId) {
      where.ownerId = employeeId;
    } else {
      where.owner = { managerId: userId };
    }
  }
  // ADMIN can see all

  if (status) where.status = status;

  const goals = await db.goal.findMany({
    
    include: {
      owner: true,
      checkIns: { orderBy: { quarter: "desc" } },
      approvals: { include: { manager: true }, orderBy: { createdAt: "desc" } },
      auditLogs: { include: { user: true }, orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(goals);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createGoalsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.issues }, { status: 400 });
  }

  const { goals, action } = parsed.data;

  // Validate total weightage
  const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
  if (action === "submit" && totalWeightage !== 100) {
    return NextResponse.json({ error: "Total weightage must equal 100%" }, { status: 400 });
  }

  const currentYear = new Date().getFullYear();
  const status = action === "submit" ? "SUBMITTED" : "DRAFT";

  const createdGoals = await db.$transaction(
    goals.map(goal =>
      db.goal.create({
        data: {
          ...goal,
          ownerId: userId,
          cycleYear: currentYear,
          status,
        },
      })
    )
  );

  // Audit log
  if (action === "submit") {
    await db.auditLog.createMany({
      data: createdGoals.map(goal => ({
        goalId: goal.id,
        userId,
        action: "GOAL_SUBMITTED",
        newValue: { status: "SUBMITTED", title: goal.title },
      })),
    });
  }

  return NextResponse.json(createdGoals, { status: 201 });
}