import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/StatusBadge";

describe("StatusBadge", () => {
  it("renders the throttled label", () => {
    render(<StatusBadge status="THROTTLED" />);

    expect(screen.getByText("Throttled")).toBeInTheDocument();
  });
});
