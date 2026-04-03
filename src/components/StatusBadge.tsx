import { cn } from "@/lib/utils";
import { UserState } from "@/types/api";

interface StatusBadgeProps {
  status: UserState | "online" | "offline" | "degraded";
}

const labelMap: Record<StatusBadgeProps["status"], string> = {
  NORMAL: "Normal",
  THROTTLED: "Throttled",
  online: "Online",
  offline: "Offline",
  degraded: "Degraded",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
        status === "NORMAL" || status === "online"
          ? "bg-success/15 text-success"
          : status === "THROTTLED"
            ? "bg-warning/15 text-warning"
            : "bg-danger/15 text-danger",
      )}
    >
      {labelMap[status]}
    </span>
  );
}
