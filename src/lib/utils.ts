import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function getCurrentQuarter(): number {
  return Math.ceil((new Date().getMonth() + 1) / 3);
}

export function getQuarterLabel(q: number): string {
  const labels = ["", "Q1 (Jul)", "Q2 (Oct)", "Q3 (Jan)", "Q4/Annual (Mar)"];
  return labels[q] || `Q${q}`;
}

export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700 border-gray-200",
    SUBMITTED: "bg-yellow-100 text-yellow-700 border-yellow-200",
    APPROVED: "bg-blue-100 text-blue-700 border-blue-200",
    REJECTED: "bg-red-100 text-red-700 border-red-200",
    LOCKED: "bg-green-100 text-green-700 border-green-200",
    NOT_STARTED: "bg-gray-100 text-gray-700",
    ON_TRACK: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-green-100 text-green-700",
  };
  return colors[status] || "bg-gray-100 text-gray-700";
}