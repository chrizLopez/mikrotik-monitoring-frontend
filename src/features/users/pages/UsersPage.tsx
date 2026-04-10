import { ArrowUpDown, Search, Zap } from "lucide-react";
import { startTransition, useDeferredValue, useState } from "react";
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
import {
  formatBitsPerSecond,
  formatBytes,
  formatDisplayName,
  formatPercentage,
  formatRelativeTime,
  formatTimestamp,
} from "@/lib/utils";
import { GroupKey, RangeOption, UserRecord, UserState } from "@/types/api";

type SortKey = "usedBytes" | "remainingBytes" | "usagePercent";

export function UsersPage() {
  const [range, setRange] = useState<RangeOption>("cycle");
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<"ALL" | GroupKey>("ALL");
  const [stateFilter, setStateFilter] = useState<"ALL" | UserState>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("usedBytes");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const deferredSearch = useDeferredValue(search);
  const query = useUsers({
    page,
    perPage: pageSize,
    search: deferredSearch,
    group: groupFilter,
    state: stateFilter,
    sort: sortKey,
  });
  const topUsersQuery = useTopUsers(range);
  const rows = query.data?.items ?? [];
  const pagination = query.data?.meta;

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
          <h1 className="text-2xl font-semibold sm:text-3xl">Users</h1>
          <p className="mt-2 text-sm text-text-soft">
            Search, filter, sort, and export customer reporting with quota thresholds and current activity.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <RangeSelector value={range} onChange={setRange} />
          <ExportButton range={range} />
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(topUsersQuery.data?.items ?? []).slice(0, 3).map((user) => (
          <Link key={user.id} to={`/users/${user.id}`} className="panel p-5 transition hover:-translate-y-0.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-text-soft">Top consumer</p>
                <h3 className="mt-1 text-lg font-semibold">{formatDisplayName(user.name)}</h3>
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

      <section className="panel p-4 sm:p-5">
        <div className="grid gap-4 xl:grid-cols-[1.4fr_repeat(3,0.8fr)]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-soft" />
            <input
              value={search}
              onChange={(event) =>
                startTransition(() => {
                  setSearch(event.target.value);
                  setPage(1);
                })
              }
              placeholder="Search by user name"
              className="w-full rounded-2xl border-line bg-surface py-3 pl-10 pr-4"
            />
          </label>
          <select
            value={groupFilter}
            onChange={(event) => {
              setGroupFilter(event.target.value as "ALL" | GroupKey);
              setPage(1);
            }}
            className="rounded-2xl border-line bg-surface px-4 py-3"
          >
            <option value="ALL">All groups</option>
            <option value="GROUP_A">Group A</option>
            <option value="GROUP_B">Group B</option>
          </select>
          <select
            value={stateFilter}
            onChange={(event) => {
              setStateFilter(event.target.value as "ALL" | UserState);
              setPage(1);
            }}
            className="rounded-2xl border-line bg-surface px-4 py-3"
          >
            <option value="ALL">All states</option>
            <option value="NORMAL">Normal</option>
            <option value="THROTTLED">Throttled</option>
          </select>
          <button
            type="button"
            onClick={() =>
              setSortKey((current) => {
                setPage(1);

                return current === "usedBytes"
                  ? "remainingBytes"
                  : current === "remainingBytes"
                    ? "usagePercent"
                    : "usedBytes";
              })
            }
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-line/80 bg-surface px-4 py-3 text-sm font-medium"
          >
            <ArrowUpDown className="h-4 w-4" />
            Sort: {sortKey}
          </button>
        </div>
      </section>

      <section className="panel p-4 sm:p-5">
        <DataTable<UserRecord>
          columns={[
            {
              key: "name",
              label: "Name",
              render: (user) => (
                <div>
                  <Link to={`/users/${user.id}`} className="font-medium text-accent">
                    {formatDisplayName(user.name)}
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
                  <p>{user.group.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-text-soft">Used</p>
                  <p>{formatBytes(user.usedBytes)}</p>
                </div>
                <div>
                  <p className="text-text-soft">Remaining</p>
                  <p>{formatBytes(user.remainingBytes)}</p>
                </div>
                <div>
                  <p className="text-text-soft">Usage</p>
                  <p>{formatPercentage(user.usagePercent)}</p>
                </div>
                <div>
                  <p className="text-text-soft">Current Limit</p>
                  <p>{user.currentMaxLimit ?? "--"}</p>
                </div>
                <div>
                  <p className="text-text-soft">Activity</p>
                  <p>{formatBitsPerSecond(user.currentCombinedBps ?? 0)}</p>
                </div>
              </div>
              <p className="text-xs text-text-soft">Updated {formatRelativeTime(user.lastUpdatedAt)}</p>
            </div>
          )}
          emptyState={<EmptyState description="No user rows match the current filters." />}
        />
        {pagination ? (
          <div className="mt-4 flex flex-col gap-3 border-t border-line/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-soft">
              Showing {pagination.from ?? 0}-{pagination.to ?? 0} of {pagination.total}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-text-soft">
                <span>Rows</span>
                <select
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setPage(1);
                  }}
                  className="rounded-xl border-line bg-surface px-3 py-2 text-text"
                >
                  {[10, 15, 25, 50].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={pagination.currentPage <= 1 || query.isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-xl border border-line/80 bg-surface px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-text-soft">
                Page {pagination.currentPage} of {pagination.lastPage}
              </span>
              <button
                type="button"
                disabled={pagination.currentPage >= pagination.lastPage || query.isFetching}
                onClick={() => setPage((current) => Math.min(pagination.lastPage, current + 1))}
                className="rounded-xl border border-line/80 bg-surface px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
