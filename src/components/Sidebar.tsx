import { Activity, Bell, FileBarChart2, Gauge, Network, Radar, Router, Users } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useDashboardIsps } from "@/features/dashboard/api";
import { cn } from "@/lib/utils";

const baseNavigation = [
  { label: "Overview", to: "/", icon: Gauge },
  { label: "Traffic", to: "/traffic", icon: Radar },
  { label: "Users", to: "/users", icon: Users },
  { label: "Alerts", to: "/alerts", icon: Bell },
  { label: "Reports", to: "/reports", icon: FileBarChart2 },
  { label: "Status", to: "/status", icon: Activity },
];

export function Sidebar() {
  const ispsQuery = useDashboardIsps();
  const defaultIspTarget = ispsQuery.data?.items[0]?.id ?? "ether1";
  const navigation = [
    baseNavigation[0],
    { label: "ISPs", to: `/isps/${defaultIspTarget}`, icon: Network },
    ...baseNavigation.slice(1),
  ];

  return (
    <aside className="border-r border-line/80 bg-surface-soft/95 px-4 py-6 backdrop-blur lg:px-6">
      <div className="mb-8 flex items-center gap-3 rounded-2xl border border-line/70 bg-surface px-4 py-3">
        <div className="rounded-xl bg-accent/15 p-2 text-accent">
          <Router className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-text-soft">Mini-ISP</p>
          <h1 className="text-lg font-semibold">MikroTik Monitor</h1>
        </div>
      </div>

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
  );
}
