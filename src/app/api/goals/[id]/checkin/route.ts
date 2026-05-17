import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { quarter, year, achievement, completionDate, status, managerComment } = await req.json();

  const goal = await db.goal.findUnique({ where: { id: params.id } });
  if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

  const checkIn = await db.checkIn.upsert({
    where: { goalId_userId_quarter_year: { goalId: params.id, userId, quarter, year } },
    update: {
      achievement: achievement !== undefined ? Number(achievement) : undefined,
      completionDate: completionDate ? new Date(completionDate) : undefined,
      status,
      managerComment,
    },
    create: {
      goalId: params.id,
      userId,
      quarter,
      year,
      achievement: achievement !== undefined ? Number(achievement) : undefined,
      completionDate: completionDate ? new Date(completionDate) : undefined,
      status: status || "ON_TRACK",
    },
  });

  // Sync shared goal copies if this is a parent goal
  if (goal.isShared) {
    const copies = await db.goal.findMany({ where: { parentGoalId: params.id } });
    for (const copy of copies) {
      await db.checkIn.upsert({
        where: { goalId_userId_quarter_year: { goalId: copy.id, userId: copy.ownerId, quarter, year } },
        update: { achievement, completionDate: completionDate ? new Date(completionDate) : undefined, status },
        create: { goalId: copy.id, userId: copy.ownerId, quarter, year, achievement, status: status || "ON_TRACK" },
      });
    }
  }

  return NextResponse.json(checkIn);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "MANAGER") {
    return NextResponse.json({ error: "Only managers can add comments" }, { status: 403 });
  }

  const { checkInId, managerComment } = await req.json();

  const updated = await db.checkIn.update({
    where: { id: checkInId },
    data: { managerComment, managerId: userId },
  });

  return NextResponse.json(updated);
}