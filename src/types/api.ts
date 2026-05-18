export type RangeOption = "10m" | "1h" | "today" | "24h" | "7d" | "30d" | "cycle" | "prev_cycle";
export type UserState = "NORMAL" | "THROTTLED";
export type GroupKey = "STARLINK_GROUP" | "SMART_GROUP";
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
  groupPolicies: Array<{
    key: GroupKey;
    label: string;
    subnets: string[];
    policy: {
      starlink?: number;
      smart_a?: number;
      smart_b?: number;
    };
  }>;
  starlinkUsage: {
    label: string;
    usedBytes: number;
    capBytes: number;
    usagePercent: number;
    averageDailyBytes: number;
    projectedMonthlyBytes: number;
    daysElapsed: number;
    daysInMonth: number;
    dailyTrend: Array<{ date: string; totalBytes: number }>;
    thresholds: Array<{ percent: number; reached: boolean }>;
  } | null;
  smartbroTotal: {
    label: string;
    usedBytes: number;
    items: Array<{ label: string; usedBytes: number }>;
  } | null;
  distributionNote: string | null;
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
  meta: PaginationMeta;
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

export type PopularDestinationCategory = "apps" | "sites" | "games";
export type PopularDestinationStatus = "active" | "not_configured";

export interface PopularDestinationItem {
  id: string;
  name: string;
  category: PopularDestinationCategory;
  visits: number;
  totalBytes: number;
  sharePercent: number;
  topUser?: string | null;
  lastSeenAt?: string | null;
}

export interface PopularDestinationsResponse {
  range: RangeOption;
  collectionStatus: PopularDestinationStatus;
  items: Record<PopularDestinationCategory, PopularDestinationItem[]>;
}

export interface GroupUsageItem {
  group: GroupKey;
  label: string;
  subnets: string[];
  policy: {
    starlink?: number;
    smart_a?: number;
    smart_b?: number;
  };
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

export interface PaginationMeta {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface UsersQueryParams {
  page?: number;
  perPage?: number;
  search?: string;
  group?: "ALL" | GroupKey;
  state?: "ALL" | UserState;
  sort?: "name" | "usedBytes" | "remainingBytes" | "usagePercent" | "lastUpdated";
  direction?: "asc" | "desc";
}

export interface LoginPayload {
  email: string;
  password: string;
}
