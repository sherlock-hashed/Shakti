export function StatsStrip() {
  const stats = [
    { k: "60s", v: "Minimum check interval" },
    { k: "<5s", v: "Email alert delivery" },
    { k: "24h", v: "Rolling uptime window" },
    { k: "100%", v: "Open source" },
  ];
  return (
    <section id="why" className="mx-auto max-w-7xl px-4 py-20 md:px-6">
      <div className="grid divide-y divide-border rounded-2xl border border-border bg-card/60 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.v} className="px-6 py-8 text-center">
            <div className="font-mono text-3xl font-semibold text-primary md:text-4xl">
              {s.k}
            </div>
            <div className="mt-1.5 text-sm text-muted-foreground">{s.v}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
