// Mock data + mock API layer. Swap for real Axios calls once backend is live
// by replacing the mockMonitors implementation with axiosInstance requests.

export interface Monitor {
  id: string;
  name: string;
  url: string;
  expectedStatusCode: number;
  intervalMinutes: number;
  isActive: boolean;
  status: "up" | "down" | "pending";
  uptimePercent24h: number | null;
  lastCheckedAt: string | null;
  latencyThresholdMs: number;
  downtimeThresholdMinutes: number;
}

export interface Check {
  id: string;
  statusCode: number;
  responseTimeMs: number;
  isUp: boolean;
  checkedAt: string;
}

export interface MonitorDetail extends Monitor {
  checks: Check[];
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function genChecks(seed: number, isDown = false): Check[] {
  const now = Date.now();
  const out: Check[] = [];
  for (let i = 0; i < 40; i++) {
    const t = now - (39 - i) * 5 * 60_000;
    const baseline = 120 + Math.sin(i / 3 + seed) * 40 + seed * 10;
    const spike = i === 22 && isDown ? 2200 : 0;
    const isUp = !(isDown && (i === 22 || i === 23));
    out.push({
      id: `${seed}-${i}`,
      statusCode: isUp ? 200 : 503,
      responseTimeMs: Math.round(baseline + spike + Math.random() * 40),
      isUp,
      checkedAt: new Date(t).toISOString(),
    });
  }
  return out;
}

let monitors: Monitor[] = [
  {
    id: "1",
    name: "Production API",
    url: "https://api.example.com/health",
    expectedStatusCode: 200,
    intervalMinutes: 1,
    isActive: true,
    status: "up",
    uptimePercent24h: 99.98,
    lastCheckedAt: new Date(Date.now() - 42_000).toISOString(),
    latencyThresholdMs: 500,
    downtimeThresholdMinutes: 2,
  },
  {
    id: "2",
    name: "Auth Service",
    url: "https://auth.example.com/status",
    expectedStatusCode: 200,
    intervalMinutes: 5,
    isActive: true,
    status: "up",
    uptimePercent24h: 99.82,
    lastCheckedAt: new Date(Date.now() - 3 * 60_000).toISOString(),
    latencyThresholdMs: 800,
    downtimeThresholdMinutes: 5,
  },
  {
    id: "3",
    name: "Payments Gateway",
    url: "https://payments.example.com/ping",
    expectedStatusCode: 200,
    intervalMinutes: 1,
    isActive: true,
    status: "down",
    uptimePercent24h: 96.4,
    lastCheckedAt: new Date(Date.now() - 26_000).toISOString(),
    latencyThresholdMs: 400,
    downtimeThresholdMinutes: 1,
  },
  {
    id: "4",
    name: "Marketing Site",
    url: "https://www.example.com",
    expectedStatusCode: 200,
    intervalMinutes: 15,
    isActive: true,
    status: "up",
    uptimePercent24h: 100,
    lastCheckedAt: new Date(Date.now() - 8 * 60_000).toISOString(),
    latencyThresholdMs: 1500,
    downtimeThresholdMinutes: 15,
  },
  {
    id: "5",
    name: "Staging API",
    url: "https://staging.api.example.com/health",
    expectedStatusCode: 200,
    intervalMinutes: 30,
    isActive: false,
    status: "pending",
    uptimePercent24h: null,
    lastCheckedAt: null,
    latencyThresholdMs: 1000,
    downtimeThresholdMinutes: 10,
  },
  {
    id: "6",
    name: "CDN Edge",
    url: "https://cdn.example.com/health.json",
    expectedStatusCode: 200,
    intervalMinutes: 5,
    isActive: true,
    status: "up",
    uptimePercent24h: 99.99,
    lastCheckedAt: new Date(Date.now() - 90_000).toISOString(),
    latencyThresholdMs: 600,
    downtimeThresholdMinutes: 5,
  },
];

const checksById: Record<string, Check[]> = {};
monitors.forEach((m, i) => {
  checksById[m.id] = m.status === "pending" ? [] : genChecks(i, m.status === "down");
});

export const mockAuth = {
  async login(email: string, password: string) {
    await delay(600);
    if (!email || !password) throw new Error("Invalid email or password");
    if (password.length < 4) throw new Error("Invalid email or password");
    return {
      token: "mock-jwt-token",
      user: { id: "u1", name: email.split("@")[0] || "User", email },
    };
  },
  async register(name: string, email: string, password: string) {
    await delay(700);
    if (!name || !email || !password) throw new Error("All fields are required");
    return {
      token: "mock-jwt-token",
      user: { id: "u1", name, email },
    };
  },
};

export const mockMonitors = {
  async list(): Promise<Monitor[]> {
    await delay(400);
    // Nudge lastCheckedAt to simulate polling activity
    monitors = monitors.map((m) =>
      m.status === "pending" || !m.isActive
        ? m
        : { ...m, lastCheckedAt: new Date(Date.now() - Math.random() * 60_000).toISOString() },
    );
    return monitors.map((m) => ({ ...m }));
  },
  async get(id: string): Promise<MonitorDetail> {
    await delay(400);
    const m = monitors.find((x) => x.id === id);
    if (!m) throw new Error("Monitor not found");
    return { ...m, checks: checksById[id] ?? [] };
  },
  async create(input: Omit<Monitor, "id" | "status" | "uptimePercent24h" | "lastCheckedAt">): Promise<Monitor> {
    await delay(500);
    const m: Monitor = {
      ...input,
      id: String(Date.now()),
      status: "pending",
      uptimePercent24h: null,
      lastCheckedAt: null,
    };
    monitors = [m, ...monitors];
    checksById[m.id] = [];
    return m;
  },
  async update(id: string, input: Partial<Monitor>): Promise<Monitor> {
    await delay(500);
    monitors = monitors.map((m) => (m.id === id ? { ...m, ...input } : m));
    const updated = monitors.find((m) => m.id === id);
    if (!updated) throw new Error("Not found");
    return updated;
  },
  async remove(id: string): Promise<{ success: true }> {
    await delay(400);
    monitors = monitors.filter((m) => m.id !== id);
    delete checksById[id];
    return { success: true };
  },
};