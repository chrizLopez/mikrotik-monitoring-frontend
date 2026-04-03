import { RangeOption } from "@/types/api";
import { cn, formatRangeLabel } from "@/lib/utils";

const options: RangeOption[] = ["today", "24h", "7d", "30d", "cycle"];

interface RangeSelectorProps {
  value: RangeOption;
  onChange: (range: RangeOption) => void;
}

export function RangeSelector({ value, onChange }: RangeSelectorProps) {
  return (
    <div className="inline-flex flex-wrap gap-2 rounded-2xl border border-line/80 bg-surface-soft p-1">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "rounded-xl px-3 py-2 text-sm transition",
            value === option ? "bg-accent text-white" : "text-text-soft hover:bg-surface hover:text-text",
          )}
        >
          {formatRangeLabel(option)}
        </button>
      ))}
    </div>
  );
}
