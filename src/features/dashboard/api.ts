import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import {
  DashboardIspsResponse,
  DashboardSummaryResponse,
  GroupUsageResponse,
  RangeOption,
  TopUsersResponse,
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

async function fetchSummary() {
  const response = await api.get("/api/dashboard/summary");
  const data = unwrapData(response.data as Record<string, unknown>);

  return {
    range: "cycle",
    billingCycleLabel:
      (data.current_billing_cycle as { label?: string } | undefined)?.label ?? "Current Cycle",
    lastPollAt: (data.last_poll_timestamp as string | null | undefined) ?? null,
    apiStatus: "online",
    totals: {
      totalUsageBytes: Number(data.total_user_traffic_this_cycle ?? data.total_isp_traffic_this_cycle ?? 0),
      totalActiveUsers: Number(data.total_monitored_users ?? 0),
      throttledUsers: Number(data.throttled_user_count ?? 0),
      activeIsps: Number(data.active_isp_count ?? 0),
    },
    cards: [],
  } satisfies DashboardSummaryResponse;
}

async function fetchIsps() {
  const response = await api.get("/api/dashboard/isps");
  const data = unwrapData<Array<Record<string, unknown>>>(response.data);

  return {
    range: "cycle",
    items: data.map((item) => ({
      id: String(item.id),
      name: String(item.name ?? "Unknown ISP"),
      interfaceName: String(item.interface_name ?? "--"),
      status: item.status === "online" ? "online" : "offline",
      currentRxBps: Number(item.current_rx_bps ?? 0),
      currentTxBps: Number(item.current_tx_bps ?? 0),
      downloadBytes: Number(item.download_bytes ?? 0),
      uploadBytes: Number(item.upload_bytes ?? 0),
      totalTrafficBytes: Number(item.total_bytes ?? item.current_total_bytes ?? 0),
      lastUpdatedAt: (item.last_snapshot_at as string | null | undefined) ?? null,
    })),
  } satisfies DashboardIspsResponse;
}

async function fetchTopUsers(range: RangeOption) {
  const response = await api.get("/api/dashboard/top-users", {
    params: { range, limit: 10 },
  });
  const data = unwrapData<Array<Record<string, unknown>>>(response.data);

  return {
    range,
    items: data.map((item) => ({
      id: String(item.id),
      name: String(item.name ?? "Unknown User"),
      usedBytes: Number(item.total_bytes ?? 0),
      usagePercent: Number(item.usage_percent ?? 0),
      state: item.state === "THROTTLED" ? "THROTTLED" : "NORMAL",
    })),
  } satisfies TopUsersResponse;
}

async function fetchGroupUsage(range: RangeOption) {
  const response = await api.get("/api/dashboard/groups/usage", {
    params: { range },
  });
  const data = unwrapData<Array<Record<string, unknown>>>(response.data);

  return {
    range,
    items: data.map((item) => ({
      group: normalizeGroup(item.group_name as string | undefined),
      totalBytes: Number(item.total_bytes ?? 0),
      users: Number(item.user_count ?? 0),
    })),
  } satisfies GroupUsageResponse;
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: fetchSummary,
  });
}

export function useDashboardIsps() {
  return useQuery({
    queryKey: ["dashboard", "isps"],
    queryFn: fetchIsps,
    refetchInterval: 30_000,
  });
}

export function useTopUsers(range: RangeOption) {
  return useQuery({
    queryKey: ["dashboard", "top-users", range],
    queryFn: () => fetchTopUsers(range),
  });
}

export function useGroupUsage(range: RangeOption) {
  return useQuery({
    queryKey: ["dashboard", "groups", range],
    queryFn: () => fetchGroupUsage(range),
  });
}
