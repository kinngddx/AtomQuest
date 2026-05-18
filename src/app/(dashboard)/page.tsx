import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";

export default async function RootPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    // Auto-create user if not in DB yet
    const clerkUser = await currentUser();
    if (clerkUser) {
      await db.user.create({
        data: {
          id: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          name: `${clerkUser.firstName} ${clerkUser.lastName}`.trim(),
          role: (clerkUser.publicMetadata?.role as any) || "EMPLOYEE",
          department: (clerkUser.publicMetadata?.department as string) || "General",
        },
      });
    }
    redirect("/dashboard");
  }

  if (user.role === "ADMIN") redirect("/admin");
  if (user.role === "MANAGER") redirect("/manager");
  redirect("/dashboard");
}