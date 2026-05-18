import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CheckSquare, TrendingUp, Clock } from "lucide-react";

export default async function ManagerDashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const manager = await db.user.findUnique({ where: { id: userId } });
  if (!manager || manager.role !== "MANAGER") redirect("/dashboard");

  const [teamMembers, pendingGoals, allTeamGoals] = await Promise.all([
    db.user.findMany({ where: { managerId: userId } }),
    db.goal.findMany({
      where: { status: "SUBMITTED", owner: { managerId: userId } },
      include: { owner: true },
    }),
    db.goal.findMany({
      where: { owner: { managerId: userId }, cycleYear: new Date().getFullYear() },
      include: { owner: true, checkIns: true },
    }),
  ]);

  const approvedGoals = allTeamGoals.filter((g) => ["APPROVED", "LOCKED"].includes(g.status));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manager Dashboard</h1>
        <p className="text-muted-foreground mt-1">FY {new Date().getFullYear()}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Team Members</p>
                <p className="text-2xl font-bold mt-1">{teamMembers.length}</p>
              </div>
              <div className="bg-primary/10 p-2 rounded-lg"><Users className="h-5 w-5 text-primary" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Approvals</p>
                <p className="text-2xl font-bold mt-1">{pendingGoals.length}</p>
              </div>
              <div className="bg-yellow-500/10 p-2 rounded-lg"><Clock className="h-5 w-5 text-yellow-500" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved Goals</p>
                <p className="text-2xl font-bold mt-1">{approvedGoals.length}</p>
              </div>
              <div className="bg-green-500/10 p-2 rounded-lg"><CheckSquare className="h-5 w-5 text-green-500" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Goals</p>
                <p className="text-2xl font-bold mt-1">{allTeamGoals.length}</p>
              </div>
              <div className="bg-primary/10 p-2 rounded-lg"><TrendingUp className="h-5 w-5 text-primary" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending approvals alert */}
      {pendingGoals.length > 0 && (
        <Card className="border-yellow-500/40">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Pending Approvals</CardTitle>
              <Link href="/manager/approvals">
                <Button size="sm">Review All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingGoals.slice(0, 3).map((goal) => (
              <div key={goal.id} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                <div>
                  <p className="font-medium">{goal.owner.name}</p>
                  <p className="text-xs text-muted-foreground">{goal.title}</p>
                </div>
                <Badge variant="secondary">Pending</Badge>
              </div>
            ))}
            {pendingGoals.length > 3 && (
              <p className="text-xs text-muted-foreground text-center pt-1">+{pendingGoals.length - 3} more</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Team members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Members</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {teamMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No team members assigned yet</p>
          ) : (
            <div className="divide-y divide-border">
              {teamMembers.map((member) => {
                const memberGoals = allTeamGoals.filter((g) => g.ownerId === member.id);
                const approved = memberGoals.filter((g) => ["APPROVED", "LOCKED"].includes(g.status)).length;
                return (
                  <div key={member.id} className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">
                        {member.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {approved}/{memberGoals.length} goals approved
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}