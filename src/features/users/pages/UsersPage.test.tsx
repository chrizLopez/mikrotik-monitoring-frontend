import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { UsersPage } from "@/features/users/pages/UsersPage";

vi.mock("@/features/users/api", () => ({
  useUsers: () => ({
    isLoading: false,
    isError: false,
    isFetching: false,
    data: {
      range: "cycle",
      items: [
        {
          id: "1",
          name: "Home Router",
          subnet: "192.168.88.16/28",
          group: "GROUP_A",
          state: "NORMAL",
          currentMaxLimit: "3M/10M",
          usedBytes: 100,
          remainingBytes: 900,
          quotaBytes: 1000,
          usagePercent: 10,
          downloadBytes: 80,
          uploadBytes: 20,
          currentCombinedBps: 100,
          peakCombinedBps: 200,
          peakAt: null,
          threshold: null,
          lastUpdatedAt: "2026-04-15T10:00:00Z",
        },
      ],
      meta: {
        currentPage: 1,
        lastPage: 1,
        perPage: 15,
        total: 1,
        from: 1,
        to: 1,
      },
    },
  }),
}));

vi.mock("@/features/dashboard/api", () => ({
  useTopUsers: () => ({
    data: {
      range: "cycle",
      items: [],
    },
  }),
}));

describe("UsersPage", () => {
  it("shows only live per-subnet queues and keeps group labels informational", () => {
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/group labels are organizational only and do not imply wan routing/i)).toBeInTheDocument();
    expect(screen.getByText(/retired parent queues such as GROUP_A_TOTAL are not part of monitored user reporting/i)).toBeInTheDocument();
    expect(screen.getAllByText("Home Router").length).toBeGreaterThan(0);
    expect(screen.queryByText("GROUP_A_TOTAL")).not.toBeInTheDocument();
  });
});
