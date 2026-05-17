import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Lock, Clock, CheckCircle, XCircle, FileText } from "lucide-react";

const STATUS_CONFIG = {
  DRAFT: { label: "Draft", icon: FileText, className: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300" },
  SUBMITTED: { label: "Pending Review", icon: Clock, className: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400" },
  APPROVED: { label: "Approved", icon: CheckCircle, className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400" },
  REJECTED: { label: "Rejected", icon: XCircle, className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400" },
  LOCKED: { label: "Active & Locked", icon: Lock, className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400" },
};

export function GoalStatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  const Icon = config.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border", config.className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}