export type RangeOption = "today" | "24h" | "7d" | "30d" | "cycle" | "prev_cycle";
export type UserState = "NORMAL" | "THROTTLED";
export type GroupKey = "GROUP_A" | "GROUP_B";
export type HealthStatus = "online" | "offline" | "degraded";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

export interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

export interface SummaryStat {
  label: string;
  value: number | string;
  change?: string;
  description?: string;
}

export interface DashboardSummaryResponse {
  range: RangeOption;
  billingCycleLabel: string;
  lastPollAt: string | null;
  apiStatus: "online" | "offline" | "degraded";
  totals: {
    totalUsageBytes: number;
    totalActiveUsers: number;
    throttledUsers: number;
    activeIsps: number;
  };
  cards: SummaryStat[];
}

export interface ThroughputPoint {
  timestamp: string;
  rxBps: number;
  txBps: number;
  totalBps?: number;
  totalBytes?: number;
  downloadBytes?: number;
  uploadBytes?: number;
  cumulativeBytes?: number;
  latencyMs?: number | null;
  packetLossPercent?: number | null;
  jitterMs?: number | null;
  status?: HealthStatus;
}

export interface Isp {
  id: string;
  name: string;
  interfaceName: string;
  status: HealthStatus;
  currentRxBps: number;
  currentTxBps: number;
  currentTotalBps?: number;
  downloadBytes: number;
  uploadBytes: number;
  totalTrafficBytes: number;
  sharePercent?: number;
  lastUpdatedAt: string | null;
  trend?: ThroughputPoint[];
}

export interface IspHistoryResponse {
  isp?: Isp;
  range: RangeOption;
  totals: {
    rxBytes: number;
    txBytes: number;
    combinedBytes: number;
  };
  points: ThroughputPoint[];
}

export interface DashboardIspsResponse {
  range: RangeOption;
  items: Isp[];
}

export interface UserRecord {
  id: string;
  name: string;
  subnet: string;
  group: GroupKey;
  state: UserState;
  currentMaxLimit: string | null;
  usedBytes: number;
  remainingBytes: number;
  quotaBytes: number;
  usagePercent: number;
  downloadBytes: number;
  uploadBytes: number;
  currentCombinedBps?: number;
  peakCombinedBps?: number;
  peakAt?: string | null;
  threshold?: 50 | 80 | 90 | 100 | null;
  lastUpdatedAt: string | null;
}

export interface DashboardUsersResponse {
  range: RangeOption;
  items: UserRecord[];
}

export interface UserHistoryResponse {
  user?: UserRecord;
  range: RangeOption;
  monthlyQuotaBytes: number;
  points: ThroughputPoint[];
}

export interface TopUserItem {
  id: string;
  name: string;
  group?: GroupKey;
  subnet?: string;
  usedBytes: number;
  remainingQuotaBytes?: number;
  usagePercent: number;
  state: UserState;
  currentMaxLimit?: string | null;
  currentCombinedBps?: number;
  peakCombinedBps?: number;
  peakAt?: string | null;
  uploadBytes?: number;
  downloadBytes?: number;
}

export interface TopUsersResponse {
  range: RangeOption;
  items: TopUserItem[];
}

export interface GroupUsageItem {
  group: GroupKey;
  totalBytes: number;
  users: number;
}

export interface GroupUsageResponse {
  range: RangeOption;
  items: GroupUsageItem[];
}

export interface ActiveUser {
  id: string;
  name: string;
  group: GroupKey;
  subnet: string;
  downloadBps: number;
  uploadBps: number;
  combinedBps: number;
  currentMaxLimit: string | null;
  state: UserState;
  lastSnapshotAt: string | null;
}

export interface LiveDashboardResponse {
  isps: Isp[];
  topActiveUsers: ActiveUser[];
}

export interface AlertItem {
  type: "quota" | "health" | "usage";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  subject: string;
  usagePercent?: number;
  latencyMs?: number | null;
  packetLossPercent?: number | null;
  combinedBps?: number;
  state?: UserState;
}

export interface AlertsResponse {
  activeIssues: number;
  quotaAlerts: AlertItem[];
  healthAlerts: AlertItem[];
  usageAlerts: AlertItem[];
}

export interface ComparisonMetric {
  current: number;
  previous: number;
  changePercent: number | null;
}

export interface ComparisonBlock {
  currentLabel: string;
  previousLabel: string;
  totalIspTraffic: ComparisonMetric;
  totalUserTraffic: ComparisonMetric;
  topUsers: Array<{ name: string; currentTotalBytes: number; previousTotalBytes: number; changePercent: number | null }>;
  groupUsage: Array<{ groupName: string; currentTotalBytes: number; previousTotalBytes: number; changePercent: number | null }>;
}

export interface ComparisonsResponse {
  todayVsYesterday: ComparisonBlock;
  cycleVsPreviousCycle: ComparisonBlock;
  last7dVsPrevious7d: ComparisonBlock;
}

export interface DistributionResponse {
  range: RangeOption;
  totalBytes: number;
  items: Isp[];
}

export interface QuotaTimelineResponse {
  summary: {
    usedBytes: number;
    remainingBytes: number;
    quotaBytes: number;
    usagePercent: number;
  };
  points: ThroughputPoint[];
}

export interface ThrottlingHistoryEntry {
  id: string;
  name: string;
  group: GroupKey;
  currentState: UserState;
  lastStateChange: string | null;
  throttledEvents: number;
  transitions: Array<{ fromState: UserState; toState: UserState; changedAt: string }>;
}

export interface ThrottlingHistoryResponse {
  items: ThrottlingHistoryEntry[];
}

export interface IspHealthHistoryResponse {
  latest: {
    latencyMs: number | null;
    packetLossPercent: number | null;
    jitterMs: number | null;
    status: HealthStatus;
    recordedAt: string | null;
  };
  averages: {
    latencyMs: number | null;
    packetLossPercent: number | null;
  };
  outages: {
    count: number;
    totalDowntimeMinutes: number;
    items: Array<{ startedAt: string; endedAt: string | null; durationMinutes: number }>;
  };
  points: ThroughputPoint[];
}

export interface ReportsResponse {
  topUsers: TopUserItem[];
  ispDistribution: DistributionResponse;
  alerts: AlertsResponse;
  comparisons: ComparisonsResponse;
}

export type TrafficEntityType = "website" | "app" | "game_service" | "category" | "unknown" | "other";
export type ConfidenceLabel = "high" | "medium" | "low" | "unknown" | "derived";

export interface TrafficEntitySummary {
  entityId: number | null;
  entityType: TrafficEntityType;
  displayName: string;
  categoryName: string | null;
  confidenceScore: number | null;
  confidenceLabel: ConfidenceLabel;
  uploadBytes: number;
  downloadBytes: number;
  totalBytes: number;
}

export interface TrafficCategorySummary {
  label: string;
  uploadBytes: number;
  downloadBytes: number;
  totalBytes: number;
}

export interface TrafficListResponse {
  range: {
    key: RangeOption;
    label: string;
    start: string;
    end: string;
    bucket: string;
  };
  items: TrafficEntitySummary[];
}

export interface TrafficCategoryListResponse {
  range: {
    key: RangeOption;
    label: string;
    start: string;
    end: string;
    bucket: string;
  };
  items: TrafficCategorySummary[];
}

export interface TrafficOverviewResponse {
  range: {
    key: RangeOption;
    label: string;
    start: string;
    end: string;
    bucket: string;
  };
  totalClassifiedBytes: number;
  totalUnclassifiedBytes: number;
  classificationCoveragePercent: number;
  unknownEncryptedBytes: number;
  topCategories: TrafficCategorySummary[];
  topSites: TrafficEntitySummary[];
  topApps: TrafficEntitySummary[];
}

export interface TrafficHistoryPoint {
  timestamp: string;
  uploadBytes: number;
  downloadBytes: number;
  totalBytes: number;
}

export interface TrafficHistoryResponse {
  range: {
    key: RangeOption;
    label: string;
    start: string;
    end: string;
    bucket: string;
  };
  entity: {
    id: number;
    entityType: TrafficEntityType;
    canonicalName: string;
    displayName: string;
    categoryName: string | null;
    vendorName: string | null;
    metadata: Record<string, unknown> | null;
  };
  points: TrafficHistoryPoint[];
}

export interface LoginPayload {
  email: string;
  password: string;
}
