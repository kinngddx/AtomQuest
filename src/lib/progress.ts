export type UomType = "NUMERIC_MIN" | "NUMERIC_MAX" | "TIMELINE" | "ZERO";

export function calculateProgress(
  uomType: UomType,
  target: number,
  achievement: number | null | undefined,
  completionDate?: Date | null,
  deadline?: Date | null
): number {
  if (achievement === null || achievement === undefined) return 0;

  switch (uomType) {
    case "NUMERIC_MIN":
      // Higher is better (e.g., sales)
      if (target === 0) return 0;
      return Math.min(Math.round((achievement / target) * 100), 150);

    case "NUMERIC_MAX":
      // Lower is better (e.g., TAT, cost)
      if (achievement === 0) return 100;
      if (target === 0) return 0;
      return Math.min(Math.round((target / achievement) * 100), 150);

    case "ZERO":
      // Zero = success (e.g., safety incidents)
      return achievement === 0 ? 100 : 0;

    case "TIMELINE":
      // Date-based completion
      if (!completionDate || !deadline) return 0;
      return completionDate <= deadline ? 100 : 0;

    default:
      return 0;
  }
}

export function getProgressColor(progress: number): string {
  if (progress >= 100) return "text-green-500";
  if (progress >= 75) return "text-blue-500";
  if (progress >= 50) return "text-yellow-500";
  return "text-red-500";
}

export function getProgressBg(progress: number): string {
  if (progress >= 100) return "bg-green-500";
  if (progress >= 75) return "bg-blue-500";
  if (progress >= 50) return "bg-yellow-500";
  return "bg-red-500";
}