export type RangeOption = "today" | "24h" | "7d" | "30d" | "cycle";
export type UserState = "NORMAL" | "THROTTLED";
export type GroupKey = "GROUP_A" | "GROUP_B";

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
  totalBytes?: number;
  downloadBytes?: number;
  uploadBytes?: number;
}

export interface Isp {
  id: string;
  name: string;
  interfaceName: string;
  status: "online" | "offline";
  currentRxBps: number;
  currentTxBps: number;
  downloadBytes: number;
  uploadBytes: number;
  totalTrafficBytes: number;
  lastUpdatedAt: string | null;
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
  usedBytes: number;
  usagePercent: number;
  state: UserState;
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

export interface LoginPayload {
  email: string;
  password: string;
}
