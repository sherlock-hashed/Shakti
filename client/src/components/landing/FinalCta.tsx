import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
      <div
        className="relative overflow-hidden rounded-3xl border border-primary/30 px-6 py-16 text-center shadow-[var(--shadow-elegant)] md:px-16 md:py-20"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.62 0.17 245), oklch(0.55 0.16 260))",
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,oklch(1_0_0/0.15),transparent_50%)]" />
        <h2 className="relative text-balance text-3xl font-semibold tracking-tight text-primary-foreground md:text-4xl">
          Stop finding out about outages from customers
        </h2>
        <p className="relative mx-auto mt-3 max-w-lg text-primary-foreground/85">
          Add your first monitor in under a minute. No credit card required.
        </p>
        <div className="relative mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" variant="secondary" asChild className="h-11 px-6">
            <Link to="/register">
              Get started free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="ghost"
            asChild
            className="h-11 px-6 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
          >
            <Link to="/login">Log in</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
