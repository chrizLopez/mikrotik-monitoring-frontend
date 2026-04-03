import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { LoginPage } from "@/features/auth/pages/LoginPage";

const mockedLogin = vi.fn();

vi.mock("@/features/auth/auth-context", () => ({
  useAuth: () => ({
    status: "unauthenticated",
    login: mockedLogin,
  }),
}));

describe("LoginPage", () => {
  it("renders inputs and validates empty submission", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText(/admin email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /login/i }));

    expect(screen.getByText(/admin email and password are required/i)).toBeInTheDocument();
    expect(mockedLogin).not.toHaveBeenCalled();
  });
});
