"use client";
import type { JsonValue } from "@prisma/client/runtime/library";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Users, Target, CheckCircle, Clock, TrendingUp,
  Download, RefreshCw, Shield, BarChart3, Activity,
  AlertTriangle
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import * as XLSX from "xlsx";

// ─── Types ───────────────────────────────────────────────────────────────────

type StatItem = { name: string; count: number };

type CheckInQuarter = {
  quarter: string;
  completed: number;
  total: number;
};

type MonthlyCheckIn = {
  quarter: string;
  completed: number;
  total: number;
};




type AuditLog = {
  id: string;
  action: string;
  createdAt: Date | string;
  userId: string;
  goalId?: string | null;
  oldValue?: JsonValue | null;
  newValue?: JsonValue | null;
  user: { id: string; name: string; email: string; role: string };
  goal?: { id: string; title: string } | null;
};

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string | null;
  createdAt: Date | string;
};

type Stats = {
  totalUsers: number;
  totalGoals: number;
  approvedGoals: number;
  pendingApprovals: number;
  checkInCompletion: number;
  byDepartment: StatItem[];
  byThrustArea: StatItem[];
  byStatus: StatItem[];
  monthlyCheckIns: MonthlyCheckIn[];
  users: User[];
  currentQuarter: number;
  currentYear: number;
};

interface Props {
  stats: Stats;
  auditLogs: AuditLog[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  SUBMITTED: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  APPROVED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  LOCKED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

const AUDIT_COLORS: Record<string, string> = {
  GOAL_APPROVED: "bg-green-500",
  GOAL_REJECTED: "bg-red-500",
  GOAL_RETURNED: "bg-yellow-500",
  GOAL_SUBMITTED: "bg-blue-500",
  CHECKIN_SUBMITTED: "bg-purple-500",
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  MANAGER: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  EMPLOYEE: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

function KPICard({
  title, value, subtitle, icon: Icon, variant = "default",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  variant?: "default" | "success" | "warning" | "danger";
}) {
  const variants = {
    default: "border-border",
    success: "border-green-500/20 bg-green-500/5",
    warning: "border-yellow-500/20 bg-yellow-500/5",
    danger: "border-red-500/20 bg-red-500/5",
  };
  const iconVariants = {
    default: "bg-primary/10 text-primary",
    success: "bg-green-500/10 text-green-500",
    warning: "bg-yellow-500/10 text-yellow-500",
    danger: "bg-red-500/10 text-red-500",
  };
  return (
    <div className={cn("rounded-xl border p-5 bg-card transition-all hover:shadow-md", variants[variant])}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={cn("rounded-lg p-2.5", iconVariants[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminDashboardClient({ stats, auditLogs }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  const exportToExcel = () => {
    try {
      const wsData = stats.users.map((u) => ({
        Name: u.name,
        Email: u.email,
        Role: u.role,
        Department: u.department || "General",
        "Joined On": formatDate(u.createdAt),
      }));
      const ws = XLSX.utils.json_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Users");

      const statsWs = XLSX.utils.json_to_sheet([
        { Metric: "Total Users", Value: stats.totalUsers },
        { Metric: "Total Goals", Value: stats.totalGoals },
        { Metric: "Approved Goals", Value: stats.approvedGoals },
        { Metric: "Pending Approvals", Value: stats.pendingApprovals },
        { Metric: "Check-in Completion %", Value: Math.round(stats.checkInCompletion) },
      ]);
      XLSX.utils.book_append_sheet(wb, statsWs, "Stats");
      XLSX.writeFile(wb, `GoalTrack_Report_${stats.currentYear}.xlsx`);
      toast.success("Report exported successfully!");
    } catch {
      toast.error("Export failed. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Analytics</h1>
          <p className="text-muted-foreground mt-1">
            FY {stats.currentYear} · Q{stats.currentQuarter} Active
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.refresh()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Total Employees"
          value={stats.totalUsers}
          subtitle="Registered users"
          icon={Users}
        />
        <KPICard
          title="Total Goals"
          value={stats.totalGoals}
          subtitle={`FY ${stats.currentYear}`}
          icon={Target}
        />
        <KPICard
          title="Approved Goals"
          value={stats.approvedGoals}
          subtitle={`${stats.totalGoals > 0 ? Math.round((stats.approvedGoals / stats.totalGoals) * 100) : 0}% approval rate`}
          icon={CheckCircle}
          variant="success"
        />
        <KPICard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          subtitle="Needs manager action"
          icon={Clock}
          variant={stats.pendingApprovals > 0 ? "warning" : "default"}
        />
        <KPICard
          title="Check-in Rate"
          value={`${Math.round(stats.checkInCompletion)}%`}
          subtitle="This quarter"
          icon={TrendingUp}
          variant={stats.checkInCompletion >= 75 ? "success" : stats.checkInCompletion >= 50 ? "warning" : "danger"}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="overview">
            <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="completion">
            <Activity className="h-3.5 w-3.5 mr-1.5" />
            Check-ins
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-3.5 w-3.5 mr-1.5" />
            Users
          </TabsTrigger>
          <TabsTrigger value="audit">
            <Shield className="h-3.5 w-3.5 mr-1.5" />
            Audit Log
          </TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Goals by Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Goals by Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.byStatus.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
                ) : (
                  stats.byStatus.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <span className={cn("text-xs font-medium px-2 py-1 rounded-md", STATUS_COLORS[item.name] || "bg-secondary text-secondary-foreground")}>
                        {item.name}
                      </span>
                      <div className="flex items-center gap-3 flex-1 ml-3">
                        <Progress
                          value={stats.totalGoals > 0 ? (Number(item.count) / stats.totalGoals) * 100 : 0}
                          className="flex-1 h-1.5"
                        />
                        <span className="text-sm font-semibold w-6 text-right">{item.count}</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Goals by Department */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Goals by Department
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.byDepartment.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
                ) : (
                  stats.byDepartment.map((item) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground truncate max-w-[120px]">{item.name}</span>
                        <span className="font-semibold">{item.count}</span>
                      </div>
                      <Progress
                        value={stats.totalGoals > 0 ? (Number(item.count) / stats.totalGoals) * 100 : 0}
                        className="h-1.5"
                      />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Goals by Thrust Area */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Goals by Thrust Area
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.byThrustArea.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
                ) : (
                  stats.byThrustArea.slice(0, 7).map((item) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground truncate max-w-[140px]">{item.name}</span>
                        <span className="font-semibold">{item.count}</span>
                      </div>
                      <Progress
                        value={stats.totalGoals > 0 ? (Number(item.count) / stats.totalGoals) * 100 : 0}
                        className="h-1.5"
                      />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Check-ins Tab ── */}
        <TabsContent value="completion" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quarterly Check-in Completion</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.monthlyCheckIns.every((q) => q.total === 0) ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertTriangle className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">No check-in data yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Check-ins will appear here once employees submit quarterly updates
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {stats.monthlyCheckIns.map((q) => {
                    const rate = q.total > 0 ? Math.round((q.completed / q.total) * 100) : 0;
                    return (
                      <div key={q.quarter} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{q.quarter}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground text-xs">
                              {q.completed}/{q.total} completed
                            </span>
                            <span className={cn("font-bold text-sm",
                              rate >= 75 ? "text-green-500" :
                              rate >= 50 ? "text-yellow-500" : "text-red-500"
                            )}>
                              {rate}%
                            </span>
                          </div>
                        </div>
                        <Progress
                          value={rate}
                          className={cn("h-3",
                            rate >= 75 ? "[&>div]:bg-green-500" :
                            rate >= 50 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-red-500"
                          )}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Heatmap */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Department × Quarter Heatmap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      <th className="text-left font-medium text-muted-foreground pb-3 pr-4 w-32">Department</th>
                      {["Q1", "Q2", "Q3", "Q4"].map((q) => (
                        <th key={q} className="text-center font-medium text-muted-foreground pb-3 px-2">{q}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.byDepartment.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-muted-foreground py-6">No department data</td>
                      </tr>
                    ) : (
                      stats.byDepartment.map((dept) => (
                        <tr key={dept.name} className="border-t border-border">
                          <td className="py-2 pr-4 text-muted-foreground truncate max-w-[120px]">{dept.name}</td>
                          {[0, 1, 2, 3].map((qi) => {
                            const q = stats.monthlyCheckIns[qi];
                            const rate = q && q.total > 0 ? Math.round((q.completed / q.total) * 100) : 0;
                            return (
                              <td key={qi} className="px-2 py-2 text-center">
                                <span className={cn(
                                  "inline-block px-2 py-1 rounded text-xs font-medium min-w-[40px]",
                                  rate === 0 ? "bg-secondary text-muted-foreground" :
                                  rate >= 80 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                  rate >= 60 ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                                  rate >= 40 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                )}>
                                  {rate > 0 ? `${rate}%` : "—"}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Users Tab ── */}
        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">All Users ({stats.users.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {stats.users.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  No users found
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {stats.users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                          {user.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {user.department || "General"}
                        </span>
                        <span className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded",
                          ROLE_COLORS[user.role] || ROLE_COLORS.EMPLOYEE
                        )}>
                          {user.role}
                        </span>
                        <span className="text-xs text-muted-foreground hidden sm:block">
                          Joined {formatDate(user.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Audit Log Tab ── */}
        <TabsContent value="audit" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Audit Trail</CardTitle>
              <Badge variant="secondary">{auditLogs.length} entries</Badge>
            </CardHeader>
            <CardContent className="p-0">
              {auditLogs.length === 0 ? (
                <div className="py-12 text-center">
                  <Shield className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No audit entries yet</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-4 px-6 py-3">
                      <div className={cn(
                        "h-2 w-2 rounded-full mt-2 flex-shrink-0",
                        AUDIT_COLORS[log.action] || "bg-gray-400"
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">
                            {log.action.replace(/_/g, " ")}
                          </span>
                          {log.goal && (
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                              — {log.goal.title}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {log.user.name} · {log.user.role} · {formatDate(log.createdAt)}
                        </p>
                        {(log.oldValue || log.newValue) && (
                          <div className="flex items-center gap-3 mt-1 text-xs">
                            {log.oldValue && (
                              <span className="text-red-500">
                                Before: {JSON.stringify(log.oldValue)}
                              </span>
                            )}
                            {log.newValue && (
                              <span className="text-green-600">
                                After: {JSON.stringify(log.newValue)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}