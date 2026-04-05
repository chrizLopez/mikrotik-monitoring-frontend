import { Download, Share2, X } from "lucide-react";
import { usePwa } from "@/features/pwa/pwa-provider";

export function InstallBanner() {
  const { canPromptInstall, dismissInstallBanner, isIos, shouldShowInstallBanner, promptInstall } = usePwa();

  if (!shouldShowInstallBanner) {
    return null;
  }

  return (
    <section className="panel mb-4 overflow-hidden border-accent/20">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.24em] text-accent">Install Dashboard</p>
          <h3 className="mt-1 text-lg font-semibold">Open the ISP dashboard like a native app</h3>
          <p className="mt-1 text-sm text-text-soft">
            {canPromptInstall
              ? "Install this dashboard for a faster launch, full-screen experience, and quick access from the home screen or desktop."
              : "On iPhone and iPad, use Safari's Share menu and choose Add to Home Screen to install this dashboard."}
          </p>
          {isIos ? (
            <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-text">
              <Share2 className="h-4 w-4 text-accent" />
              Use Share, then Add to Home Screen.
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {canPromptInstall ? (
            <button
              type="button"
              onClick={() => void promptInstall()}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              <Download className="h-4 w-4" />
              <span>Install App</span>
            </button>
          ) : null}
          <button
            type="button"
            onClick={dismissInstallBanner}
            className="rounded-xl border border-line/80 bg-surface-soft px-3 py-2 text-text-soft transition hover:text-text"
            aria-label="Dismiss install banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
