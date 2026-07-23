import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { mockMonitors, type Monitor } from "@/api/mockData";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  monitor?: Monitor | null;
  onSuccess: () => void;
}

export function AddEditMonitorModal({ open, onOpenChange, monitor, onSuccess }: Props) {
  const isEdit = !!monitor;
  const [form, setForm] = useState({
    name: "",
    url: "",
    expectedStatusCode: 200,
    intervalMinutes: 5,
    isActive: true,
    latencyThresholdMs: 800,
    downtimeThresholdMinutes: 5,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setError(null);
      setForm(
        monitor
          ? {
              name: monitor.name,
              url: monitor.url,
              expectedStatusCode: monitor.expectedStatusCode,
              intervalMinutes: monitor.intervalMinutes,
              isActive: monitor.isActive,
              latencyThresholdMs: monitor.latencyThresholdMs,
              downtimeThresholdMinutes: monitor.downtimeThresholdMinutes,
            }
          : {
              name: "",
              url: "",
              expectedStatusCode: 200,
              intervalMinutes: 5,
              isActive: true,
              latencyThresholdMs: 800,
              downtimeThresholdMinutes: 5,
            },
      );
    }
  }, [open, monitor]);

  const isValidUrl = (u: string) => {
    try {
      const url = new URL(u);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) return setError("Name is required");
    if (!isValidUrl(form.url)) return setError("Please enter a valid URL (http or https)");
    if (form.expectedStatusCode < 100 || form.expectedStatusCode > 599) return setError("Status code must be between 100 and 599");
    if (form.latencyThresholdMs < 50 || form.latencyThresholdMs > 60_000) return setError("Latency threshold must be between 50 and 60000 ms");
    if (form.downtimeThresholdMinutes < 1 || form.downtimeThresholdMinutes > 1440) return setError("Downtime threshold must be between 1 and 1440 minutes");
    setSubmitting(true);
    try {
      if (isEdit && monitor) {
        await mockMonitors.update(monitor.id, form);
        toast.success("Monitor updated");
      } else {
        await mockMonitors.create(form);
        toast.success("Monitor added successfully");
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit monitor" : "Add a monitor"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update how this endpoint is checked." : "Paste an endpoint URL and choose how often to check it."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Production API" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="url">URL</Label>
            <Input id="url" placeholder="https://api.example.com/health" className="font-mono text-sm" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="code">Expected status</Label>
              <Input id="code" type="number" min={100} max={599} value={form.expectedStatusCode} onChange={(e) => setForm({ ...form, expectedStatusCode: Number(e.target.value) })} className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label>Check every</Label>
              <Select value={String(form.intervalMinutes)} onValueChange={(v) => setForm({ ...form, intervalMinutes: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 minute</SelectItem>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="rounded-lg border border-border p-3">
            <div className="mb-3">
              <div className="text-sm font-medium">Alert thresholds</div>
              <p className="text-xs text-muted-foreground">Checks that exceed these limits are flagged as violations.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="latency">Max latency (ms)</Label>
                <Input
                  id="latency"
                  type="number"
                  min={50}
                  max={60000}
                  step={50}
                  className="font-mono"
                  value={form.latencyThresholdMs}
                  onChange={(e) => setForm({ ...form, latencyThresholdMs: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="downtime">Max downtime (min)</Label>
                <Input
                  id="downtime"
                  type="number"
                  min={1}
                  max={1440}
                  className="font-mono"
                  value={form.downtimeThresholdMinutes}
                  onChange={(e) => setForm({ ...form, downtimeThresholdMinutes: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label htmlFor="active" className="text-sm">Active</Label>
              <p className="text-xs text-muted-foreground">Pause to stop scheduled checks.</p>
            </div>
            <Switch id="active" checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {isEdit ? "Save changes" : "Add monitor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}