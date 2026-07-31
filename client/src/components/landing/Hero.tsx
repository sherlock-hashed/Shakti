import { Link } from "react-router-dom";
import {
  ArrowRight,
  CircleCheck,
  CircleX,
  CircleDashed,
  Activity,
  BellRing,
  Mail,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Hero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "var(--gradient-hero)" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,oklch(0.7_0.15_240/0.15),transparent_60%)]" />
      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-14 md:px-6 md:pb-32 md:pt-24">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="animate-fade-in">
            <Badge
              variant="secondary"
              className="mb-5 gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-primary"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Real-time monitoring
            </Badge>
            <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
              Know the moment your APIs go{" "}
              <span className="text-primary">down</span>.
            </h1>
            <p className="mt-5 max-w-lg text-balance text-base text-muted-foreground sm:text-lg">
              Pulseboard checks every endpoint on a schedule, tracks uptime and
              response time, and emails you the instant something breaks — then
              again when it recovers.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button size="lg" asChild className="h-11 w-full px-5 sm:w-auto">
                <Link to="/register">
                  Get started free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-11 w-full px-5 sm:w-auto"
              >
                <Link to="/login">View demo</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <CircleCheck className="h-4 w-4 text-[color:var(--success)]" />
                No credit card
              </div>
              <div className="flex items-center gap-2">
                <CircleCheck className="h-4 w-4 text-[color:var(--success)]" />
                Setup in 60 seconds
              </div>
            </div>
          </div>

          <div className="animate-fade-in [animation-delay:120ms]">
            <LiveDashboardMock />
          </div>
        </div>
      </div>
    </section>
  );
}

type MockStatus = "up" | "down" | "pending";
interface MockRow {
  name: string;
  url: string;
  status: MockStatus;
  baseMs: number;
  ms: number;
  uptime: number;
  pulse: number;
}

type SceneId = "healthy" | "degrading" | "incident" | "alert" | "recovering";
interface Scene {
  id: SceneId;
  label: string;
  caption: string;
  duration: number; // ticks
}
const SCENES: Scene[] = [
  {
    id: "healthy",
    label: "All systems operational",
    caption: "Checking every endpoint on schedule",
    duration: 5,
  },
  {
    id: "degrading",
    label: "Latency rising",
    caption: "Payments Gateway approaching threshold",
    duration: 4,
  },
  {
    id: "incident",
    label: "Incident detected",
    caption: "Payments Gateway returned 503",
    duration: 5,
  },
  {
    id: "alert",
    label: "Alert dispatched",
    caption: "Email sent to on-call engineers",
    duration: 4,
  },
  {
    id: "recovering",
    label: "Service recovered",
    caption: "Payments Gateway back online",
    duration: 4,
  },
];

function LiveDashboardMock() {
  const initial: MockRow[] = useMemo(
    () => [
      {
        name: "Production API",
        url: "api.example.com/health",
        status: "up",
        baseMs: 140,
        ms: 142,
        uptime: 99.98,
        pulse: 0,
      },
      {
        name: "Auth Service",
        url: "auth.example.com/status",
        status: "up",
        baseMs: 205,
        ms: 208,
        uptime: 99.82,
        pulse: 0,
      },
      {
        name: "Payments Gateway",
        url: "payments.example.com/ping",
        status: "up",
        baseMs: 260,
        ms: 268,
        uptime: 99.4,
        pulse: 0,
      },
      {
        name: "CDN Edge",
        url: "cdn.example.com/health",
        status: "up",
        baseMs: 60,
        ms: 61,
        uptime: 99.99,
        pulse: 0,
      },
      {
        name: "Staging API",
        url: "staging.api.example.com",
        status: "pending",
        baseMs: 180,
        ms: 0,
        uptime: 0,
        pulse: 0,
      },
    ],
    [],
  );
  const [rows, setRows] = useState<MockRow[]>(initial);
  const [points, setPoints] = useState<number[]>(() => [
    40, 55, 44, 60, 48, 70, 58, 66, 52, 88, 62, 74, 68, 80, 72,
  ]);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [sceneIdx, setSceneIdx] = useState(0);
  const [sceneTick, setSceneTick] = useState(0);
  const [toast, setToast] = useState<null | { title: string; body: string }>(
    null,
  );
  const tickRef = useRef(0);
  const scene = SCENES[sceneIdx];

  useEffect(() => {
    const t = setInterval(() => {
      tickRef.current += 1;
      const tick = tickRef.current;
      setSecondsAgo((s) => (s >= 58 ? 0 : s + 2));

      setSceneTick((st) => {
        const next = st + 1;
        if (next >= scene.duration) {
          setSceneIdx((i) => (i + 1) % SCENES.length);
          return 0;
        }
        return next;
      });

      setRows((prev) =>
        prev.map((r, i) => {
          let status = r.status;
          let baseMs = r.baseMs;
          if (r.name === "Payments Gateway") {
            if (scene.id === "healthy") {
              status = "up";
              baseMs = 260;
            } else if (scene.id === "degrading") {
              status = "up";
              baseMs = 520;
            } else if (scene.id === "incident" || scene.id === "alert") {
              status = "down";
            } else if (scene.id === "recovering") {
              status = "up";
              baseMs = 300;
            }
          }
          if (r.name === "Staging API" && tick >= 3) status = "up";

          const jitter =
            (Math.sin(tick / 2 + i) + Math.cos(tick / 3 + i * 1.3)) * 14;
          const ms =
            status === "up"
              ? Math.max(
                  20,
                  Math.round(baseMs + jitter + (Math.random() - 0.5) * 18),
                )
              : 0;
          const uptime =
            status === "up"
              ? Math.min(100, r.uptime + 0.0005)
              : status === "down"
                ? Math.max(90, r.uptime - 0.01)
                : r.uptime;
          const pulse = tick % (i + 3) === 0 ? tick : r.pulse;
          return { ...r, status, ms, uptime, pulse };
        }),
      );

      setPoints((prev) => {
        const next = prev.slice(1);
        const last = prev[prev.length - 1];
        const target =
          scene.id === "healthy"
            ? 55
            : scene.id === "degrading"
              ? 85
              : scene.id === "incident"
                ? 98
                : scene.id === "alert"
                  ? 92
                  : 60;
        const drift =
          last + (target - last) * 0.35 + (Math.random() - 0.5) * 14;
        next.push(Math.max(30, Math.min(100, drift)));
        return next;
      });
    }, 1600);
    return () => clearInterval(t);
  }, [scene.id, scene.duration]);

  // Toast for alert scene
  useEffect(() => {
    if (scene.id === "alert" && sceneTick === 0) {
      setToast({
        title: "Alert sent",
        body: "Payments Gateway is down · on-call notified",
      });
      const to = setTimeout(() => setToast(null), 3200);
      return () => clearTimeout(to);
    }
    if (scene.id === "recovering" && sceneTick === 0) {
      setToast({ title: "Recovered", body: "Payments Gateway is back online" });
      const to = setTimeout(() => setToast(null), 2800);
      return () => clearTimeout(to);
    }
  }, [scene.id, sceneTick]);

  const upRows = rows.filter((r) => r.status === "up");
  const avg = upRows.length
    ? Math.round(upRows.reduce((s, r) => s + r.ms, 0) / upRows.length)
    : 0;
  const incidentActive = scene.id === "incident" || scene.id === "alert";

  return (
    <div className="relative">
      <div
        className="absolute -inset-6 -z-10 rounded-3xl opacity-40 blur-3xl"
        style={{
          background:
            "linear-gradient(120deg, oklch(0.72 0.14 235 / 0.5), transparent)",
        }}
      />
      <div className="rounded-2xl border border-border/60 bg-card/80 p-3 shadow-[var(--shadow-elegant)] backdrop-blur">
        <div className="flex items-center gap-1.5 border-b border-border/60 px-2 pb-2">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--warning)]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--success)]/80" />
          <span className="ml-3 truncate font-mono text-[10px] text-muted-foreground sm:text-xs">
            pulseboard.app/dashboard
          </span>
        </div>
        <div className="p-3 sm:p-4">
          {/* Scene caption */}
          <div
            key={scene.id}
            className={
              "mb-3 flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs animate-fade-in " +
              (incidentActive
                ? "border-destructive/30 bg-destructive/10 text-destructive"
                : scene.id === "degrading"
                  ? "border-[color:var(--warning)]/30 bg-[color:var(--warning)]/10 text-[color:var(--warning)]"
                  : "border-[color:var(--success)]/25 bg-[color:var(--success)]/10 text-[color:var(--success)]")
            }
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
            </span>
            <span className="font-medium">{scene.label}</span>
            <span className="hidden truncate opacity-70 sm:inline">
              · {scene.caption}
            </span>
          </div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Monitors</div>
              <div className="text-xs text-muted-foreground">
                Last check <span className="font-mono">{secondsAgo}s</span> ago
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              <Activity className="h-3 w-3 text-primary" /> Live
            </div>
          </div>
          <div className="mb-4 rounded-lg border border-border bg-background/60 p-3">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Response time · 24h</span>
              <span className="font-mono text-foreground">avg {avg}ms</span>
            </div>
            <LiveSparkline points={points} incident={incidentActive} />
          </div>
          <div className="space-y-1.5">
            {rows.map((r) => (
              <div
                key={r.name}
                className={
                  "flex items-center justify-between gap-2 rounded-md border border-border/60 bg-background/50 px-2.5 py-2 text-xs transition-colors sm:px-3 " +
                  (r.status === "down"
                    ? "border-destructive/30 bg-destructive/[0.04]"
                    : "")
                }
              >
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  {r.status === "up" && (
                    <CircleCheck className="h-3.5 w-3.5 shrink-0 text-[color:var(--success)]" />
                  )}
                  {r.status === "down" && (
                    <CircleX className="h-3.5 w-3.5 shrink-0 text-destructive" />
                  )}
                  {r.status === "pending" && (
                    <CircleDashed className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground [animation-duration:2.5s]" />
                  )}
                  <div className="min-w-0">
                    <div className="truncate font-medium">{r.name}</div>
                    <div className="truncate font-mono text-[10px] text-muted-foreground">
                      {r.url}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 font-mono text-[11px] text-muted-foreground sm:gap-4">
                  <span className="hidden sm:inline">
                    {r.uptime ? r.uptime.toFixed(2) + "%" : "—"}
                  </span>
                  <TickingMs value={r.ms} pulse={r.pulse} />
                </div>
              </div>
            ))}
          </div>
          {/* Scene progress dots */}
          <div className="mt-4 flex items-center justify-center gap-1.5">
            {SCENES.map((s, i) => (
              <span
                key={s.id}
                className={
                  "h-1 rounded-full transition-all duration-500 " +
                  (i === sceneIdx ? "w-6 bg-primary" : "w-1.5 bg-border")
                }
              />
            ))}
          </div>
        </div>
        {/* Toast overlay */}
        {toast && (
          <div className="pointer-events-none absolute right-3 top-3 z-10 animate-fade-in sm:right-4 sm:top-4">
            <div
              className={
                "flex items-start gap-2 rounded-lg border bg-card/95 px-3 py-2 shadow-[var(--shadow-elegant)] backdrop-blur " +
                (scene.id === "alert"
                  ? "border-destructive/40"
                  : "border-[color:var(--success)]/40")
              }
            >
              {scene.id === "alert" ? (
                <BellRing className="mt-0.5 h-4 w-4 text-destructive" />
              ) : (
                <Mail className="mt-0.5 h-4 w-4 text-[color:var(--success)]" />
              )}
              <div>
                <div className="text-xs font-semibold">{toast.title}</div>
                <div className="text-[10px] text-muted-foreground">
                  {toast.body}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LiveSparkline({
  points,
  incident,
}: {
  points: number[];
  incident?: boolean;
}) {
  const w = 300;
  const h = 60;
  const step = w / (points.length - 1);
  const max = Math.max(...points);
  const d = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${i * step} ${h - (p / max) * (h - 6) - 3}`,
    )
    .join(" ");
  const area = d + ` L ${w} ${h} L 0 ${h} Z`;
  const lastX = (points.length - 1) * step;
  const lastY = h - (points[points.length - 1] / max) * (h - 6) - 3;
  const strokeColor = incident ? "oklch(0.62 0.22 25)" : "oklch(0.62 0.17 245)";
  return (
    <svg viewBox="0 0 300 60" className="h-16 w-full overflow-visible">
      <defs>
        <linearGradient id="hg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#hg)" />
      <path
        d={d}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        style={{ transition: "stroke 400ms" }}
      />
      <circle cx={lastX} cy={lastY} r={3} fill={strokeColor} />
      <circle cx={lastX} cy={lastY} r={6} fill={strokeColor} opacity={0.35}>
        <animate
          attributeName="r"
          values="3;10;3"
          dur="1.6s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.5;0;0.5"
          dur="1.6s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}

function TickingMs({ value, pulse }: { value: number; pulse: number }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const from = display;
    const to = value;
    const start = performance.now();
    const dur = 400;
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      setDisplay(Math.round(from + (to - from) * t));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <span
      key={pulse}
      className="inline-block w-12 text-right tabular-nums text-foreground/90 animate-fade-in"
    >
      {value ? `${display}ms` : "—"}
    </span>
  );
}
