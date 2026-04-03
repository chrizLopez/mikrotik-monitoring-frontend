import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { IspHealthHistoryResponse, IspHistoryResponse, RangeOption } from "@/types/api";

function unwrapData<T>(payload: T | { data: T }) {
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data;
  }

  return payload as T;
}

async function fetchIspHistory(ispId: string, range: RangeOption) {
  const response = await api.get(`/api/dashboard/isps/${ispId}/history`, {
    params: { range },
  });
  const data = unwrapData<{ points?: Array<Record<string, unknown>>; totals?: Record<string, unknown> }>(response.data);
  const points = (data.points ?? []).map((point) => ({
    timestamp: String(point.timestamp ?? ""),
    rxBps: Number(point.rx_bps ?? 0),
    txBps: Number(point.tx_bps ?? 0),
    totalBytes: Number(point.total_bytes ?? 0),
    downloadBytes: Number(point.download_bytes ?? 0),
    uploadBytes: Number(point.upload_bytes ?? 0),
  }));

  return {
    range,
    isp: undefined,
    totals: {
      rxBytes: Number(data.totals?.download_bytes ?? 0),
      txBytes: Number(data.totals?.upload_bytes ?? 0),
      combinedBytes: Number(data.totals?.total_bytes ?? 0),
    },
    points,
  } as IspHistoryResponse;
}

async function fetchIspHealthHistory(ispId: string, range: RangeOption) {
  const response = await api.get(`/api/dashboard/isps/${ispId}/health-history`, {
    params: { range },
  });
  const data = unwrapData<Record<string, unknown>>(response.data);

  return {
    latest: {
      latencyMs: (data.latest as Record<string, unknown>)?.latency_ms == null ? null : Number((data.latest as Record<string, unknown>)?.latency_ms),
      packetLossPercent:
        (data.latest as Record<string, unknown>)?.packet_loss_percent == null ? null : Number((data.latest as Record<string, unknown>)?.packet_loss_percent),
      jitterMs: (data.latest as Record<string, unknown>)?.jitter_ms == null ? null : Number((data.latest as Record<string, unknown>)?.jitter_ms),
      status:
        (data.latest as Record<string, unknown>)?.status === "offline"
          ? "offline"
          : (data.latest as Record<string, unknown>)?.status === "degraded"
            ? "degraded"
            : "online",
      recordedAt: ((data.latest as Record<string, unknown>)?.recorded_at as string | null | undefined) ?? null,
    },
    averages: {
      latencyMs: (data.averages as Record<string, unknown>)?.latency_ms == null ? null : Number((data.averages as Record<string, unknown>)?.latency_ms),
      packetLossPercent:
        (data.averages as Record<string, unknown>)?.packet_loss_percent == null ? null : Number((data.averages as Record<string, unknown>)?.packet_loss_percent),
    },
    outages: {
      count: Number((data.outages as Record<string, unknown>)?.count ?? 0),
      totalDowntimeMinutes: Number((data.outages as Record<string, unknown>)?.total_downtime_minutes ?? 0),
      items: Array.isArray((data.outages as Record<string, unknown>)?.items)
        ? (((data.outages as Record<string, unknown>)?.items as Array<Record<string, unknown>>).map((item) => ({
            startedAt: String(item.started_at ?? ""),
            endedAt: (item.ended_at as string | null | undefined) ?? null,
            durationMinutes: Number(item.duration_minutes ?? 0),
          })))
        : [],
    },
    points: Array.isArray(data.points)
      ? (data.points as Array<Record<string, unknown>>).map((point) => ({
          timestamp: String(point.timestamp ?? ""),
          rxBps: 0,
          txBps: 0,
          latencyMs: point.latency_ms == null ? null : Number(point.latency_ms),
          packetLossPercent: point.packet_loss_percent == null ? null : Number(point.packet_loss_percent),
          jitterMs: point.jitter_ms == null ? null : Number(point.jitter_ms),
          status:
            point.status === "offline" ? "offline" : point.status === "degraded" ? "degraded" : "online",
        }))
      : [],
  } satisfies IspHealthHistoryResponse;
}

export function useIspHistory(ispId: string, range: RangeOption) {
  return useQuery({
    queryKey: ["isps", ispId, range],
    queryFn: () => fetchIspHistory(ispId, range),
    enabled: Boolean(ispId),
    refetchInterval: 30_000,
  });
}

export function useIspHealthHistory(ispId: string, range: RangeOption) {
  return useQuery({
    queryKey: ["isps", ispId, "health-history", range],
    queryFn: () => fetchIspHealthHistory(ispId, range),
    enabled: Boolean(ispId),
    refetchInterval: 30_000,
  });
}
