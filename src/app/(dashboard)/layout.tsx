// "use client";

// import { useState } from "react";
// import { usePathname } from "next/navigation";
// import { useUser } from "@clerk/nextjs";
// import Link from "next/link";
// import { cn } from "@/lib/utils";
// import {
//     // LogOut,menu
//   LayoutDashboard, Target, CheckSquare, Users, Settings,
//   ChevronLeft, Bell, Sun, Moon, BarChart3,
//   Calendar, Shield, TrendingUp
// } from "lucide-react";
// import { UserButton } from "@clerk/nextjs";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { useTheme } from "next-themes";
// import { Separator } from "@/components/ui/separator";
// import { LucideIcon } from "lucide-react";


// const employeeNav = [
//   { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
//   { href: "/goals", icon: Target, label: "My Goals" },
//   { href: "/checkins", icon: CheckSquare, label: "Check-ins" },
// ];

// const managerNav = [
//   { href: "/manager", icon: LayoutDashboard, label: "Dashboard" },
//   { href: "/manager/approvals", icon: CheckSquare, label: "Approvals", badge: "pending" },
//   { href: "/goals", icon: Target, label: "My Goals" },
//   { href: "/checkins", icon: Calendar, label: "Team Check-ins" },
// ];

// const adminNav = [
//   { href: "/admin", icon: BarChart3, label: "Analytics" },
//   { href: "/admin/cycles", icon: Calendar, label: "Cycles" },
//   { href: "/admin/users", icon: Users, label: "Users" },
//   { href: "/admin/audit", icon: Shield, label: "Audit Logs" },
//   { href: "/goals", icon: Target, label: "All Goals" },
// ];

// export default function DashboardLayout({ children }: { children: React.ReactNode }) {
//   const [collapsed, setCollapsed] = useState(false);
//   const pathname = usePathname();
//   const { user } = useUser();
//   const { theme, setTheme } = useTheme();

//   const role = (user?.publicMetadata?.role as string) || "EMPLOYEE";
//   const navItems = role === "ADMIN" ? adminNav : role === "MANAGER" ? managerNav : employeeNav;

//   return (
//     <div className="flex h-screen overflow-hidden bg-background">
//       {/* Sidebar */}
//       <aside className={cn(
//         "flex flex-col bg-card border-r border-border transition-all duration-300 relative z-10",
//         collapsed ? "w-16" : "w-60"
//       )}>
//         {/* Logo */}
//         <div className={cn("flex items-center h-16 px-4 border-b border-border", collapsed && "justify-center")}>
//           {!collapsed && (
//             <div className="flex items-center gap-2">
//               <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
//                 <TrendingUp className="h-4 w-4 text-primary-foreground" />
//               </div>
//               <span className="font-bold text-lg tracking-tight">GoalTrack</span>
//             </div>
//           )}
//           {collapsed && (
//             <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
//               <TrendingUp className="h-4 w-4 text-primary-foreground" />
//             </div>
//           )}
//         </div>

//         {/* Role badge */}
//         {!collapsed && (
//           <div className="px-4 py-3">
//             <Badge variant={role === "ADMIN" ? "destructive" : role === "MANAGER" ? "default" : "secondary"}
//               className="text-xs font-medium">
//               {role}
//             </Badge>
//           </div>
//         )}

//         {/* Navigation */}
//         <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
//           {navItems.map((item) => {
//             const isActive = pathname === item.href;
//             return (
//               <Link key={item.href} href={item.href}>
//                 <div className={cn(
//                   "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
//                   "hover:bg-accent hover:text-accent-foreground",
//                   isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
//                   collapsed && "justify-center px-2"
//                 )}>
//                   <item.icon className="h-4 w-4 flex-shrink-0" />
//                   {!collapsed && (
//                     <>
//                       <span>{item.label}</span>
//                       {type NavItem = {
//   href: string;
//   icon: LucideIcon;
//   label: string;
//   badge?: string;
// };&& (
//                         <Badge variant="secondary" className="ml-auto text-xs">3</Badge>
//                       )}
//                     </>
//                   )}
//                 </div>
//               </Link>
//             );
//           })}
//         </nav>

//         <Separator />

//         {/* Bottom section */}
//         <div className={cn("p-3 space-y-2", collapsed && "flex flex-col items-center")}>
//           <Button
//             variant="ghost"
//             size="sm"
//             className={cn("w-full", collapsed && "w-9 p-0")}
//             onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
//           >
//             {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
//             {!collapsed && <span className="ml-2">Toggle Theme</span>}
//           </Button>
//           <Link href="/settings" className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-accent w-full", collapsed && "justify-center px-2 w-auto")}>
//             <Settings className="h-4 w-4 flex-shrink-0" />
//             {!collapsed && <span>Settings</span>}
//           </Link>
//         </div>

//         {/* Collapse button */}
//         <Button
//           variant="ghost"
//           size="icon"
//           className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-border bg-background"
//           onClick={() => setCollapsed(!collapsed)}
//         >
//           <ChevronLeft className={cn("h-3 w-3 transition-transform", collapsed && "rotate-180")} />
//         </Button>
//       </aside>

//       {/* Main content */}
//       <div className="flex-1 flex flex-col overflow-hidden">
//         {/* Header */}
//         <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
//           <div className="flex items-center gap-4">
//             <h2 className="font-semibold text-foreground">
//               {navItems.find(n => n.href === pathname)?.label || "GoalTrack"}
//             </h2>
//           </div>
//           <div className="flex items-center gap-3">
//             <Button variant="ghost" size="icon" className="relative">
//               <Bell className="h-4 w-4" />
//               <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
//             </Button>
//            {/* <UserButton signOutUrl="/sign-in" /> */}
//            <UserButton />
//           </div>
//         </header>

//         {/* Page content */}
//         <main className="flex-1 overflow-y-auto p-6">
//           {children}
//         </main>
//       </div>
//     </div>
//   );
// }








"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Target,
  CheckSquare,
  Users,
  Settings,
  ChevronLeft,
  Bell,
  Sun,
  Moon,
  BarChart3,
  Calendar,
  Shield,
  TrendingUp,
} from "lucide-react";

import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import { Separator } from "@/components/ui/separator";
import { LucideIcon } from "lucide-react";

/* TYPES */
type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: string;
};

/* NAV DATA */
const employeeNav: NavItem[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/goals", icon: Target, label: "My Goals" },
  { href: "/checkins", icon: CheckSquare, label: "Check-ins" },
];

const managerNav: NavItem[] = [
  { href: "/manager", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/manager/approvals", icon: CheckSquare, label: "Approvals", badge: "pending" },
  { href: "/goals", icon: Target, label: "My Goals" },
  { href: "/checkins", icon: Calendar, label: "Team Check-ins" },
];

const adminNav: NavItem[] = [
  { href: "/admin", icon: BarChart3, label: "Analytics" },
  { href: "/admin/cycles", icon: Calendar, label: "Cycles" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/audit", icon: Shield, label: "Audit Logs" },
  { href: "/goals", icon: Target, label: "All Goals" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user } = useUser();
  const { theme, setTheme } = useTheme();

  const role = (user?.publicMetadata?.role as string) || "EMPLOYEE";

  const navItems =
    role === "ADMIN"
      ? adminNav
      : role === "MANAGER"
      ? managerNav
      : employeeNav;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col bg-card border-r border-border transition-all duration-300 relative z-10",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex items-center h-16 px-4 border-b border-border",
            collapsed && "justify-center"
          )}
        >
          <TrendingUp className="h-8 w-8 text-primary" />
          {!collapsed && (
            <span className="ml-2 font-bold text-lg">GoalTrack</span>
          )}
        </div>

        {/* Role badge */}
        {!collapsed && (
          <div className="px-4 py-3">
            <Badge
              variant={
                role === "ADMIN"
                  ? "destructive"
                  : role === "MANAGER"
                  ? "default"
                  : "secondary"
              }
            >
              {role}
            </Badge>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-2 py-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive &&
                      "bg-primary text-primary-foreground hover:bg-primary",
                    collapsed && "justify-center"
                  )}
                >
                  <item.icon className="h-4 w-4" />

                  {!collapsed && (
                    <>
                      <span>{item.label}</span>

                      {item.badge && (
                        <Badge className="ml-auto text-xs" variant="secondary">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <Separator />

        {/* Bottom */}
        <div className="p-3 space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() =>
              setTheme(theme === "dark" ? "light" : "dark")
            }
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            {!collapsed && <span className="ml-2">Theme</span>}
          </Button>
        </div>

        {/* Collapse */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-20 h-6 w-6 rounded-full"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronLeft
            className={cn(
              "h-3 w-3 transition-transform",
              collapsed && "rotate-180"
            )}
          />
        </Button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b flex items-center justify-between px-6">
          <h2 className="font-semibold">
            {navItems.find((n) => n.href === pathname)?.label ||
              "GoalTrack"}
          </h2>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon">
              <Bell className="h-4 w-4" />
            </Button>

            <UserButton />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}