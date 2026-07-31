import { Activity, BellRing, LineChart, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: Activity,
    title: "Real-time health checks",
    desc: "Automated checks run on every endpoint you add, at the interval you choose.",
  },
  {
    icon: BellRing,
    title: "Instant alerts",
    desc: "Get emailed the moment something goes down — and again when it recovers.",
  },
  {
    icon: LineChart,
    title: "Uptime & response history",
    desc: "Track performance trends over time, not just current status.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by default",
    desc: "JWT-based auth. Every monitor is private to your account.",
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 py-24 md:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <div className="text-xs font-medium uppercase tracking-widest text-primary">
          Features
        </div>
        <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
          Everything you need to catch downtime early
        </h2>
        <p className="mt-3 text-muted-foreground">
          A focused monitoring toolkit — no bloat, no noisy dashboards, just the
          signals that matter.
        </p>
      </div>
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(({ icon: Icon, title, desc }, i) => (
          <div
            key={title}
            className="group relative rounded-xl border border-border/70 bg-card/60 p-6 transition-all animate-fade-in hover:-translate-y-1 hover:border-primary/30 hover:shadow-[var(--shadow-soft)]"
            style={{
              animationDelay: `${i * 80}ms`,
              animationFillMode: "backwards",
            }}
          >
            <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
