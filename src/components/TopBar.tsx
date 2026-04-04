import { LogOut, Menu, MoonStar, SunMedium } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/auth-context";

interface TopBarProps {
  onOpenMobileNav: () => void;
}

export function TopBar({ onOpenMobileNav }: TopBarProps) {
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <header className="sticky top-0 z-20 border-b border-line/80 bg-surface/85 px-4 py-4 backdrop-blur sm:px-6 xl:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-text-soft">Operations Dashboard</p>
            <h2 className="text-xl font-semibold sm:text-2xl">Local ISP Monitoring</h2>
          </div>
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="rounded-xl border border-line/80 bg-surface-soft px-3 py-2 text-text-soft lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setDarkMode((current) => !current)}
            className="rounded-xl border border-line/80 bg-surface-soft px-3 py-2 text-text-soft transition hover:text-text"
            aria-label="Toggle theme"
          >
            {darkMode ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
          </button>
          <div className="min-w-0 rounded-2xl border border-line/80 bg-surface-soft px-3 py-2 sm:px-4">
            <p className="text-xs text-text-soft">Signed in as</p>
            <p className="truncate text-sm font-medium">{user?.email ?? "Admin"}</p>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex items-center gap-2 rounded-xl bg-danger px-3 py-2 text-sm font-medium text-white transition hover:bg-danger/90 sm:px-4"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
