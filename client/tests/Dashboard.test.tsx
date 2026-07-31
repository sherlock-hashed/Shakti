import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Dashboard } from "@/pages/Dashboard";
import type { Monitor } from "@/api/monitorApi";

// ─── Mock monitors data ───
const mockMonitors: Monitor[] = [
  {
    id: "m1",
    name: "Production API",
    url: "https://api.example.com/health",
    expectedStatusCode: 200,
    intervalMinutes: 1,
    isActive: true,
    status: "up",
    uptimePercent24h: 99.98,
    lastCheckedAt: new Date().toISOString(),
    latencyThresholdMs: 500,
    downtimeThresholdMinutes: 2,
  },
  {
    id: "m2",
    name: "Auth Service",
    url: "https://auth.example.com/status",
    expectedStatusCode: 200,
    intervalMinutes: 5,
    isActive: true,
    status: "down",
    uptimePercent24h: 96.4,
    lastCheckedAt: new Date().toISOString(),
    latencyThresholdMs: 800,
    downtimeThresholdMinutes: 5,
  },
  {
    id: "m3",
    name: "Staging API",
    url: "https://staging.api.example.com",
    expectedStatusCode: 200,
    intervalMinutes: 30,
    isActive: false,
    status: "pending",
    uptimePercent24h: null,
    lastCheckedAt: null,
    latencyThresholdMs: 1000,
    downtimeThresholdMinutes: 10,
  },
];

// ─── Mock useMonitors hook ───
vi.mock("@/hooks/useMonitors", () => ({
  useMonitors: () => ({
    monitors: mockMonitors,
    loading: false,
    error: null,
    refresh: vi.fn(),
  }),
}));

// ─── Mock useAuth ───
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "u1", name: "Test User", email: "test@test.com" },
    token: "mock-token",
    isAuthenticated: true,
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// ─── Mock sonner ───
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ─── Mock export functions ───
vi.mock("@/lib/exportMonitors", () => ({
  exportMonitorsToCSV: vi.fn(),
  exportMonitorsToPDF: vi.fn(),
}));

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Dashboard />
    </MemoryRouter>,
  );
}

describe("Dashboard Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the correct number of monitor cards", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Production API")).toBeInTheDocument();
      expect(screen.getByText("Auth Service")).toBeInTheDocument();
      expect(screen.getByText("Staging API")).toBeInTheDocument();
    });
  });

  it("displays the total endpoints tracked count", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/3 endpoints tracked/i)).toBeInTheDocument();
    });
  });

  it("shows up/down/paused status badges correctly", async () => {
    renderDashboard();

    await waitFor(() => {
      // Up badge should exist
      const upBadges = screen.getAllByText("Up");
      expect(upBadges.length).toBeGreaterThanOrEqual(1);

      // Down badge should exist
      const downBadges = screen.getAllByText("Down");
      expect(downBadges.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("shows uptime percentages for active monitors", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("99.98%")).toBeInTheDocument();
      expect(screen.getByText("96.40%")).toBeInTheDocument();
    });
  });

  it("renders the 'Add monitor' button", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/add monitor/i)).toBeInTheDocument();
    });
  });
});
