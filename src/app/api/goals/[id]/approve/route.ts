// import { auth } from "@clerk/nextjs/server";
// import { NextRequest, NextResponse } from "next/server";
// import { db } from "@/lib/prisma";
// import { ApprovalAction } from "@prisma/client";

// export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
//   const { userId } = await auth();
//   if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//   const manager = await db.user.findUnique({ where: { id: userId } });
//   if (!manager || manager.role !== "MANAGER") {
//     return NextResponse.json({ error: "Only managers can approve goals" }, { status: 403 });
//   }

//   const { action, comment, editedGoal } = await req.json() as {
//     action: ApprovalAction;
//     comment?: string;
//     editedGoal?: { target?: number; weightage?: number };
//   };

//   const goal = await db.goal.findUnique({
//     where: { id: params.id },
//     include: { owner: true },
//   });

//   if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });
//   if (goal.owner.managerId !== userId) {
//     return NextResponse.json({ error: "Not authorized to approve this goal" }, { status: 403 });
//   }

//   const oldStatus = goal.status;

//   let updatedGoal;
//   if (action === "APPROVED") {
//     updatedGoal = await db.goal.update({
//       where: { id: params.id },
//       data: {
//         status: "LOCKED",
//         lockedAt: new Date(),
//         ...(editedGoal && {
//           target: editedGoal.target,
//           weightage: editedGoal.weightage,
//         }),
//       },
//     });
//   } else if (action === "REJECTED" || action === "RETURNED") {
//     updatedGoal = await db.goal.update({
//       where: { id: params.id },
//       data: { status: action === "REJECTED" ? "REJECTED" : "DRAFT" },
//     });
//   }

//   // Create approval record — action is now properly typed as ApprovalAction
//   await db.approval.create({
//     data: {
//       goalId: params.id,
//       managerId: userId,
//       action,
//       comment,
//     },
//   });

//   // Audit log
//   await db.auditLog.create({
//     data: {
//       goalId: params.id,
//       userId,
//       action: `GOAL_${action}`,
//       oldValue: { status: oldStatus } as object,
//       newValue: { status: updatedGoal?.status, comment: comment ?? null } as object,
//     },
//   });

//   return NextResponse.json(updatedGoal);
// }


import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { ApprovalAction } from "@prisma/client";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const manager = await db.user.findUnique({
    where: { id: userId },
  });

  if (!manager || manager.role !== "MANAGER") {
    return NextResponse.json(
      { error: "Only managers can approve goals" },
      { status: 403 }
    );
  }

  const { action, comment, editedGoal } = (await req.json()) as {
    action: ApprovalAction;
    comment?: string;
    editedGoal?: {
      target?: number;
      weightage?: number;
    };
  };

  const goal = await db.goal.findUnique({
    where: { id },
    include: { owner: true },
  });

  if (!goal) {
    return NextResponse.json(
      { error: "Goal not found" },
      { status: 404 }
    );
  }

  if (goal.owner.managerId !== userId) {
    return NextResponse.json(
      { error: "Not authorized to approve this goal" },
      { status: 403 }
    );
  }

  const oldStatus = goal.status;

  let updatedGoal;

  if (action === "APPROVED") {
    updatedGoal = await db.goal.update({
      where: { id },
      data: {
        status: "LOCKED",
        lockedAt: new Date(),
        ...(editedGoal && {
          target: editedGoal.target,
          weightage: editedGoal.weightage,
        }),
      },
    });
  } else if (action === "REJECTED" || action === "RETURNED") {
    updatedGoal = await db.goal.update({
      where: { id },
      data: {
        status: action === "REJECTED" ? "REJECTED" : "DRAFT",
      },
    });
  }

  await db.approval.create({
    data: {
      goalId: id,
      managerId: userId,
      action,
      comment,
    },
  });

  await db.auditLog.create({
    data: {
      goalId: id,
      userId,
      action: `GOAL_${action}`,
      oldValue: { status: oldStatus } as object,
      newValue: {
        status: updatedGoal?.status,
        comment: comment ?? null,
      } as object,
    },
  });

  return NextResponse.json(updatedGoal);
}