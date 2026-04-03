interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({
  title = "No data yet",
  description = "Data will appear here once the backend returns telemetry for the selected range.",
}: EmptyStateProps) {
  return (
    <div className="flex min-h-56 items-center justify-center rounded-2xl border border-dashed border-line bg-surface/50 p-8 text-center">
      <div className="max-w-md">
        <h4 className="text-lg font-semibold">{title}</h4>
        <p className="mt-2 text-sm text-text-soft">{description}</p>
      </div>
    </div>
  );
}
