import { Activity, AlertTriangle, Gamepad2, GaugeCircle, Globe2, Grid3X3, ListOrdered, Smartphone, Users } from "lucide-react";
import { useState } from "react";
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
import { QuotaProgressBar } from "@/components/QuotaProgressBar";
import { RangeSelector } from "@/components/RangeSelector";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import {
  useAlerts,
  useComparisons,
  useDashboardLive,
  useDashboardSummary,
  useGroupUsage,
  useIspDistribution,
  usePopularDestinations,
  useTopUsers,
} from "@/features/dashboard/api";
import {
  formatBitsPerSecond,
  formatBytes,
  formatDisplayName,
  formatPercentage,
  formatRangeLabel,
  formatTimestamp,
} from "@/lib/utils";
import { ActiveUser, GroupKey, PopularDestinationCategory, PopularDestinationItem, RangeOption } from "@/types/api";

const ISP_COLORS = ["#0891b2", "#22c55e", "#f97316"];

function getGroupLabel(group: GroupKey) {
  return group === "STARLINK_GROUP" ? "Starlink Group" : "Smart Group";
}

const destinationSections: Array<{
  key: PopularDestinationCategory;
  label: string;
  icon: typeof Smartphone;
}> = [
  { key: "apps", label: "Apps", icon: Smartphone },
  { key: "sites", label: "Sites", icon: Globe2 },
  { key: "games", label: "Games", icon: Gamepad2 },
];

const destinationCategoryLabels: Record<PopularDestinationCategory, string> = {
  apps: "Apps",
  sites: "Sites",
  games: "Games",
};

export function DashboardOverviewPage() {
  const [range, setRange] = useState<RangeOption>("cycle");
  const [destinationView, setDestinationView] = useState<"grouped" | "all">("grouped");
  const summaryQuery = useDashboardSummary(range);
  const liveQuery = useDashboardLive();
  const distributionQuery = useIspDistribution(range);
  const topUsersQuery = useTopUsers(range);
  const groupUsageQuery = useGroupUsage(range);
  const alertsQuery = useAlerts(range);
  const comparisonsQuery = useComparisons();
  const popularDestinationsQuery = usePopularDestinations(range);

  if (summaryQuery.isLoading) {
    return <LoadingState label="Loading NOC overview..." />;
  }

  if (summaryQuery.isError || !summaryQuery.data) {
    return <ErrorState onRetry={() => window.location.reload()} />;
  }

  const summary = summaryQuery.data;
  const live = liveQuery.data;
  const distribution = distributionQuery.data;
  const alerts = alertsQuery.data;
  const comparisons = comparisonsQuery.data?.cycleVsPreviousCycle;
  const starlinkGroupUsage = groupUsageQuery.data?.items.find((item) => item.group === "STARLINK_GROUP")?.totalBytes ?? 0;
  const smartGroupUsage = groupUsageQuery.data?.items.find((item) => item.group === "SMART_GROUP")?.totalBytes ?? 0;
  const starlinkUsage = summary.starlinkUsage;
  const smartbroTotal = summary.smartbroTotal;
  const allDestinationItems: PopularDestinationItem[] = popularDestinationsQuery.data
    ? Object.values(popularDestinationsQuery.data.items)
        .flat()
        .sort((left, right) => right.visits - left.visits || right.totalBytes - left.totalBytes)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-text-soft">Last poll: {formatTimestamp(summary.lastPollAt)}</p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">NOC Overview</h1>
          <p className="mt-2 text-sm text-text-soft">
            WAN traffic, Smart/Globe distribution, and user activity for the current weighted PCC design.
          </p>
        </div>
        <RangeSelector value={range} onChange={setRange} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Starlink Usage This Month"
          value={formatBytes(starlinkUsage?.usedBytes ?? 0)}
          helper={starlinkUsage ? "Cycle-to-date Starlink traffic, no data cap monitored" : "Waiting for Starlink usage data"}
          icon={<GaugeCircle className="h-5 w-5" />}
        />
        <StatCard
          label="Smart/Globe Total This Month"
          value={formatBytes(smartbroTotal?.usedBytes ?? 0)}
          helper={smartbroTotal?.items.map((item) => `${item.label}: ${formatBytes(item.usedBytes)}`).join(" | ") ?? "Combined Smart and Globe"}
          icon={<Activity className="h-5 w-5" />}
        />
        <StatCard
          label={`${formatRangeLabel(range)} Usage`}
          value={formatBytes(summary.totals.totalUsageBytes)}
          helper={range === "cycle" ? "Current billing cycle total" : "Directly from range-aware summary"}
          icon={<GaugeCircle className="h-5 w-5" />}
        />
        <StatCard label="Monitored Users" value={summary.totals.totalActiveUsers} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Throttled Users" value={summary.totals.throttledUsers} icon={<Activity className="h-5 w-5" />} />
        <StatCard label="Active Issues" value={alerts?.activeIssues ?? "--"} icon={<AlertTriangle className="h-5 w-5" />} helper="Quota or ISP alerts at high severity" />
        <StatCard label="Starlink Group Usage" value={formatBytes(starlinkGroupUsage)} helper="Home Router, VLAN20, VLAN30, VLAN40, VLAN50, and VLAN60" icon={<Users className="h-5 w-5" />} />
        <StatCard label="Smart Group Usage" value={formatBytes(smartGroupUsage)} helper="VLAN70 and VLAN80" icon={<Users className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <ChartCard title="Starlink Traffic Monitor" description="Cycle-to-date Starlink traffic and daily trend from interface counter deltas.">
          {starlinkUsage ? (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-surface px-4 py-4">
                  <p className="text-sm text-text-soft">Used</p>
                  <p className="mt-2 text-xl font-semibold">{formatBytes(starlinkUsage.usedBytes)}</p>
                </div>
                <div className="rounded-2xl bg-surface px-4 py-4">
                  <p className="text-sm text-text-soft">Average daily</p>
                  <p className="mt-2 text-xl font-semibold">{formatBytes(starlinkUsage.averageDailyBytes)}</p>
                </div>
                <div className="rounded-2xl bg-surface px-4 py-4">
                  <p className="text-sm text-text-soft">Projected month</p>
                  <p className="mt-2 text-xl font-semibold">{formatBytes(starlinkUsage.projectedMonthlyBytes)}</p>
                </div>
              </div>
              {starlinkUsage.capBytes > 0 ? (
                <>
                  <QuotaProgressBar value={starlinkUsage.usagePercent} />
                  <p className="text-sm text-text-soft">
                    Thresholds: {starlinkUsage.thresholds.map((threshold) => `${threshold.percent}% ${threshold.reached ? "reached" : "pending"}`).join(" | ")}
                  </p>
                </>
              ) : (
                <p className="text-sm text-text-soft">Starlink data-cap monitoring is disabled; this chart tracks traffic only.</p>
              )}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={starlinkUsage.dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(value) => formatBytes(Number(value))} />
                    <Tooltip formatter={(value: number) => formatBytes(value)} />
                    <Line dataKey="totalBytes" type="monotone" stroke="#0891b2" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <EmptyState description="Starlink usage data is not available yet." />
          )}
        </ChartCard>

        <ChartCard title="Group Policy Summary" description="Configured user segmentation for the current routing layout.">
          <div className="space-y-3">
            {summary.groupPolicies.map((group) => (
              <div key={group.key} className="rounded-2xl border border-line/80 bg-surface px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{group.label}</p>
                  <span className="text-xs uppercase tracking-wide text-text-soft">
                    {group.policy.starlink ?? 0}/{group.policy.smart_a ?? 0}/{group.policy.globe ?? 0}
                  </span>
                </div>
                <p className="mt-1 text-sm text-text-soft">{group.subnets.join(" | ")}</p>
                <p className="mt-2 text-sm text-text-soft">
                  {group.key === "STARLINK_GROUP"
                    ? "Routing policy: Starlink only."
                    : "Weighted PCC: 0% Starlink, 50% Smart, 50% Globe."}
                </p>
              </div>
            ))}
            <div className="rounded-2xl border border-line/80 bg-surface px-4 py-3 text-sm text-text-soft">
              {summary.distributionNote}
            </div>
          </div>
        </ChartCard>
      </div>

      <ChartCard title="Live WAN Traffic" description="Current WAN throughput by interface with recent sparkline samples.">
        {liveQuery.isError ? <ErrorState title="Live WAN traffic unavailable" description="Current WAN cards failed to load, but the rest of the dashboard is still available." /> : null}
        {live ? (
          <div className="grid gap-4 xl:grid-cols-3">
            {live.isps.map((isp, index) => (
              <div key={isp.id} className="rounded-2xl border border-line/80 bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-text-soft">{isp.interfaceName}</p>
                    <Link to={`/isps/${isp.id}`} className="mt-1 block text-lg font-semibold text-accent">
                      {isp.name}
                    </Link>
                  </div>
                  <StatusBadge status={isp.status} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-text-soft">Download</p>
                    <p className="font-semibold">{formatBitsPerSecond(isp.currentRxBps)}</p>
                  </div>
                  <div>
                    <p className="text-text-soft">Upload</p>
                    <p className="font-semibold">{formatBitsPerSecond(isp.currentTxBps)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-text-soft">Combined</p>
                    <p className="font-semibold">{formatBitsPerSecond(isp.currentTotalBps ?? 0)}</p>
                  </div>
                </div>
                <div className="mt-4 h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={isp.trend ?? []}>
                      <Line dataKey="totalBps" type="monotone" stroke={ISP_COLORS[index % ISP_COLORS.length]} strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-2 text-xs text-text-soft">{formatTimestamp(isp.lastUpdatedAt)}</p>
              </div>
            ))}
          </div>
        ) : null}
      </ChartCard>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <ChartCard title="Top Active Users Right Now" description="Short-window derived download and upload rates from recent queue snapshots.">
          {liveQuery.isError ? <ErrorState title="Active user rates unavailable" description="The live users section timed out or failed." /> : null}
          {live ? (
            <DataTable<ActiveUser>
              columns={[
                {
                  key: "name",
                  label: "User",
                  render: (user) => (
                    <div>
                      <Link to={`/users/${user.id}`} className="font-medium text-accent">
                        {formatDisplayName(user.name)}
                      </Link>
                      <p className="text-xs text-text-soft">{user.subnet}</p>
                    </div>
                  ),
                },
                { key: "group", label: "Group", render: (user) => getGroupLabel(user.group) },
                { key: "down", label: "Download", render: (user) => formatBitsPerSecond(user.downloadBps) },
                { key: "up", label: "Upload", render: (user) => formatBitsPerSecond(user.uploadBps) },
                { key: "combined", label: "Combined", render: (user) => formatBitsPerSecond(user.combinedBps) },
                { key: "state", label: "State", render: (user) => <StatusBadge status={user.state} /> },
              ]}
              rows={live.topActiveUsers}
              getRowKey={(row) => row.id}
              mobileCardRender={(user) => (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link to={`/users/${user.id}`} className="font-medium text-accent">
                        {formatDisplayName(user.name)}
                      </Link>
                      <p className="text-xs text-text-soft">{user.subnet}</p>
                    </div>
                    <StatusBadge status={user.state} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-text-soft">Group</p>
                      <p>{getGroupLabel(user.group)}</p>
                    </div>
                    <div>
                      <p className="text-text-soft">Combined</p>
                      <p>{formatBitsPerSecond(user.combinedBps)}</p>
                    </div>
                    <div>
                      <p className="text-text-soft">Download</p>
                      <p>{formatBitsPerSecond(user.downloadBps)}</p>
                    </div>
                    <div>
                      <p className="text-text-soft">Upload</p>
                      <p>{formatBitsPerSecond(user.uploadBps)}</p>
                    </div>
                  </div>
                </div>
              )}
              emptyState={<EmptyState description="No active user rate data is available yet." />}
            />
          ) : null}
        </ChartCard>

        <ChartCard title="Alert Summary" description="Derived quota, health, and unusual-usage insights.">
          {alertsQuery.isError ? <ErrorState title="Alerts unavailable" description="Alert calculation failed for this refresh." /> : null}
          {alerts ? (
            <div className="space-y-3">
              {[...alerts.healthAlerts, ...alerts.quotaAlerts, ...alerts.usageAlerts].slice(0, 6).map((alert) => (
                <div key={`${alert.type}-${alert.title}`} className="rounded-2xl border border-line/80 bg-surface px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{alert.title}</p>
                    <span className="text-xs uppercase tracking-wide text-text-soft">{alert.severity}</span>
                  </div>
                  <p className="mt-1 text-sm text-text-soft">{alert.subject}</p>
                </div>
              ))}
              {!alerts.healthAlerts.length && !alerts.quotaAlerts.length && !alerts.usageAlerts.length ? <EmptyState description="No active alerts in the selected range." /> : null}
            </div>
          ) : null}
        </ChartCard>
      </div>

      <ChartCard
        title="Most Visited Apps, Sites, and Games"
        description="Destination ranking for the selected range once DNS or flow telemetry is connected."
        action={
          <div className="inline-flex rounded-xl border border-line/80 bg-surface-soft p-1">
            <button
              type="button"
              onClick={() => setDestinationView("grouped")}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${destinationView === "grouped" ? "bg-accent text-white" : "text-text-soft hover:text-text"}`}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
              Grouped
            </button>
            <button
              type="button"
              onClick={() => setDestinationView("all")}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${destinationView === "all" ? "bg-accent text-white" : "text-text-soft hover:text-text"}`}
            >
              <ListOrdered className="h-3.5 w-3.5" />
              View all
            </button>
          </div>
        }
      >
        {popularDestinationsQuery.isError ? (
          <ErrorState title="Destination ranking unavailable" description="The destination summary endpoint failed to load." />
        ) : null}
        {popularDestinationsQuery.data && destinationView === "all" ? (
          allDestinationItems.length ? (
            <div className="space-y-3">
              {allDestinationItems.slice(0, 30).map((item, index) => (
                <div key={`${item.category}-${item.id}`} className="flex items-start justify-between gap-3 border-t border-line/70 pt-3 first:border-t-0 first:pt-0">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {index + 1}. {item.name}
                      </p>
                      <span className="rounded-full border border-line/80 px-2 py-0.5 text-[11px] uppercase tracking-wide text-text-soft">
                        {destinationCategoryLabels[item.category]}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-text-soft">
                      {formatBytes(item.totalBytes)} | {formatPercentage(item.sharePercent, 1)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-text-soft">{item.visits.toLocaleString()} visits</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState description="Destination rankings will appear once telemetry is available." />
          )
        ) : popularDestinationsQuery.data ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {destinationSections.map((section) => {
              const Icon = section.icon;
              const items = popularDestinationsQuery.data.items[section.key];

              return (
                <div key={section.key} className="rounded-2xl border border-line/80 bg-surface p-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h4 className="font-semibold">{section.label}</h4>
                  </div>

                  {items.length ? (
                    <div className="mt-4 space-y-3">
                      {items.slice(0, 8).map((item, index) => (
                        <div key={item.id} className="flex items-start justify-between gap-3 border-t border-line/70 pt-3 first:border-t-0 first:pt-0">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {index + 1}. {item.name}
                            </p>
                            <p className="mt-1 text-xs text-text-soft">
                              {formatBytes(item.totalBytes)} | {formatPercentage(item.sharePercent, 1)}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs text-text-soft">{item.visits.toLocaleString()} visits</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-dashed border-line bg-surface-soft px-4 py-5 text-sm text-text-soft">
                      Waiting for destination telemetry.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState description="Destination rankings will appear once telemetry is available." />
        )}
      </ChartCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="ISP Load Distribution" description="Traffic share across Starlink, Smart, and Globe.">
          {distributionQuery.isError ? <ErrorState title="Distribution unavailable" description="Traffic distribution failed to load for this range." /> : null}
          {distribution?.items.length ? (
            <div className="space-y-3">
              <div className="h-72 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distribution.items} dataKey="totalTrafficBytes" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={4}>
                      {distribution.items.map((item, index) => (
                        <Cell key={item.id} fill={ISP_COLORS[index % ISP_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatBytes(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-text-soft">{summary.distributionNote}</p>
            </div>
          ) : (
            <EmptyState />
          )}
        </ChartCard>

        <ChartCard title="Top Consumers" description="Top usage by selected range.">
          {topUsersQuery.isError ? <ErrorState title="Top consumers unavailable" description="Top user aggregation failed for this range." /> : null}
          {topUsersQuery.data?.items.length ? (
            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topUsersQuery.data.items.slice(0, 10)} layout="vertical">
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
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Starlink Group vs Smart Group" description="Selected-range group share with totals from positive deltas.">
          {groupUsageQuery.data?.items.length ? (
            <div className="h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={groupUsageQuery.data.items}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={(value) => formatBytes(Number(value))} />
                  <Tooltip formatter={(value: number) => formatBytes(value)} />
                  <Bar dataKey="totalBytes" fill="#0891b2" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState />
          )}
        </ChartCard>

        <ChartCard title="Cycle Comparison" description={comparisons ? `${comparisons.currentLabel} against ${comparisons.previousLabel}.` : "Current cycle against the previous cycle."}>
          {comparisonsQuery.isError || !comparisons ? <ErrorState title="Comparison unavailable" description="Historical comparison could not be loaded." /> : null}
          {comparisons ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-surface px-4 py-4">
                <p className="text-sm text-text-soft">ISP traffic</p>
                <p className="mt-2 text-xl font-semibold">{formatBytes(comparisons.totalIspTraffic.current)}</p>
                <p className="text-sm text-text-soft">Change: {formatPercentage(comparisons.totalIspTraffic.changePercent ?? 0, 1)}</p>
              </div>
              <div className="rounded-2xl bg-surface px-4 py-4">
                <p className="text-sm text-text-soft">User traffic</p>
                <p className="mt-2 text-xl font-semibold">{formatBytes(comparisons.totalUserTraffic.current)}</p>
                <p className="text-sm text-text-soft">Change: {formatPercentage(comparisons.totalUserTraffic.changePercent ?? 0, 1)}</p>
              </div>
              <div className="rounded-2xl bg-surface px-4 py-4 md:col-span-2">
                <p className="text-sm text-text-soft">Top user movement</p>
                <div className="mt-3 space-y-2">
                  {comparisons.topUsers.map((item) => (
                    <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
                      <span>{formatDisplayName(item.name)}</span>
                      <span className="text-text-soft">
                        {formatBytes(item.currentTotalBytes)} / {formatPercentage(item.changePercent ?? 0, 1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </ChartCard>
      </div>
    </div>
  );
}
