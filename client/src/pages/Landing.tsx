import { useEffect } from "react";
import { PublicNavbar } from "@/components/landing/PublicNavbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { StatsStrip } from "@/components/landing/StatsStrip";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";

export function Landing() {
  useEffect(() => {
    document.title = "Pulseboard — Real-time API health monitoring";
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PublicNavbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <StatsStrip />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
