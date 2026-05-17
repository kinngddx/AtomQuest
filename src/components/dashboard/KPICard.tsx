"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
}

export function KPICard({ title, value, subtitle, icon: Icon, trend, variant = "default", className }: KPICardProps) {
  const variants = {
    default: "border-border bg-card",
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
    <div className={cn("rounded-xl border p-5 transition-all hover:shadow-md", variants[variant], className)}>
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
      {trend && (
        <div className={cn("flex items-center gap-1 mt-3 text-xs font-medium",
          trend.value >= 0 ? "text-green-500" : "text-red-500")}>
          <span>{trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%</span>
          <span className="text-muted-foreground font-normal">{trend.label}</span>
        </div>
      )}
    </div>
  );
}