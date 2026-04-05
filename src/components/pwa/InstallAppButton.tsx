import { Download } from "lucide-react";
import { usePwa } from "@/features/pwa/pwa-provider";

export function InstallAppButton() {
  const { canPromptInstall, isInstalled, promptInstall } = usePwa();

  if (isInstalled) {
    return (
      <span className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-300">
        App installed
      </span>
    );
  }

  if (!canPromptInstall) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => void promptInstall()}
      className="inline-flex items-center gap-2 rounded-xl bg-accent px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 sm:px-4"
    >
      <Download className="h-4 w-4" />
      <span>Install App</span>
    </button>
  );
}
