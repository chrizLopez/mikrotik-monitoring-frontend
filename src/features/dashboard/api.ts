import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import {
  AlertsResponse,
  ComparisonsResponse,
  DashboardIspsResponse,
  DistributionResponse,
  DashboardSummaryResponse,
  GroupUsageResponse,
  LiveDashboardResponse,
  RangeOption,
  ReportsResponse,
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

function normalizeHealthStatus(value: unknown): "online" | "offline" | "degraded" {
  return value === "offline" ? "offline" : value === "degraded" ? "degraded" : "online";
}

function normalizeUserState(value: unknown): "NORMAL" | "THROTTLED" | undefined {
  if (value === "THROTTLED") return "THROTTLED";
  if (value === "NORMAL") return "NORMAL";

  return undefined;
}

function mapIsp(item: Record<string, unknown>) {
  return {
    id: String(item.id),
    name: String(item.name ?? "Unknown ISP"),
    interfaceName: String(item.interface_name ?? "--"),
    status: normalizeHealthStatus(item.status),
    currentRxBps: Number(item.current_rx_bps ?? 0),
    currentTxBps: Number(item.current_tx_bps ?? 0),
    currentTotalBps: Number(item.current_total_bps ?? 0),
    downloadBytes: Number(item.download_bytes ?? 0),
    uploadBytes: Number(item.upload_bytes ?? 0),
    totalTrafficBytes: Number(item.total_bytes ?? item.current_total_bytes ?? 0),
    sharePercent: Number(item.share_percent ?? 0),
    lastUpdatedAt: (item.last_snapshot_at as string | null | undefined) ?? (item.last_poll_timestamp as string | null | undefined) ?? null,
    trend: Array.isArray(item.trend)
      ? (item.trend as Array<Record<string, unknown>>).map((point) => ({
          timestamp: String(point.timestamp ?? ""),
          rxBps: Number(point.rx_bps ?? 0),
          txBps: Number(point.tx_bps ?? 0),
          totalBps: Number(point.total_bps ?? 0),
        }))
      : undefined,
  };
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
    items: data.map(mapIsp),
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
      group: normalizeGroup(item.group_name as string | undefined),
      subnet: String(item.subnet ?? "--"),
      usedBytes: Number(item.total_bytes ?? 0),
      remainingQuotaBytes: Number(item.remaining_quota_bytes ?? 0),
      usagePercent: Number(item.usage_percent ?? 0),
      state: item.state === "THROTTLED" ? "THROTTLED" : "NORMAL",
      currentMaxLimit: (item.current_max_limit as string | null | undefined) ?? null,
      currentCombinedBps: Number(item.current_combined_bps ?? 0),
      peakCombinedBps: Number(item.peak_combined_bps ?? 0),
      peakAt: (item.peak_at as string | null | undefined) ?? null,
      uploadBytes: Number(item.upload_bytes ?? 0),
      downloadBytes: Number(item.download_bytes ?? 0),
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

async function fetchLive() {
  const response = await api.get("/api/dashboard/live", { params: { limit: 8 } });
  const data = unwrapData<{ isps?: Array<Record<string, unknown>>; top_active_users?: Array<Record<string, unknown>> }>(response.data);

  return {
    isps: (data.isps ?? []).map(mapIsp),
    topActiveUsers: (data.top_active_users ?? []).map((item) => ({
      id: String(item.id),
      name: String(item.name ?? "Unknown User"),
      group: normalizeGroup(item.group_name as string | undefined),
      subnet: String(item.subnet ?? "--"),
      downloadBps: Number(item.download_bps ?? 0),
      uploadBps: Number(item.upload_bps ?? 0),
      combinedBps: Number(item.combined_bps ?? 0),
      currentMaxLimit: (item.current_max_limit as string | null | undefined) ?? null,
      state: item.state === "THROTTLED" ? "THROTTLED" : "NORMAL",
      lastSnapshotAt: (item.last_snapshot_at as string | null | undefined) ?? null,
    })),
  } satisfies LiveDashboardResponse;
}

async function fetchDistribution(range: RangeOption) {
  const response = await api.get("/api/dashboard/isps/distribution", { params: { range } });
  const data = unwrapData<{ items?: Array<Record<string, unknown>>; total_bytes?: number }>(response.data);

  return {
    range,
    totalBytes: Number(data.total_bytes ?? 0),
    items: (data.items ?? []).map(mapIsp),
  } satisfies DistributionResponse;
}

async function fetchAlerts(range: RangeOption) {
  const response = await api.get("/api/dashboard/alerts", { params: { range } });
  const data = unwrapData<Record<string, unknown>>(response.data);

  const mapAlert = (item: Record<string, unknown>) => ({
    type: (item.type as "quota" | "health" | "usage") ?? "usage",
    severity: (item.severity as "low" | "medium" | "high" | "critical") ?? "low",
    title: String(item.title ?? ""),
    subject: String(item.subject ?? ""),
    usagePercent: item.usage_percent == null ? undefined : Number(item.usage_percent),
    latencyMs: item.latency_ms == null ? null : Number(item.latency_ms),
    packetLossPercent: item.packet_loss_percent == null ? null : Number(item.packet_loss_percent),
    combinedBps: item.combined_bps == null ? undefined : Number(item.combined_bps),
    state: normalizeUserState(item.state),
  });

  return {
    activeIssues: Number(data.active_issues ?? 0),
    quotaAlerts: Array.isArray(data.quota_alerts) ? (data.quota_alerts as Array<Record<string, unknown>>).map(mapAlert) : [],
    healthAlerts: Array.isArray(data.health_alerts) ? (data.health_alerts as Array<Record<string, unknown>>).map(mapAlert) : [],
    usageAlerts: Array.isArray(data.usage_alerts) ? (data.usage_alerts as Array<Record<string, unknown>>).map(mapAlert) : [],
  } satisfies AlertsResponse;
}

async function fetchComparisons() {
  const response = await api.get("/api/dashboard/comparisons");
  const data = unwrapData<Record<string, unknown>>(response.data);

  const mapBlock = (block: Record<string, unknown>) => ({
    currentLabel: String(block.current_label ?? ""),
    previousLabel: String(block.previous_label ?? ""),
    totalIspTraffic: {
      current: Number((block.total_isp_traffic as Record<string, unknown>)?.current ?? 0),
      previous: Number((block.total_isp_traffic as Record<string, unknown>)?.previous ?? 0),
      changePercent: (block.total_isp_traffic as Record<string, unknown>)?.change_percent == null ? null : Number((block.total_isp_traffic as Record<string, unknown>)?.change_percent),
    },
    totalUserTraffic: {
      current: Number((block.total_user_traffic as Record<string, unknown>)?.current ?? 0),
      previous: Number((block.total_user_traffic as Record<string, unknown>)?.previous ?? 0),
      changePercent: (block.total_user_traffic as Record<string, unknown>)?.change_percent == null ? null : Number((block.total_user_traffic as Record<string, unknown>)?.change_percent),
    },
    topUsers: Array.isArray(block.top_users)
      ? (block.top_users as Array<Record<string, unknown>>).map((item) => ({
          name: String(item.name ?? ""),
          currentTotalBytes: Number(item.current_total_bytes ?? 0),
          previousTotalBytes: Number(item.previous_total_bytes ?? 0),
          changePercent: item.change_percent == null ? null : Number(item.change_percent),
        }))
      : [],
    groupUsage: Array.isArray(block.group_usage)
      ? (block.group_usage as Array<Record<string, unknown>>).map((item) => ({
          groupName: String(item.group_name ?? ""),
          currentTotalBytes: Number(item.current_total_bytes ?? 0),
          previousTotalBytes: Number(item.previous_total_bytes ?? 0),
          changePercent: item.change_percent == null ? null : Number(item.change_percent),
        }))
      : [],
  });

  return {
    todayVsYesterday: mapBlock((data.today_vs_yesterday as Record<string, unknown>) ?? {}),
    cycleVsPreviousCycle: mapBlock((data.cycle_vs_previous_cycle as Record<string, unknown>) ?? {}),
    last7dVsPrevious7d: mapBlock((data.last_7d_vs_previous_7d as Record<string, unknown>) ?? {}),
  } satisfies ComparisonsResponse;
}

async function fetchReports(range: RangeOption) {
  await api.get("/api/dashboard/reports", { params: { range } });

  return {
    topUsers: await fetchTopUsers(range).then((value) => value.items),
    ispDistribution: await fetchDistribution(range),
    alerts: await fetchAlerts(range),
    comparisons: await fetchComparisons(),
  } satisfies ReportsResponse;
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

export function useDashboardLive() {
  return useQuery({
    queryKey: ["dashboard", "live"],
    queryFn: fetchLive,
    refetchInterval: 30_000,
  });
}

export function useIspDistribution(range: RangeOption) {
  return useQuery({
    queryKey: ["dashboard", "isps", "distribution", range],
    queryFn: () => fetchDistribution(range),
  });
}

export function useAlerts(range: RangeOption) {
  return useQuery({
    queryKey: ["dashboard", "alerts", range],
    queryFn: () => fetchAlerts(range),
    refetchInterval: 30_000,
  });
}

export function useComparisons() {
  return useQuery({
    queryKey: ["dashboard", "comparisons"],
    queryFn: fetchComparisons,
  });
}

export function useReports(range: RangeOption) {
  return useQuery({
    queryKey: ["dashboard", "reports", range],
    queryFn: () => fetchReports(range),
  });
}
