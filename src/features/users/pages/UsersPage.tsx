import { ArrowUpDown, Search, Zap } from "lucide-react";
import { startTransition, useDeferredValue, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { ExportButton } from "@/components/ExportButton";
import { LoadingState } from "@/components/LoadingState";
import { RangeSelector } from "@/components/RangeSelector";
import { StatusBadge } from "@/components/StatusBadge";
import { useTopUsers } from "@/features/dashboard/api";
import { useUsers } from "@/features/users/api";
import { formatBitsPerSecond, formatBytes, formatPercentage, formatRelativeTime, formatTimestamp } from "@/lib/utils";
import { GroupKey, RangeOption, UserRecord, UserState } from "@/types/api";

type SortKey = "usedBytes" | "remainingBytes" | "usagePercent";

export function UsersPage() {
  const query = useUsers();
  const [range, setRange] = useState<RangeOption>("cycle");
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<"ALL" | GroupKey>("ALL");
  const [stateFilter, setStateFilter] = useState<"ALL" | UserState>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("usedBytes");
  const deferredSearch = useDeferredValue(search);
  const topUsersQuery = useTopUsers(range);

  const rows = useMemo(() => {
    const users = query.data?.items ?? [];
    const normalizedSearch = deferredSearch.trim().toLowerCase();

    return [...users]
      .filter((user) => !normalizedSearch || user.name.toLowerCase().includes(normalizedSearch))
      .filter((user) => groupFilter === "ALL" || user.group === groupFilter)
      .filter((user) => stateFilter === "ALL" || user.state === stateFilter)
      .sort((left, right) => right[sortKey] - left[sortKey]);
  }, [deferredSearch, groupFilter, query.data?.items, sortKey, stateFilter]);

  if (query.isLoading) {
    return <LoadingState label="Loading users..." />;
  }

  if (query.isError) {
    return <ErrorState />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Users</h1>
          <p className="mt-2 text-sm text-text-soft">
            Search, filter, sort, and export customer reporting with quota thresholds and current activity.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <RangeSelector value={range} onChange={setRange} />
          <ExportButton range={range} />
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-3">
        {(topUsersQuery.data?.items ?? []).slice(0, 3).map((user) => (
          <Link key={user.id} to={`/users/${user.id}`} className="panel p-5 transition hover:-translate-y-0.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-text-soft">Top consumer</p>
                <h3 className="mt-1 text-lg font-semibold">{user.name}</h3>
              </div>
              <Zap className="h-4 w-4 text-accent" />
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <p>Used: {formatBytes(user.usedBytes)}</p>
              <p>Quota: {formatPercentage(user.usagePercent, 1)}</p>
              <p>Current rate: {formatBitsPerSecond(user.currentCombinedBps ?? 0)}</p>
            </div>
          </Link>
        ))}
      </section>

      <section className="panel p-5">
        <div className="grid gap-4 xl:grid-cols-[1.4fr_repeat(3,0.8fr)]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-soft" />
            <input
              value={search}
              onChange={(event) =>
                startTransition(() => {
                  setSearch(event.target.value);
                })
              }
              placeholder="Search by user name"
              className="w-full rounded-2xl border-line bg-surface py-3 pl-10 pr-4"
            />
          </label>
          <select
            value={groupFilter}
            onChange={(event) => setGroupFilter(event.target.value as "ALL" | GroupKey)}
            className="rounded-2xl border-line bg-surface px-4 py-3"
          >
            <option value="ALL">All groups</option>
            <option value="GROUP_A">Group A</option>
            <option value="GROUP_B">Group B</option>
          </select>
          <select
            value={stateFilter}
            onChange={(event) => setStateFilter(event.target.value as "ALL" | UserState)}
            className="rounded-2xl border-line bg-surface px-4 py-3"
          >
            <option value="ALL">All states</option>
            <option value="NORMAL">Normal</option>
            <option value="THROTTLED">Throttled</option>
          </select>
          <button
            type="button"
            onClick={() =>
              setSortKey((current) =>
                current === "usedBytes"
                  ? "remainingBytes"
                  : current === "remainingBytes"
                    ? "usagePercent"
                    : "usedBytes",
              )
            }
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-line/80 bg-surface px-4 py-3 text-sm font-medium"
          >
            <ArrowUpDown className="h-4 w-4" />
            Sort: {sortKey}
          </button>
        </div>
      </section>

      <section className="panel p-5">
        <DataTable<UserRecord>
          columns={[
            {
              key: "name",
              label: "Name",
              render: (user) => (
                <div>
                  <Link to={`/users/${user.id}`} className="font-medium text-accent">
                    {user.name}
                  </Link>
                  <p className="text-xs text-text-soft">{formatTimestamp(user.lastUpdatedAt)}</p>
                </div>
              ),
            },
            { key: "subnet", label: "Subnet", render: (user) => user.subnet },
            { key: "group", label: "Group", render: (user) => user.group.replace("_", " ") },
            { key: "used", label: "Used", render: (user) => formatBytes(user.usedBytes) },
            { key: "remaining", label: "Remaining", render: (user) => formatBytes(user.remainingBytes) },
            {
              key: "percent",
              label: "Usage %",
              render: (user) => (
                <div>
                  <span>{formatPercentage(user.usagePercent)}</span>
                  <p className="text-xs text-text-soft">
                    {user.usagePercent >= 100 ? "100%" : user.usagePercent >= 90 ? "90%" : user.usagePercent >= 80 ? "80%" : user.usagePercent >= 50 ? "50%" : "Below 50%"}
                  </p>
                </div>
              ),
            },
            { key: "state", label: "State", render: (user) => <StatusBadge status={user.state} /> },
            { key: "limit", label: "Current Max Limit", render: (user) => user.currentMaxLimit },
            { key: "activity", label: "Current Activity", render: (user) => formatBitsPerSecond(user.currentCombinedBps ?? 0) },
            { key: "updated", label: "Last Updated", render: (user) => formatRelativeTime(user.lastUpdatedAt) },
          ]}
          rows={rows}
          getRowKey={(user) => user.id}
          emptyState={<EmptyState description="No user rows match the current filters." />}
        />
      </section>
    </div>
  );
}
