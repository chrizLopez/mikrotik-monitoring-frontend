import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "@/components/ChartCard";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { ExportButton } from "@/components/ExportButton";
import { LoadingState } from "@/components/LoadingState";
import { RangeSelector } from "@/components/RangeSelector";
import { StatCard } from "@/components/StatCard";
import {
  useGroupTrafficTopDestinations,
  useTrafficHistory,
  useTrafficOverview,
  useTrafficTopApps,
  useTrafficTopCategories,
  useTrafficTopGames,
  useTrafficTopSites,
} from "@/features/traffic/api";
import {
  formatBytes,
  formatChartTick,
  formatConfidenceLabel,
  formatPercentage,
  formatTimestamp,
} from "@/lib/utils";
import { RangeOption } from "@/types/api";

const CATEGORY_COLORS = ["#0f766e", "#f97316", "#2563eb", "#e11d48", "#16a34a", "#7c3aed", "#64748b"];

export function TrafficAnalyticsPage() {
  const [range, setRange] = useState<RangeOption>("7d");
  const [limit, setLimit] = useState(10);
  const overviewQuery = useTrafficOverview(range);
  const sitesQuery = useTrafficTopSites(range, limit);
  const appsQuery = useTrafficTopApps(range, limit);
  const gamesQuery = useTrafficTopGames(range, limit);
  const categoriesQuery = useTrafficTopCategories(range, limit);
  const groupAQuery = useGroupTrafficTopDestinations("A", range, 5);
  const groupBQuery = useGroupTrafficTopDestinations("B", range, 5);

  const selectedEntityId = useMemo(() => {
    return sitesQuery.data?.items.find((item) => item.entityId != null)?.entityId ?? appsQuery.data?.items.find((item) => item.entityId != null)?.entityId ?? null;
  }, [appsQuery.data?.items, sitesQuery.data?.items]);
  const historyQuery = useTrafficHistory(selectedEntityId, range);

  if (
    overviewQuery.isLoading ||
    sitesQuery.isLoading ||
    appsQuery.isLoading ||
    gamesQuery.isLoading ||
    categoriesQuery.isLoading ||
    groupAQuery.isLoading ||
    groupBQuery.isLoading
  ) {
    return <LoadingState label="Loading traffic analytics..." />;
  }

  if (
    overviewQuery.isError ||
    sitesQuery.isError ||
    appsQuery.isError ||
    gamesQuery.isError ||
    categoriesQuery.isError ||
    groupAQuery.isError ||
    groupBQuery.isError ||
    !overviewQuery.data
  ) {
    return <ErrorState />;
  }

  const overview = overviewQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-text-soft">Passive, view-only application and destination analytics.</p>
          <h1 className="mt-1 text-3xl font-semibold">Traffic Analytics</h1>
          <p className="mt-2 max-w-3xl text-sm text-text-soft">
            Exact names appear only when DNS, SNI, or analyzer metadata is available. Otherwise the dashboard falls back to service families, categories, or the Unknown Encrypted bucket.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <RangeSelector value={range} onChange={setRange} />
          <select
            value={limit}
            onChange={(event) => setLimit(Number(event.target.value))}
            className="rounded-xl border border-line/80 bg-surface-soft px-3 py-2 text-sm"
          >
            {[5, 10, 15, 20].map((value) => (
              <option key={value} value={value}>
                Top {value}
              </option>
            ))}
          </select>
          <ExportButton range={range} endpoint="/api/dashboard/traffic/export.csv" filename={`traffic-analytics-${range}.csv`} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Classified Traffic" value={formatBytes(overview.totalClassifiedBytes)} helper="Mapped to exact entities, service families, or categories" />
        <StatCard label="Unknown Encrypted" value={formatBytes(overview.totalUnclassifiedBytes)} helper="Traffic without reliable application or destination metadata" />
        <StatCard label="Coverage" value={formatPercentage(overview.classificationCoveragePercent, 1)} helper="Classified share of observed bytes" />
        <StatCard label="Top Website" value={overview.topSites[0]?.displayName ?? "--"} helper={overview.topSites[0] ? formatBytes(overview.topSites[0].totalBytes) : "No traffic"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <ChartCard title="Top Websites" description="Exact domain or service-family matches when available.">
          {sitesQuery.data?.items.length ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sitesQuery.data.items} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                  <XAxis type="number" tickFormatter={(value) => formatBytes(Number(value))} />
                  <YAxis type="category" dataKey="displayName" width={170} />
                  <Tooltip formatter={(value: number) => formatBytes(value)} />
                  <Bar dataKey="totalBytes" fill="#0f766e" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState description="No website classifications have been imported for this range." />
          )}
        </ChartCard>

        <ChartCard title="Category Share" description="Honest fallback buckets for encrypted or partially identified traffic.">
          {categoriesQuery.data?.items.length ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoriesQuery.data.items} dataKey="totalBytes" nameKey="label" innerRadius={70} outerRadius={110} paddingAngle={3}>
                    {categoriesQuery.data.items.map((item, index) => (
                      <Cell key={item.label} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatBytes(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState description="No category analytics have been imported yet." />
          )}
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <TrafficListCard title="Top Apps" items={appsQuery.data?.items ?? []} />
        <TrafficListCard title="Top Gaming Services" items={gamesQuery.data?.items ?? []} />
        <ChartCard title="Group A vs Group B" description="Top destinations by configured user groups.">
          <div className="space-y-4">
            <TrafficMiniList label="Group A" items={groupAQuery.data?.items ?? []} />
            <TrafficMiniList label="Group B" items={groupBQuery.data?.items ?? []} />
          </div>
        </ChartCard>
      </div>

      <ChartCard
        title={historyQuery.data?.entity.displayName ? `${historyQuery.data.entity.displayName} Traffic Over Time` : "Traffic Over Time"}
        description="Entity history uses the selected range bucket and keeps labels aligned to confidence level."
      >
        {historyQuery.data?.points.length ? (
          <div className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyQuery.data.points}>
                <defs>
                  <linearGradient id="trafficArea" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                <XAxis dataKey="timestamp" tickFormatter={formatChartTick} minTickGap={28} />
                <YAxis tickFormatter={(value) => formatBytes(Number(value))} />
                <Tooltip labelFormatter={(value: string) => formatTimestamp(value)} formatter={(value: number) => formatBytes(value)} />
                <Area type="monotone" dataKey="totalBytes" stroke="#2563eb" fillOpacity={1} fill="url(#trafficArea)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState description="Select a range with imported analytics to view entity history." />
        )}
      </ChartCard>
    </div>
  );
}

function TrafficListCard({
  title,
  items,
}: {
  title: string;
  items: Array<{
    displayName: string;
    totalBytes: number;
    categoryName: string | null;
    confidenceLabel: string;
  }>;
}) {
  return (
    <ChartCard title={title} description="Labels preserve exact match, inferred family, or category-only visibility.">
      <div className="space-y-3">
        {items.length ? (
          items.map((item) => (
            <div key={`${title}-${item.displayName}`} className="rounded-2xl border border-line/80 bg-surface px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{item.displayName}</p>
                  <p className="text-xs text-text-soft">{item.categoryName ?? "Uncategorized"}</p>
                </div>
                <span className="rounded-full bg-surface-soft px-2 py-1 text-xs text-text-soft">{formatConfidenceLabel(item.confidenceLabel)}</span>
              </div>
              <p className="mt-3 text-sm font-semibold">{formatBytes(item.totalBytes)}</p>
            </div>
          ))
        ) : (
          <EmptyState description="No ranked traffic items in this range." />
        )}
      </div>
    </ChartCard>
  );
}

function TrafficMiniList({
  label,
  items,
}: {
  label: string;
  items: Array<{ displayName: string; totalBytes: number }>;
}) {
  return (
    <div className="rounded-2xl border border-line/80 bg-surface px-4 py-4">
      <p className="text-sm font-semibold">{label}</p>
      <div className="mt-3 space-y-2">
        {items.length ? (
          items.map((item) => (
            <div key={`${label}-${item.displayName}`} className="flex items-center justify-between gap-3 text-sm">
              <span>{item.displayName}</span>
              <span className="text-text-soft">{formatBytes(item.totalBytes)}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-text-soft">No imported data.</p>
        )}
      </div>
    </div>
  );
}
