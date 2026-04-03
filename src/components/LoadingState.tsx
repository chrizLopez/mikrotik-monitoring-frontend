interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = "Loading data..." }: LoadingStateProps) {
  return (
    <div className="flex min-h-56 items-center justify-center rounded-2xl border border-line/80 bg-surface-soft p-8">
      <div className="flex items-center gap-3 text-text-soft">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-accent" />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  );
}
