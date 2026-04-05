import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const INSTALL_BANNER_DISMISSED_KEY = "pwa_install_banner_dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

interface PwaContextValue {
  canPromptInstall: boolean;
  isInstalled: boolean;
  isIos: boolean;
  isOnline: boolean;
  isStandalone: boolean;
  shouldShowInstallBanner: boolean;
  dismissInstallBanner: () => void;
  promptInstall: () => Promise<boolean>;
}

const PwaContext = createContext<PwaContextValue | null>(null);

function getStandaloneState() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function getIosState() {
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isAppleMobileDevice = /iphone|ipad|ipod/.test(userAgent);
  const isWebkitBrowser = /safari/.test(userAgent) && !/crios|fxios|edgios/.test(userAgent);

  return isAppleMobileDevice && isWebkitBrowser;
}

export function PwaProvider({ children }: PropsWithChildren) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOnline, setIsOnline] = useState(() => window.navigator.onLine);
  const [installBannerDismissed, setInstallBannerDismissed] = useState(() => {
    return window.localStorage.getItem(INSTALL_BANNER_DISMISSED_KEY) === "true";
  });
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const supportsModernMediaQueryEvents = typeof mediaQuery.addEventListener === "function";
    const syncStandalone = () => {
      const standalone = getStandaloneState();

      setIsStandalone(standalone);
      setIsInstalled(standalone);
    };

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setInstallBannerDismissed(false);
      window.localStorage.removeItem(INSTALL_BANNER_DISMISSED_KEY);
    };

    const handleInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
      setIsStandalone(true);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    syncStandalone();
    setIsIos(getIosState());

    if (supportsModernMediaQueryEvents) {
      mediaQuery.addEventListener("change", syncStandalone);
    } else {
      mediaQuery.addListener(syncStandalone);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      if (supportsModernMediaQueryEvents) {
        mediaQuery.removeEventListener("change", syncStandalone);
      } else {
        mediaQuery.removeListener(syncStandalone);
      }
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const dismissInstallBanner = () => {
    setInstallBannerDismissed(true);
    window.localStorage.setItem(INSTALL_BANNER_DISMISSED_KEY, "true");
  };

  const promptInstall = async () => {
    if (!deferredPrompt) {
      return false;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    setDeferredPrompt(null);

    if (choice.outcome === "accepted") {
      setIsInstalled(true);
      return true;
    }

    return false;
  };

  const value = useMemo<PwaContextValue>(
    () => ({
      canPromptInstall: deferredPrompt !== null && !isInstalled,
      isInstalled,
      isIos,
      isOnline,
      isStandalone,
      shouldShowInstallBanner: !installBannerDismissed && !isInstalled && (deferredPrompt !== null || isIos),
      dismissInstallBanner,
      promptInstall,
    }),
    [deferredPrompt, installBannerDismissed, isInstalled, isIos, isOnline, isStandalone],
  );

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}

export function usePwa() {
  const context = useContext(PwaContext);

  if (!context) {
    throw new Error("usePwa must be used within a PwaProvider");
  }

  return context;
}
