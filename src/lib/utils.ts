import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "--";
  if (value === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 100 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatBitsPerSecond(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "--";
  if (value === 0) return "0 bps";

  const units = ["bps", "Kbps", "Mbps", "Gbps", "Tbps"];
  let rate = value;
  let unitIndex = 0;

  while (rate >= 1000 && unitIndex < units.length - 1) {
    rate /= 1000;
    unitIndex += 1;
  }

  return `${rate.toFixed(rate >= 100 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatPercentage(value: number | null | undefined, digits = 0) {
  if (value == null || Number.isNaN(value)) return "--";
  return `${value.toFixed(digits)}%`;
}

export function formatLatency(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "--";
  return `${value.toFixed(value >= 100 ? 0 : 1)} ms`;
}

export function formatDurationMinutes(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "--";
  if (value < 60) return `${Math.round(value)} mins`;

  const hours = value / 60;
  return `${hours.toFixed(hours >= 10 ? 0 : 1)} hrs`;
}

function parseDate(value: string | null | undefined) {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatTimestamp(value: string | null | undefined) {
  const date = parseDate(value);
  if (!date) return "--";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatRelativeTime(value: string | null | undefined) {
  const targetDate = parseDate(value);
  if (!targetDate) return "--";

  const target = targetDate.getTime();
  const diffSeconds = Math.round((target - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  const divisions: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
    ["second", 1],
  ];

  for (const [unit, divisor] of divisions) {
    if (Math.abs(diffSeconds) >= divisor || unit === "second") {
      return formatter.format(Math.round(diffSeconds / divisor), unit);
    }
  }

  return "--";
}

export function formatRangeLabel(range: string) {
  switch (range) {
    case "10m":
      return "Last 10 Minutes";
    case "1h":
      return "Last 1 Hour";
    case "today":
      return "Today";
    case "24h":
      return "Last 24 Hours";
    case "7d":
      return "Last 7 Days";
    case "30d":
      return "Last 30 Days";
    case "cycle":
      return "Current Billing Cycle";
    case "prev_cycle":
      return "Previous Billing Cycle";
    default:
      return range;
  }
}

export function formatChartTick(value: string) {
  const date = parseDate(value);
  if (!date) return "--";

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatDisplayName(value: string | null | undefined) {
  if (!value) return "--";

  return value
    .replace(/^VLAN\d+\s*-\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}
