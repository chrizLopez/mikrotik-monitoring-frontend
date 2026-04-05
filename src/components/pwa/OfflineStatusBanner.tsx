import { WifiOff } from "lucide-react";
import { usePwa } from "@/features/pwa/pwa-provider";

export function OfflineStatusBanner() {
  const { isOnline } = usePwa();

  if (isOnline) {
    return null;
  }

  return (
    <section className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 shadow-sm dark:text-amber-100">
      <p className="flex items-center gap-2 font-medium">
        <WifiOff className="h-4 w-4" />
        Offline. Live router data is unavailable until the connection returns.
      </p>
      <p className="mt-1 text-amber-800/90 dark:text-amber-100/80">
        Cached dashboard assets remain available, but API-backed metrics and status updates still require the network.
      </p>
    </section>
  );
}
