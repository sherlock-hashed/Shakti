import { Link } from "react-router-dom";
import { Activity, Github, Linkedin, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4 md:px-6">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Activity className="h-4 w-4" />
            </span>
            Pulseboard
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Lightweight uptime and API monitoring for teams that ship fast.
          </p>
        </div>
        <div>
          <div className="mb-3 text-sm font-semibold">Product</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <a href="#features" className="hover:text-foreground">
                Features
              </a>
            </li>
            <li>
              <a href="#how-it-works" className="hover:text-foreground">
                How it works
              </a>
            </li>
            <li>
              <Link to="/login" className="hover:text-foreground">
                Log in
              </Link>
            </li>
            <li>
              <Link to="/register" className="hover:text-foreground">
                Sign up
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="mb-3 text-sm font-semibold">Resources</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <a
                href="https://github.com/sherlock-hashed/Shakti"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-foreground"
              >
                <Github className="h-3.5 w-3.5" />
                GitHub repo
              </a>
            </li>
          </ul>
        </div>
        <div>
          <div className="mb-3 text-sm font-semibold">Connect</div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <a
              href="https://github.com/sherlock-hashed"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="grid h-9 w-9 place-items-center rounded-lg border border-border transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <Github className="h-4 w-4" />
            </a>
            <a
              href="https://in.linkedin.com/in/varad-parate-34b38328a"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="grid h-9 w-9 place-items-center rounded-lg border border-border transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <Linkedin className="h-4 w-4" />
            </a>
            <a
              href="mailto:varadparate@gmail.com"
              aria-label="Email"
              className="grid h-9 w-9 place-items-center rounded-lg border border-border transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <Mail className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground md:flex-row md:px-6">
          <p>© {new Date().getFullYear()} Pulseboard. All rights reserved.</p>
          <p>Built as a portfolio project — not a production service.</p>
        </div>
      </div>
    </footer>
  );
}
