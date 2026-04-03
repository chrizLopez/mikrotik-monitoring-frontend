interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Unable to load data",
  description = "The request failed. Check API connectivity and try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex min-h-56 items-center justify-center rounded-2xl border border-danger/20 bg-danger/5 p-8 text-center">
      <div className="max-w-md">
        <h4 className="text-lg font-semibold text-danger">{title}</h4>
        <p className="mt-2 text-sm text-text-soft">{description}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-xl bg-danger px-4 py-2 text-sm font-medium text-white"
          >
            Retry
          </button>
        ) : null}
      </div>
    </div>
  );
}
