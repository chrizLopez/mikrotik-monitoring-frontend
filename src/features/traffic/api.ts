import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import {
  RangeOption,
  TrafficCategoryListResponse,
  TrafficHistoryResponse,
  TrafficListResponse,
  TrafficOverviewResponse,
} from "@/types/api";

function unwrapData<T>(payload: T | { data: T }) {
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data;
  }

  return payload as T;
}

function mapEntity(item: Record<string, unknown>) {
  return {
    entityId: item.entity_id == null ? null : Number(item.entity_id),
    entityType: (item.entity_type as TrafficListResponse["items"][number]["entityType"]) ?? "unknown",
    displayName: String(item.display_name ?? "Unknown"),
    categoryName: (item.category_name as string | null | undefined) ?? null,
    confidenceScore: item.confidence_score == null ? null : Number(item.confidence_score),
    confidenceLabel: (item.confidence_label as TrafficListResponse["items"][number]["confidenceLabel"]) ?? "unknown",
    uploadBytes: Number(item.upload_bytes ?? 0),
    downloadBytes: Number(item.download_bytes ?? 0),
    totalBytes: Number(item.total_bytes ?? 0),
  };
}

function mapRange(data: Record<string, unknown>) {
  const range = (data.range as Record<string, unknown>) ?? {};

  return {
    key: (range.key as RangeOption | undefined) ?? "cycle",
    label: String(range.label ?? ""),
    start: String(range.start ?? ""),
    end: String(range.end ?? ""),
    bucket: String(range.bucket ?? "hour"),
  };
}

async function fetchTrafficList(endpoint: string, range: RangeOption, limit = 10) {
  const response = await api.get(endpoint, { params: { range, limit } });
  const data = unwrapData<Record<string, unknown>>(response.data);

  return {
    range: mapRange(data),
    items: Array.isArray(data.items) ? (data.items as Array<Record<string, unknown>>).map(mapEntity) : [],
  } satisfies TrafficListResponse;
}

async function fetchTrafficCategories(range: RangeOption, limit = 10) {
  const response = await api.get("/api/dashboard/traffic/top-categories", { params: { range, limit } });
  const data = unwrapData<Record<string, unknown>>(response.data);

  return {
    range: mapRange(data),
    items: Array.isArray(data.items)
      ? (data.items as Array<Record<string, unknown>>).map((item) => ({
          label: String(item.label ?? "Unknown Encrypted"),
          uploadBytes: Number(item.upload_bytes ?? 0),
          downloadBytes: Number(item.download_bytes ?? 0),
          totalBytes: Number(item.total_bytes ?? 0),
        }))
      : [],
  } satisfies TrafficCategoryListResponse;
}

async function fetchTrafficOverview(range: RangeOption) {
  const response = await api.get("/api/dashboard/traffic/overview", { params: { range } });
  const data = unwrapData<Record<string, unknown>>(response.data);

  return {
    range: mapRange(data),
    totalClassifiedBytes: Number(data.total_classified_bytes ?? 0),
    totalUnclassifiedBytes: Number(data.total_unclassified_bytes ?? 0),
    classificationCoveragePercent: Number(data.classification_coverage_percent ?? 0),
    unknownEncryptedBytes: Number(data.unknown_encrypted_bytes ?? 0),
    topCategories: Array.isArray(data.top_categories)
      ? (data.top_categories as Array<Record<string, unknown>>).map((item) => ({
          label: String(item.label ?? "Unknown Encrypted"),
          uploadBytes: Number(item.upload_bytes ?? 0),
          downloadBytes: Number(item.download_bytes ?? 0),
          totalBytes: Number(item.total_bytes ?? 0),
        }))
      : [],
    topSites: Array.isArray(data.top_sites) ? (data.top_sites as Array<Record<string, unknown>>).map(mapEntity) : [],
    topApps: Array.isArray(data.top_apps) ? (data.top_apps as Array<Record<string, unknown>>).map(mapEntity) : [],
  } satisfies TrafficOverviewResponse;
}

async function fetchTrafficHistory(entityId: number, range: RangeOption) {
  const response = await api.get("/api/dashboard/traffic/history", { params: { entity_id: entityId, range } });
  const data = unwrapData<Record<string, unknown>>(response.data);

  return {
    range: mapRange(data),
    entity: {
      id: Number((data.entity as Record<string, unknown>)?.id ?? 0),
      entityType: ((data.entity as Record<string, unknown>)?.entity_type as TrafficHistoryResponse["entity"]["entityType"]) ?? "unknown",
      canonicalName: String((data.entity as Record<string, unknown>)?.canonical_name ?? ""),
      displayName: String((data.entity as Record<string, unknown>)?.display_name ?? ""),
      categoryName: ((data.entity as Record<string, unknown>)?.category_name as string | null | undefined) ?? null,
      vendorName: ((data.entity as Record<string, unknown>)?.vendor_name as string | null | undefined) ?? null,
      metadata: ((data.entity as Record<string, unknown>)?.metadata as Record<string, unknown> | null | undefined) ?? null,
    },
    points: Array.isArray(data.points)
      ? (data.points as Array<Record<string, unknown>>).map((point) => ({
          timestamp: String(point.timestamp ?? ""),
          uploadBytes: Number(point.upload_bytes ?? 0),
          downloadBytes: Number(point.download_bytes ?? 0),
          totalBytes: Number(point.total_bytes ?? 0),
        }))
      : [],
  } satisfies TrafficHistoryResponse;
}

export function useTrafficTopSites(range: RangeOption, limit = 10) {
  return useQuery({
    queryKey: ["traffic", "top-sites", range, limit],
    queryFn: () => fetchTrafficList("/api/dashboard/traffic/top-sites", range, limit),
  });
}

export function useTrafficTopApps(range: RangeOption, limit = 10) {
  return useQuery({
    queryKey: ["traffic", "top-apps", range, limit],
    queryFn: () => fetchTrafficList("/api/dashboard/traffic/top-apps", range, limit),
  });
}

export function useTrafficTopGames(range: RangeOption, limit = 10) {
  return useQuery({
    queryKey: ["traffic", "top-games", range, limit],
    queryFn: () => fetchTrafficList("/api/dashboard/traffic/top-games", range, limit),
  });
}

export function useTrafficTopCategories(range: RangeOption, limit = 10) {
  return useQuery({
    queryKey: ["traffic", "top-categories", range, limit],
    queryFn: () => fetchTrafficCategories(range, limit),
  });
}

export function useTrafficOverview(range: RangeOption) {
  return useQuery({
    queryKey: ["traffic", "overview", range],
    queryFn: () => fetchTrafficOverview(range),
  });
}

export function useTrafficHistory(entityId: number | null, range: RangeOption) {
  return useQuery({
    queryKey: ["traffic", "history", entityId, range],
    queryFn: () => fetchTrafficHistory(entityId ?? 0, range),
    enabled: entityId != null,
  });
}

export function useUserTrafficTopDestinations(userId: string, range: RangeOption, limit = 10) {
  return useQuery({
    queryKey: ["traffic", "user", userId, range, limit],
    queryFn: () => fetchTrafficList(`/api/dashboard/traffic/users/${userId}/top-destinations`, range, limit),
    enabled: Boolean(userId),
  });
}

export function useIspTrafficTopDestinations(ispId: string, range: RangeOption, limit = 10) {
  return useQuery({
    queryKey: ["traffic", "isp", ispId, range, limit],
    queryFn: () => fetchTrafficList(`/api/dashboard/traffic/isps/${ispId}/top-destinations`, range, limit),
    enabled: Boolean(ispId),
  });
}

export function useGroupTrafficTopDestinations(group: "A" | "B", range: RangeOption, limit = 10) {
  return useQuery({
    queryKey: ["traffic", "group", group, range, limit],
    queryFn: async () => {
      const response = await api.get("/api/dashboard/traffic/groups/top-destinations", {
        params: { group, range, limit },
      });
      const data = unwrapData<Record<string, unknown>>(response.data);

      return {
        range: mapRange(data),
        items: Array.isArray(data.items) ? (data.items as Array<Record<string, unknown>>).map(mapEntity) : [],
      } satisfies TrafficListResponse;
    },
  });
}
