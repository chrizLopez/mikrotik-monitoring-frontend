import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { IspHistoryResponse, RangeOption } from "@/types/api";

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

export function useIspHistory(ispId: string, range: RangeOption) {
  return useQuery({
    queryKey: ["isps", ispId, range],
    queryFn: () => fetchIspHistory(ispId, range),
    enabled: Boolean(ispId),
    refetchInterval: 30_000,
  });
}
