import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

export function AppShell() {
  return (
    <div className="min-h-screen bg-dashboard-grid bg-[size:24px_24px]">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[280px_1fr]">
        <Sidebar />
        <div className="flex min-w-0 flex-col">
          <TopBar />
          <main className="flex-1 p-4 sm:p-6 xl:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
