import { Plus, Radio, BellRing } from "lucide-react";

const steps = [
  { n: "01", icon: Plus, title: "Add an endpoint", desc: "Paste a URL, pick a check interval, and set the status code you expect." },
  { n: "02", icon: Radio, title: "We monitor for you", desc: "Automated checks run in the background. Uptime and latency are logged." },
  { n: "03", icon: BellRing, title: "Get alerted instantly", desc: "Email hits your inbox the moment status flips — and again when it recovers." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y border-border/60 bg-muted/30 py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-medium uppercase tracking-widest text-primary">How it works</div>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            From URL to peace of mind in three steps
          </h2>
        </div>
        <div className="relative mt-14 grid gap-6 md:grid-cols-3">
          {steps.map(({ n, icon: Icon, title, desc }, i) => (
            <div
              key={n}
              className="relative rounded-xl border border-border/70 bg-background p-6 shadow-[var(--shadow-soft)] transition-transform animate-fade-in hover:-translate-y-1"
              style={{ animationDelay: `${i * 100}ms`, animationFillMode: "backwards" }}
            >
              <div className="flex items-start justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="font-mono text-xs text-muted-foreground">{n}</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}