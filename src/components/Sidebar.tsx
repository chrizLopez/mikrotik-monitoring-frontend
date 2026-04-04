import { Activity, Bell, FileBarChart2, Gauge, Network, Router, Users, X } from "lucide-react";
import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useDashboardIsps } from "@/features/dashboard/api";
import { cn } from "@/lib/utils";

const baseNavigation = [
  { label: "Overview", to: "/", icon: Gauge },
  { label: "Users", to: "/users", icon: Users },
  { label: "Alerts", to: "/alerts", icon: Bell },
  { label: "Reports", to: "/reports", icon: FileBarChart2 },
  { label: "Status", to: "/status", icon: Activity },
];

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const ispsQuery = useDashboardIsps();
  const defaultIspTarget = ispsQuery.data?.items[0]?.id ?? "ether1";
  const navigation = [
    baseNavigation[0],
    { label: "ISPs", to: `/isps/${defaultIspTarget}`, icon: Network },
    ...baseNavigation.slice(1),
  ];
  const mobileNavigation = navigation.filter((item) =>
    ["/", `/isps/${defaultIspTarget}`, "/users", "/status"].includes(item.to),
  );

  useEffect(() => {
    document.body.classList.toggle("overflow-hidden", mobileOpen);
    return () => document.body.classList.remove("overflow-hidden");
  }, [mobileOpen]);

  const brand = (
    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-line/70 bg-surface px-4 py-3">
      <div className="rounded-xl bg-accent/15 p-2 text-accent">
        <Router className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-[0.24em] text-text-soft">Mini-ISP</p>
        <h1 className="truncate text-lg font-semibold">MikroTik Monitor</h1>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden border-r border-line/80 bg-surface-soft/95 px-4 py-6 backdrop-blur lg:block lg:px-6">
        {brand}
        <nav className="space-y-1">
          {navigation.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                  isActive
                    ? "bg-accent text-white shadow-sm"
                    : "text-text-soft hover:bg-surface hover:text-text",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/45 transition lg:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onCloseMobile}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[88vw] max-w-[320px] border-r border-line/80 bg-surface-soft/95 px-4 py-5 shadow-panel backdrop-blur transition lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">{brand}</div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-xl border border-line/80 bg-surface px-3 py-2 text-text-soft"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="space-y-1">
          {navigation.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                  isActive
                    ? "bg-accent text-white shadow-sm"
                    : "text-text-soft hover:bg-surface hover:text-text",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line/80 bg-surface-soft/95 px-2 py-2 backdrop-blur lg:hidden">
        <div className="grid grid-cols-4 gap-2">
          {mobileNavigation.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition",
                  isActive ? "bg-accent text-white" : "text-text-soft hover:bg-surface",
                )
              }
            >
              <Icon className="h-4 w-4" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
