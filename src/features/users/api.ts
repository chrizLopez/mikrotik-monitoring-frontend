import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import {
  DashboardUsersResponse,
  QuotaTimelineResponse,
  RangeOption,
  ThrottlingHistoryResponse,
  UserHistoryResponse,
} from "@/types/api";

function unwrapData<T>(payload: T | { data: T }) {
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data;
  }

  return payload as T;
}

function normalizeGroup(value: string | null | undefined) {
  return value === "Group A" ? "GROUP_A" : "GROUP_B";
}

async function fetchUsers() {
  const response = await api.get("/api/dashboard/users");
  const data = unwrapData<Array<Record<string, unknown>>>(response.data);

  return {
    range: "cycle",
    items: data.map((item) => ({
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
    })),
  } satisfies DashboardUsersResponse;
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

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
    refetchInterval: 30_000,
  });
}

export function useUserHistory(userId: string, range: RangeOption) {
  return useQuery({
    queryKey: ["users", userId, range],
    queryFn: () => fetchUserHistory(userId, range),
    enabled: Boolean(userId),
  });
}

export function useQuotaTimeline(userId: string, range: RangeOption) {
  return useQuery({
    queryKey: ["users", userId, "quota-timeline", range],
    queryFn: () => fetchQuotaTimeline(userId, range),
    enabled: Boolean(userId),
  });
}

export function useThrottlingHistory(userId: string, range: RangeOption) {
  return useQuery({
    queryKey: ["users", userId, "throttling-history", range],
    queryFn: () => fetchThrottlingHistory(userId, range),
    enabled: Boolean(userId),
  });
}
