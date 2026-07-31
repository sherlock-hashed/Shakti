import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Login } from "@/pages/Login";

// ─── Mock useAuth ───
const mockLogin = vi.fn();
const mockUseAuth = vi.fn(() => ({
  login: mockLogin,
  isAuthenticated: false,
  loading: false,
  user: null,
  token: null,
  register: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// ─── Mock sonner toast ───
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Login />
    </MemoryRouter>,
  );
}

describe("Login Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogin.mockReset();
  });

  it("renders the login form with email, password, and submit button", () => {
    renderLogin();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });

  it("does not call login when form is submitted empty (browser validation)", async () => {
    renderLogin();
    const user = userEvent.setup();

    const submitBtn = screen.getByRole("button", { name: /log in/i });
    await user.click(submitBtn);

    // The HTML required attribute prevents submission — login should NOT be called
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("calls login with email and password on valid submit", async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    renderLogin();
    const user = userEvent.setup();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitBtn = screen.getByRole("button", { name: /log in/i });

    await user.type(emailInput, "alice@test.com");
    await user.type(passwordInput, "password123");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledTimes(1);
      expect(mockLogin).toHaveBeenCalledWith("alice@test.com", "password123");
    });
  });

  it("shows error message when login fails", async () => {
    const error = new Error("Invalid email or password");
    mockLogin.mockRejectedValueOnce(error);
    renderLogin();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), "bad@test.com");
    await user.type(screen.getByLabelText(/password/i), "wrong");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/invalid email or password/i),
      ).toBeInTheDocument();
    });
  });
});
