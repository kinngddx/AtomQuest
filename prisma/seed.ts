import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // NOTE: These IDs must match actual Clerk user IDs
  // After creating users in Clerk, update these IDs
  // OR: Create users via Clerk dashboard and set publicMetadata.role

  // Create demo users (replace with actual Clerk IDs after creating accounts)
  const admin = await prisma.user.upsert({
    where: { email: "admin@goaltrack.com" },
    update: {},
    create: {
      id: "user_demo_admin", // Replace with actual Clerk ID
      email: "admin@goaltrack.com",
      name: "Admin User",
      role: "ADMIN",
      department: "HR",
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@goaltrack.com" },
    update: {},
    create: {
      id: "user_demo_manager", // Replace with actual Clerk ID
      email: "manager@goaltrack.com",
      name: "Sarah Manager",
      role: "MANAGER",
      department: "Sales",
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: "employee@goaltrack.com" },
    update: {},
    create: {
      id: "user_demo_employee", // Replace with actual Clerk ID
      email: "employee@goaltrack.com",
      name: "John Employee",
      role: "EMPLOYEE",
      department: "Sales",
      managerId: manager.id,
    },
  });

  // Create demo goals
  const goals = await Promise.all([
    prisma.goal.create({
      data: {
        title: "Achieve ₹1.2Cr in Annual Sales Revenue",
        description: "Drive B2B sales to achieve the annual target across all regions",
        thrustArea: "Revenue Growth",
        uomType: "NUMERIC_MIN",
        target: 12000000,
        weightage: 30,
        status: "LOCKED",
        cycleYear: new Date().getFullYear(),
        lockedAt: new Date(),
        ownerId: employee.id,
      },
    }),
    prisma.goal.create({
      data: {
        title: "Maintain Customer NPS above 65",
        description: "Ensure quarterly NPS scores remain above 65 through proactive engagement",
        thrustArea: "Customer Satisfaction",
        uomType: "NUMERIC_MIN",
        target: 65,
        weightage: 25,
        status: "LOCKED",
        cycleYear: new Date().getFullYear(),
        lockedAt: new Date(),
        ownerId: employee.id,
      },
    }),
    prisma.goal.create({
      data: {
        title: "Reduce TAT from 5 days to 3 days",
        description: "Streamline order processing to reduce turnaround time",
        thrustArea: "Operational Excellence",
        uomType: "NUMERIC_MAX",
        target: 3,
        weightage: 20,
        status: "LOCKED",
        cycleYear: new Date().getFullYear(),
        lockedAt: new Date(),
        ownerId: employee.id,
      },
    }),
    prisma.goal.create({
      data: {
        title: "Zero Safety Incidents",
        description: "Maintain zero safety incidents throughout the year",
        thrustArea: "Safety & Environment",
        uomType: "ZERO",
        target: 0,
        weightage: 15,
        status: "LOCKED",
        cycleYear: new Date().getFullYear(),
        lockedAt: new Date(),
        ownerId: employee.id,
      },
    }),
    prisma.goal.create({
      data: {
        title: "Complete Digital Upskilling Program",
        description: "Complete assigned digital transformation courses by Q3",
        thrustArea: "People Development",
        uomType: "TIMELINE",
        target: 100,
        weightage: 10,
        status: "LOCKED",
        cycleYear: new Date().getFullYear(),
        lockedAt: new Date(),
        ownerId: employee.id,
      },
    }),
  ]);

  // Create sample check-ins
  const currentYear = new Date().getFullYear();
  for (const goal of goals.slice(0, 3)) {
    await prisma.checkIn.upsert({
      where: { goalId_userId_quarter_year: { goalId: goal.id, userId: employee.id, quarter: 1, year: currentYear } },
      update: {},
      create: {
        goalId: goal.id,
        userId: employee.id,
        quarter: 1,
        year: currentYear,
        achievement: goal.uomType === "ZERO" ? 0 : goal.target * 0.65,
        status: "ON_TRACK",
      },
    });
  }

  // Create audit logs
  await prisma.auditLog.createMany({
    data: [
      { goalId: goals[0].id, userId: manager.id, action: "GOAL_APPROVED", newValue: { status: "LOCKED" } },
      { goalId: goals[1].id, userId: manager.id, action: "GOAL_APPROVED", newValue: { status: "LOCKED" } },
      { goalId: goals[0].id, userId: employee.id, action: "CHECKIN_SUBMITTED", newValue: { quarter: 1, achievement: goals[0].target * 0.65 } },
    ],
  });

  // Create active cycle
  await prisma.cycle.upsert({
    where: { year_phase: { year: currentYear, phase: "Q1" } },
    update: { isActive: true },
    create: {
      year: currentYear,
      phase: "Q1",
      isActive: true,
      opensAt: new Date(`${currentYear}-07-01`),
      closesAt: new Date(`${currentYear}-08-31`),
    },
  });

  console.log("✅ Seed complete!");
  console.log("Demo accounts:");
  console.log(`  Admin: admin@goaltrack.com`);
  console.log(`  Manager: manager@goaltrack.com`);
  console.log(`  Employee: employee@goaltrack.com`);
}

main().catch(console.error).finally(() => prisma.$disconnect());