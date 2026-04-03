import { cn, formatPercentage } from "@/lib/utils";

interface QuotaProgressBarProps {
  value: number;
}

export function QuotaProgressBar({ value }: QuotaProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(value, 100));
  const tone =
    clampedValue >= 90 ? "bg-danger" : clampedValue >= 60 ? "bg-warning" : "bg-success";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-text-soft">Quota Usage</span>
        <span className="font-medium">{formatPercentage(clampedValue)}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-surface-muted">
        <div
          className={cn("h-full rounded-full transition-all", tone)}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
