import { LogOut, MoonStar, SunMedium } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/auth-context";

export function TopBar() {
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <header className="sticky top-0 z-20 border-b border-line/80 bg-surface/85 px-4 py-4 backdrop-blur sm:px-6 xl:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-text-soft">Operations Dashboard</p>
          <h2 className="text-2xl font-semibold">Local ISP Monitoring</h2>
        </div>

        <div className="flex items-center gap-3 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setDarkMode((current) => !current)}
            className="rounded-xl border border-line/80 bg-surface-soft px-3 py-2 text-text-soft transition hover:text-text"
            aria-label="Toggle theme"
          >
            {darkMode ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
          </button>
          <div className="rounded-2xl border border-line/80 bg-surface-soft px-4 py-2">
            <p className="text-xs text-text-soft">Signed in as</p>
            <p className="text-sm font-medium">{user?.email ?? "Admin"}</p>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex items-center gap-2 rounded-xl bg-danger px-4 py-2 text-sm font-medium text-white transition hover:bg-danger/90"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
