import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DashboardOverviewPage } from "@/features/dashboard/pages/DashboardOverviewPage";

vi.mock("recharts", () => {
  const Mock = ({ children }: { children?: ReactNode }) => <div>{children}</div>;

  return {
    ResponsiveContainer: Mock,
    LineChart: Mock,
    PieChart: Mock,
    BarChart: Mock,
    CartesianGrid: Mock,
    XAxis: Mock,
    YAxis: Mock,
    Tooltip: Mock,
    Legend: Mock,
    Line: Mock,
    Pie: Mock,
    Cell: Mock,
    Bar: Mock,
  };
});

vi.mock("@/features/dashboard/api", () => ({
  useDashboardSummary: () => ({
    isLoading: false,
    isError: false,
    data: {
      range: "cycle",
      billingCycleLabel: "Current Cycle",
      lastPollAt: "2026-04-15T10:00:00Z",
      apiStatus: "online",
      totals: {
        totalUsageBytes: 1000,
        totalActiveUsers: 7,
        throttledUsers: 1,
        activeIsps: 3,
      },
      cards: [],
      networkModel: {
        mode: "shared_equal_pcc",
        summary: "All monitored users share three WANs through equal PCC with per-WAN failover.",
        distributionLabel: "33.33% / 33.33% / 33.33%",
        wanCount: 3,
        isGroupRoutingEnabled: false,
        priorityAppsStatus: "planned",
        streamingShapingStatus: "planned",
        retiredFeatures: ["Old Starlink WAN", "group-based WAN pinning", "GROUP_A_TOTAL parent queue"],
        wans: [
          {
            name: "Gomo",
            interfaceName: "ether1",
            gateway: "192.168.254.1",
            connectionMark: "conn_gomo",
            routingMark: "to_GOMO",
            displayOrder: 1,
            sharePercent: 33.33,
          },
          {
            name: "Starlink ISP New",
            interfaceName: "ether2",
            gateway: "100.64.0.1",
            connectionMark: "conn_starlink",
            routingMark: "to_STARLINK",
            displayOrder: 2,
            sharePercent: 33.33,
          },
          {
            name: "Smart Bro ISP",
            interfaceName: "ether4",
            gateway: "192.168.1.1",
            connectionMark: "conn_smart",
            routingMark: "to_SMART",
            displayOrder: 3,
            sharePercent: 33.33,
          },
        ],
      },
    },
  }),
  useDashboardLive: () => ({
    isError: false,
    data: {
      isps: [
        {
          id: "1",
          name: "Gomo",
          interfaceName: "ether1",
          gateway: "192.168.254.1",
          status: "online",
          currentRxBps: 1,
          currentTxBps: 1,
          currentTotalBps: 2,
          downloadBytes: 1,
          uploadBytes: 1,
          totalTrafficBytes: 2,
          sharePercent: 33.33,
          lastUpdatedAt: "2026-04-15T10:00:00Z",
          trend: [],
        },
      ],
      topActiveUsers: [],
    },
  }),
  useIspDistribution: () => ({
    isError: false,
    data: {
      range: "cycle",
      totalBytes: 1000,
      items: [],
    },
  }),
  useTopUsers: () => ({
    isError: false,
    data: {
      range: "cycle",
      items: [],
    },
  }),
  useGroupUsage: () => ({
    data: {
      range: "cycle",
      items: [
        { group: "GROUP_A", totalBytes: 100, users: 3 },
        { group: "GROUP_B", totalBytes: 200, users: 4 },
      ],
    },
  }),
  useAlerts: () => ({
    isError: false,
    data: {
      activeIssues: 0,
      healthAlerts: [],
      quotaAlerts: [],
      usageAlerts: [],
    },
  }),
  useComparisons: () => ({
    data: {
      cycleVsPreviousCycle: {
        currentLabel: "Current",
        previousLabel: "Previous",
        totalIspTraffic: { current: 0, previous: 0, changePercent: 0 },
        totalUserTraffic: { current: 0, previous: 0, changePercent: 0 },
        topUsers: [],
        groupUsage: [],
      },
    },
  }),
}));

describe("DashboardOverviewPage", () => {
  it("renders the shared PCC architecture and new WAN labels", () => {
    render(
      <MemoryRouter>
        <DashboardOverviewPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Network Model")).toBeInTheDocument();
    expect(screen.getByText(/all monitored users share three wans through equal pcc/i)).toBeInTheDocument();
    expect(screen.getAllByText("Gomo").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Starlink ISP New").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Smart Bro ISP").length).toBeGreaterThan(0);
    expect(screen.queryByText(/Old Starlink/i)).not.toBeInTheDocument();
    expect(screen.getByText(/group labels remain available for reporting only/i)).toBeInTheDocument();
  });
});
