import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { IspDetailPage } from "@/features/isps/pages/IspDetailPage";

vi.mock("recharts", () => {
  const Mock = ({ children }: { children?: ReactNode }) => <div>{children}</div>;

  return {
    ResponsiveContainer: Mock,
    LineChart: Mock,
    CartesianGrid: Mock,
    XAxis: Mock,
    YAxis: Mock,
    Tooltip: Mock,
    Legend: Mock,
    Line: Mock,
  };
});

vi.mock("@/features/dashboard/api", () => ({
  useDashboardIsp: () => ({
    isLoading: false,
    isError: false,
    data: {
      id: "1",
      name: "Gomo",
      interfaceName: "ether1",
      gateway: "192.168.254.1",
      status: "online",
      currentRxBps: 100,
      currentTxBps: 200,
      currentTotalBps: 300,
      downloadBytes: 1000,
      uploadBytes: 2000,
      totalTrafficBytes: 3000,
      lastUpdatedAt: "2026-04-15T10:00:00Z",
    },
  }),
  useDashboardIsps: () => ({
    isLoading: true,
    isError: false,
    data: undefined,
  }),
}));

vi.mock("@/features/isps/api", () => ({
  useIspHistory: () => ({
    isLoading: false,
    isError: false,
    data: {
      range: "24h",
      totals: {
        rxBytes: 1000,
        txBytes: 2000,
        combinedBytes: 3000,
      },
      points: [],
    },
  }),
  useIspHealthHistory: () => ({
    isLoading: true,
    isError: false,
    data: undefined,
  }),
}));

describe("IspDetailPage", () => {
  it("renders core ISP data even when health history and ISP list are still loading", () => {
    render(
      <MemoryRouter initialEntries={["/isps/1"]}>
        <Routes>
          <Route path="/isps/:ispId" element={<IspDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getAllByText("Gomo").length).toBeGreaterThan(0);
    expect(screen.getByText(/shared pcc member with failover/i)).toBeInTheDocument();
    expect(screen.getByText(/loading isp health/i)).toBeInTheDocument();
  });
});
