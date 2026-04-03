import { Activity, ArrowDownCircle, Globe, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/ChartCard";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { RangeSelector } from "@/components/RangeSelector";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { useDashboardIsps, useDashboardSummary, useGroupUsage, useTopUsers } from "@/features/dashboard/api";
import { useIspHistory } from "@/features/isps/api";
import { useUsers } from "@/features/users/api";
import {
  formatBitsPerSecond,
  formatBytes,
  formatChartTick,
  formatRangeLabel,
  formatTimestamp,
} from "@/lib/utils";
import { RangeOption, UserRecord } from "@/types/api";

export function DashboardOverviewPage() {
  const [range, setRange] = useState<RangeOption>("cycle");
  const [selectedIspId, setSelectedIspId] = useState("");
  const summaryQuery = useDashboardSummary();
  const ispsQuery = useDashboardIsps();
  const topUsersQuery = useTopUsers(range);
  const groupUsageQuery = useGroupUsage(range);
  const usersQuery = useUsers();
  const isps = ispsQuery.data?.items ?? [];
  const selectedIspQuery = useIspHistory(selectedIspId, range);

  useEffect(() => {
    if (!selectedIspId && isps.length) {
      setSelectedIspId(isps[0].id);
    }
  }, [isps, selectedIspId]);

  if (summaryQuery.isLoading || ispsQuery.isLoading || usersQuery.isLoading) {
    return <LoadingState label="Loading overview..." />;
  }

  if (summaryQuery.isError || ispsQuery.isError || usersQuery.isError || !summaryQuery.data) {
    return <ErrorState onRetry={() => window.location.reload()} />;
  }

  const summary = summaryQuery.data;
  const throttledUsers = (usersQuery.data?.items ?? []).filter((user) => user.state === "THROTTLED");
  const selectedIsp = isps.find((isp) => isp.id === selectedIspId);
  const groupAUsage = groupUsageQuery.data?.items.find((item) => item.group === "GROUP_A")?.totalBytes ?? 0;
  const groupBUsage = groupUsageQuery.data?.items.find((item) => item.group === "GROUP_B")?.totalBytes ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-text-soft">Last poll: {formatTimestamp(summary.lastPollAt)}</p>
          <h1 className="mt-1 text-3xl font-semibold">Dashboard Overview</h1>
          <p className="mt-2 text-sm text-text-soft">
            Billing cycle: {summary.billingCycleLabel} | Range: {formatRangeLabel(range)}
          </p>
        </div>
        <RangeSelector value={range} onChange={setRange} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total Usage"
          value={formatBytes(summary.totals.totalUsageBytes)}
          helper="Across all monitored customer networks"
          icon={<Activity className="h-5 w-5" />}
        />
        <StatCard
          label="Active Users"
          value={summary.totals.totalActiveUsers}
          helper="Customer rows excluding aggregate totals"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Throttled Users"
          value={summary.totals.throttledUsers}
          helper="Reduced to the quota throttle profile"
          icon={<ArrowDownCircle className="h-5 w-5" />}
        />
        <StatCard
          label="Online ISPs"
          value={`${summary.totals.activeIsps} / ${isps.length}`}
          helper="Live WAN availability"
          icon={<Globe className="h-5 w-5" />}
        />
        <StatCard
          label="New Starlink Usage"
          value={formatBytes(groupAUsage)}
          helper="Home Router, Camaymayan, and Rutor"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Old Starlink + Smart Bro"
          value={formatBytes(groupBUsage)}
          helper="Remaining monitored users"
          icon={<Users className="h-5 w-5" />}
        />
      </div>

      <section className="grid gap-4 xl:grid-cols-3">
        {isps.map((isp) => (
          <Link key={isp.id} to={`/isps/${isp.id}`} className="panel p-5 transition hover:-translate-y-0.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-text-soft">{isp.interfaceName}</p>
                <h3 className="mt-1 text-xl font-semibold">{isp.name}</h3>
              </div>
              <StatusBadge status={isp.status} />
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs uppercase tracking-wide text-text-soft">Download</dt>
                <dd className="mt-1 text-lg font-semibold">{formatBitsPerSecond(isp.currentRxBps)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-text-soft">Upload</dt>
                <dd className="mt-1 text-lg font-semibold">{formatBitsPerSecond(isp.currentTxBps)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs uppercase tracking-wide text-text-soft">Total Traffic</dt>
                <dd className="mt-1 text-lg font-semibold">{formatBytes(isp.totalTrafficBytes)}</dd>
              </div>
            </dl>
          </Link>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title="ISP Throughput History"
          description="Selected WAN history for the chosen range."
          action={
            <div className="flex flex-wrap gap-2">
              {isps.map((isp) => (
                <button
                  key={isp.id}
                  type="button"
                  onClick={() => setSelectedIspId(isp.id)}
                  className={`rounded-xl px-3 py-2 text-sm ${
                    selectedIspId === isp.id ? "bg-accent text-white" : "bg-surface text-text-soft"
                  }`}
                >
                  {isp.name}
                </button>
              ))}
            </div>
          }
        >
          {selectedIspQuery.data?.points.length ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={selectedIspQuery.data.points}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="timestamp" tickFormatter={formatChartTick} minTickGap={28} />
                  <YAxis tickFormatter={(value) => formatBitsPerSecond(Number(value))} />
                  <Tooltip
                    labelFormatter={(value: string) => formatTimestamp(value)}
                    formatter={(value: number) => formatBitsPerSecond(value)}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="rxBps" stroke="#0891b2" strokeWidth={3} dot={false} name="Download" />
                  <Line type="monotone" dataKey="txBps" stroke="#22c55e" strokeWidth={3} dot={false} name="Upload" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              title={selectedIsp ? `${selectedIsp.name} has no history yet` : "No data yet"}
              description="Historical ISP throughput points will render here when the history endpoint returns data."
            />
          )}
        </ChartCard>

        <ChartCard title="Group A vs Group B" description="Usage split for the selected range.">
          {groupUsageQuery.data?.items.length ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={groupUsageQuery.data.items}
                    dataKey="totalBytes"
                    nameKey="group"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={4}
                  >
                    {groupUsageQuery.data.items.map((entry) => (
                      <Cell key={entry.group} fill={entry.group === "GROUP_A" ? "#0891b2" : "#22c55e"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatBytes(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState />
          )}
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <ChartCard title="Top Users" description="Highest usage customers for the selected range.">
          {topUsersQuery.data?.items.length ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topUsersQuery.data.items} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis type="number" tickFormatter={(value) => formatBytes(Number(value))} />
                  <YAxis type="category" dataKey="name" width={140} />
                  <Tooltip formatter={(value: number) => formatBytes(value)} />
                  <Bar dataKey="usedBytes" fill="#0f766e" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState />
          )}
        </ChartCard>

        <ChartCard title="Throttled Users" description="Users currently running on the lower throttle profile.">
          <DataTable<UserRecord>
            columns={[
              {
                key: "name",
                label: "Name",
                render: (user) => <Link to={`/users/${user.id}`}>{user.name}</Link>,
              },
              { key: "group", label: "Group", render: (user) => user.group.replace("_", " ") },
              { key: "used", label: "Used", render: (user) => formatBytes(user.usedBytes) },
              { key: "state", label: "State", render: (user) => <StatusBadge status={user.state} /> },
            ]}
            rows={throttledUsers}
            getRowKey={(user) => user.id}
            emptyState={<EmptyState description="No users are throttled for the current snapshot." />}
          />
        </ChartCard>
      </div>
    </div>
  );
}
