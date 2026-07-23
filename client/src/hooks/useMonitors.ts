import { useCallback, useEffect, useRef, useState } from "react";
import { mockMonitors, type Monitor } from "@/api/mockData";

export function useMonitors(pollMs = 20_000) {
  const [monitors, setMonitors] = useState<Monitor[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async (isPoll = false) => {
    if (!isPoll) setLoading(true);
    try {
      const data = await mockMonitors.list();
      if (mounted.current) {
        setMonitors(data);
        setError(null);
      }
    } catch (e) {
      if (mounted.current) setError(e instanceof Error ? e.message : "Failed to load monitors");
    } finally {
      if (mounted.current && !isPoll) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    load(false);
    const id = setInterval(() => load(true), pollMs);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, [load, pollMs]);

  return { monitors, loading, error, refresh: () => load(false) };
}