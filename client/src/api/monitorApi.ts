import { axiosInstance } from "./axiosInstance";

// ─── Interfaces & Types ───
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

// ─── API Layer ───
export const monitorApi = {
  async list(): Promise<Monitor[]> {
    const res = await axiosInstance.get("/monitors");
    return res.data;
  },

  async get(id: string): Promise<MonitorDetail> {
    const res = await axiosInstance.get(`/monitors/${id}`);
    return res.data;
  },

  async create(
    input: Omit<
      Monitor,
      "id" | "status" | "uptimePercent24h" | "lastCheckedAt"
    >,
  ): Promise<Monitor> {
    const res = await axiosInstance.post("/monitors", input);
    return res.data;
  },

  async update(id: string, input: Partial<Monitor>): Promise<Monitor> {
    const res = await axiosInstance.patch(`/monitors/${id}`, input);
    return res.data;
  },

  async remove(id: string): Promise<{ success: true }> {
    const res = await axiosInstance.delete(`/monitors/${id}`);
    return res.data;
  },
};
