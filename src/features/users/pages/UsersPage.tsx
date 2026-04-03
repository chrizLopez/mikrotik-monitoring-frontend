import { ArrowUpDown, Search } from "lucide-react";
import { startTransition, useDeferredValue, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { ExportButton } from "@/components/ExportButton";
import { LoadingState } from "@/components/LoadingState";
import { StatusBadge } from "@/components/StatusBadge";
import { useUsers } from "@/features/users/api";
import { formatBytes, formatPercentage, formatRelativeTime, formatTimestamp } from "@/lib/utils";
import { GroupKey, UserRecord, UserState } from "@/types/api";

type SortKey = "usedBytes" | "remainingBytes" | "usagePercent";

export function UsersPage() {
  const query = useUsers();
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<"ALL" | GroupKey>("ALL");
  const [stateFilter, setStateFilter] = useState<"ALL" | UserState>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("usedBytes");
  const deferredSearch = useDeferredValue(search);

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
            Search, filter, sort, and export customer reporting for quota review.
          </p>
        </div>
        <ExportButton range="cycle" />
      </div>

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
            { key: "percent", label: "Usage %", render: (user) => formatPercentage(user.usagePercent) },
            { key: "state", label: "State", render: (user) => <StatusBadge status={user.state} /> },
            { key: "limit", label: "Current Max Limit", render: (user) => user.currentMaxLimit },
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
