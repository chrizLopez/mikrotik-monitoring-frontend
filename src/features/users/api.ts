import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import {
  DashboardUsersResponse,
  QuotaTimelineResponse,
  RangeOption,
  ThrottlingHistoryResponse,
  UserRecord,
  UserHistoryResponse,
  UsersQueryParams,
} from "@/types/api";

function unwrapData<T>(payload: T | { data: T }) {
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data;
  }

  return payload as T;
}

function normalizeGroup(value: string | null | undefined) {
  return value === "Starlink Group" ? "STARLINK_GROUP" : "SMART_GROUP";
}

function mapUser(item: Record<string, unknown>): UserRecord {
  return {
    id: String(item.id),
    name: String(item.name ?? "Unknown User"),
    subnet: String(item.subnet ?? "--"),
    group: normalizeGroup(item.group_name as string | undefined),
    state: item.state === "THROTTLED" ? "THROTTLED" : "NORMAL",
    currentMaxLimit: (item.current_max_limit as string | null | undefined) ?? null,
    usedBytes: Number(item.total_bytes ?? 0),
    remainingBytes: Number(item.remaining_bytes ?? 0),
    quotaBytes: Number(item.quota_bytes ?? 0),
    usagePercent: Number(item.usage_percent ?? 0),
    downloadBytes: Number(item.download_bytes ?? 0),
    uploadBytes: Number(item.upload_bytes ?? 0),
    currentCombinedBps: 0,
    peakCombinedBps: 0,
    peakAt: null,
    threshold:
      Number(item.usage_percent ?? 0) >= 100
        ? 100
        : Number(item.usage_percent ?? 0) >= 90
          ? 90
          : Number(item.usage_percent ?? 0) >= 80
            ? 80
            : Number(item.usage_percent ?? 0) >= 50
              ? 50
              : null,
    lastUpdatedAt: (item.last_snapshot_at as string | null | undefined) ?? null,
  };
}

function mapSort(sort: UsersQueryParams["sort"]) {
  switch (sort) {
    case "usedBytes":
      return "used_bytes";
    case "remainingBytes":
      return "remaining_quota";
    case "usagePercent":
      return "usage_percent";
    case "lastUpdated":
      return "last_updated";
    default:
      return "name";
  }
}

async function fetchUsers(params: UsersQueryParams = {}) {
  const response = await api.get("/api/dashboard/users", {
    params: {
      page: params.page ?? 1,
      per_page: params.perPage ?? 15,
      search: params.search?.trim() || undefined,
      group: params.group && params.group !== "ALL" ? params.group : undefined,
      state: params.state && params.state !== "ALL" ? params.state : undefined,
      sort: mapSort(params.sort),
      direction: params.direction ?? (params.sort === "name" ? "asc" : "desc"),
    },
  });
  const data = unwrapData<Array<Record<string, unknown>>>(response.data);
  const meta = (response.data.meta ?? {}) as Record<string, unknown>;

  return {
    range: "cycle",
    items: data.map(mapUser),
    meta: {
      currentPage: Number(meta.current_page ?? 1),
      lastPage: Number(meta.last_page ?? 1),
      perPage: Number(meta.per_page ?? params.perPage ?? 15),
      total: Number(meta.total ?? data.length),
      from: meta.from == null ? null : Number(meta.from),
      to: meta.to == null ? null : Number(meta.to),
    },
  } satisfies DashboardUsersResponse;
}

async function fetchUser(userId: string) {
  const response = await api.get(`/api/dashboard/users/${userId}`);
  const data = unwrapData<Record<string, unknown>>(response.data);

  return mapUser(data);
}

async function fetchUserHistory(userId: string, range: RangeOption) {
  const response = await api.get(`/api/dashboard/users/${userId}/history`, {
    params: { range },
  });
  const data = unwrapData<{ points?: Array<Record<string, unknown>>; totals?: Record<string, unknown> }>(response.data);

  return {
    range,
    monthlyQuotaBytes: 0,
    user: undefined,
    points: (data.points ?? []).map((point) => ({
      timestamp: String(point.timestamp ?? ""),
      rxBps: 0,
      txBps: 0,
      totalBytes: Number(point.total_bytes ?? 0),
      downloadBytes: Number(point.download_bytes ?? 0),
      uploadBytes: Number(point.upload_bytes ?? 0),
    })),
  } as UserHistoryResponse;
}

async function fetchQuotaTimeline(userId: string, range: RangeOption) {
  const response = await api.get(`/api/dashboard/users/${userId}/quota-timeline`, { params: { range } });
  const data = unwrapData<Record<string, unknown>>(response.data);

  return {
    summary: {
      usedBytes: Number((data.summary as Record<string, unknown>)?.used_bytes ?? 0),
      remainingBytes: Number((data.summary as Record<string, unknown>)?.remaining_bytes ?? 0),
      quotaBytes: Number((data.summary as Record<string, unknown>)?.quota_bytes ?? 0),
      usagePercent: Number((data.summary as Record<string, unknown>)?.usage_percent ?? 0),
    },
    points: Array.isArray(data.points)
      ? (data.points as Array<Record<string, unknown>>).map((point) => ({
          timestamp: String(point.timestamp ?? ""),
          rxBps: 0,
          txBps: 0,
          totalBytes: Number(point.total_bytes ?? 0),
          downloadBytes: Number(point.download_bytes ?? 0),
          uploadBytes: Number(point.upload_bytes ?? 0),
          cumulativeBytes: Number(point.cumulative_bytes ?? 0),
        }))
      : [],
  } satisfies QuotaTimelineResponse;
}

async function fetchThrottlingHistory(userId: string, range: RangeOption) {
  const response = await api.get(`/api/dashboard/users/${userId}/throttling-history`, { params: { range } });
  const data = unwrapData<Record<string, unknown>>(response.data);

  return {
    items: Array.isArray(data.items)
      ? (data.items as Array<Record<string, unknown>>).map((item) => ({
          id: String(item.id),
          name: String(item.name ?? ""),
          group: normalizeGroup(item.group_name as string | undefined),
          currentState: item.current_state === "THROTTLED" ? "THROTTLED" : "NORMAL",
          lastStateChange: (item.last_state_change as string | null | undefined) ?? null,
          throttledEvents: Number(item.throttled_events ?? 0),
          transitions: Array.isArray(item.transitions)
            ? (item.transitions as Array<Record<string, unknown>>).map((transition) => ({
                fromState: transition.from_state === "THROTTLED" ? "THROTTLED" : "NORMAL",
                toState: transition.to_state === "THROTTLED" ? "THROTTLED" : "NORMAL",
                changedAt: String(transition.changed_at ?? ""),
              }))
            : [],
        }))
      : [],
  } satisfies ThrottlingHistoryResponse;
}

export function useUsers(params: UsersQueryParams = {}) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => fetchUsers(params),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export function useUser(userId: string) {
  return useQuery({
    queryKey: ["users", userId, "current"],
    queryFn: () => fetchUser(userId),
    enabled: Boolean(userId),
    staleTime: 15_000,
  });
}

export function useUserHistory(userId: string, range: RangeOption) {
  return useQuery({
    queryKey: ["users", userId, range],
    queryFn: () => fetchUserHistory(userId, range),
    enabled: Boolean(userId),
    staleTime: 30_000,
  });
}

export function useQuotaTimeline(userId: string, range: RangeOption) {
  return useQuery({
    queryKey: ["users", userId, "quota-timeline", range],
    queryFn: () => fetchQuotaTimeline(userId, range),
    enabled: Boolean(userId),
    staleTime: 30_000,
  });
}

export function useThrottlingHistory(userId: string, range: RangeOption) {
  return useQuery({
    queryKey: ["users", userId, "throttling-history", range],
    queryFn: () => fetchThrottlingHistory(userId, range),
    enabled: Boolean(userId),
    staleTime: 30_000,
  });
}
