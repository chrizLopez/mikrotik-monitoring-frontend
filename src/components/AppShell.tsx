import { useEffect, useState } from "react";
import { InstallBanner } from "@/components/pwa/InstallBanner";
import { OfflineStatusBanner } from "@/components/pwa/OfflineStatusBanner";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

export function AppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-dashboard-grid bg-[size:24px_24px]">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[280px_1fr]">
        <Sidebar
          darkMode={darkMode}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
          onToggleDarkMode={() => setDarkMode((current) => !current)}
        />
        <div className="flex min-w-0 flex-col">
          <TopBar
            darkMode={darkMode}
            onOpenMobileNav={() => setMobileNavOpen(true)}
            onToggleDarkMode={() => setDarkMode((current) => !current)}
          />
          <main className="flex-1 p-4 pb-24 sm:p-6 sm:pb-8 xl:p-8">
            <OfflineStatusBanner />
            <InstallBanner />
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
