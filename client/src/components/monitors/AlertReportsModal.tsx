import { useEffect, useState } from "react";
import { BellRing, Mail, FileText, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export type ReportFrequency = "hourly" | "daily" | "weekly";
export type ReportFormat = "email" | "pdf" | "both";

export interface AlertReportConfig {
  enabled: boolean;
  email: string;
  frequency: ReportFrequency;
  format: ReportFormat;
  onlyViolations: boolean;
  latencyOnly: boolean;
  downtimeOnly: boolean;
}

const STORAGE_KEY = "pulseboard:alert-reports";

const DEFAULT: AlertReportConfig = {
  enabled: false,
  email: "",
  frequency: "daily",
  format: "email",
  onlyViolations: true,
  latencyOnly: false,
  downtimeOnly: false,
};

export function loadAlertReportConfig(): AlertReportConfig {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    return { ...DEFAULT, ...(JSON.parse(raw) as Partial<AlertReportConfig>) };
  } catch {
    return DEFAULT;
  }
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function AlertReportsModal({ open, onOpenChange }: Props) {
  const [cfg, setCfg] = useState<AlertReportConfig>(DEFAULT);

  useEffect(() => {
    if (open) setCfg(loadAlertReportConfig());
  }, [open]);

  const save = () => {
    if (cfg.enabled && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cfg.email)) {
      toast.error("Enter a valid email to receive reports");
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
      toast.success(
        cfg.enabled
          ? `Scheduled ${cfg.frequency} ${cfg.format === "email" ? "email" : cfg.format === "pdf" ? "PDF" : "email & PDF"} reports`
          : "Scheduled reports disabled",
      );
      onOpenChange(false);
    } catch {
      toast.error("Could not save preferences");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellRing className="h-4 w-4 text-primary" />
            Scheduled alert reports
          </DialogTitle>
          <DialogDescription>
            Get an email or PDF summary whenever monitors violate latency or
            downtime thresholds.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <CheckCircle2
                className={
                  "h-4 w-4 " +
                  (cfg.enabled
                    ? "text-[color:var(--success)]"
                    : "text-muted-foreground")
                }
              />
              <div>
                <div className="text-sm font-medium">
                  Enable scheduled reports
                </div>
                <div className="text-xs text-muted-foreground">
                  Runs automatically in the background
                </div>
              </div>
            </div>
            <Switch
              checked={cfg.enabled}
              onCheckedChange={(v) => setCfg((c) => ({ ...c, enabled: v }))}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="report-email"
              className="flex items-center gap-1.5 text-xs"
            >
              <Mail className="h-3.5 w-3.5" /> Deliver to
            </Label>
            <Input
              id="report-email"
              type="email"
              placeholder="you@company.com"
              value={cfg.email}
              onChange={(e) => setCfg((c) => ({ ...c, email: e.target.value }))}
              disabled={!cfg.enabled}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs">
                <Clock className="h-3.5 w-3.5" /> Frequency
              </Label>
              <Select
                value={cfg.frequency}
                onValueChange={(v) =>
                  setCfg((c) => ({ ...c, frequency: v as ReportFrequency }))
                }
                disabled={!cfg.enabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily digest</SelectItem>
                  <SelectItem value="weekly">Weekly summary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-xs">
                <FileText className="h-3.5 w-3.5" /> Format
              </Label>
              <Select
                value={cfg.format}
                onValueChange={(v) =>
                  setCfg((c) => ({ ...c, format: v as ReportFormat }))
                }
                disabled={!cfg.enabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email summary</SelectItem>
                  <SelectItem value="pdf">PDF attachment</SelectItem>
                  <SelectItem value="both">Email + PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2 rounded-md border border-border p-3">
            <div className="text-xs font-medium text-muted-foreground">
              Trigger conditions
            </div>
            <label className="flex items-center justify-between text-sm">
              <span>Only when thresholds are violated</span>
              <Switch
                checked={cfg.onlyViolations}
                onCheckedChange={(v) =>
                  setCfg((c) => ({ ...c, onlyViolations: v }))
                }
                disabled={!cfg.enabled}
              />
            </label>
            <label className="flex items-center justify-between text-sm">
              <span>Latency threshold breaches</span>
              <Switch
                checked={cfg.latencyOnly}
                onCheckedChange={(v) =>
                  setCfg((c) => ({ ...c, latencyOnly: v }))
                }
                disabled={!cfg.enabled}
              />
            </label>
            <label className="flex items-center justify-between text-sm">
              <span>Downtime threshold breaches</span>
              <Switch
                checked={cfg.downtimeOnly}
                onCheckedChange={(v) =>
                  setCfg((c) => ({ ...c, downtimeOnly: v }))
                }
                disabled={!cfg.enabled}
              />
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>Save preferences</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
