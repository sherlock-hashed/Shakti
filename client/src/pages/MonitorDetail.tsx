import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Pencil,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { StatusBadge } from "@/components/monitors/StatusBadge";
import { ResponseTimeChart } from "@/components/monitors/ResponseTimeChart";
import { RecentChecksTable } from "@/components/monitors/RecentChecksTable";
import { AddEditMonitorModal } from "@/components/monitors/AddEditMonitorModal";
import {
  monitorApi,
  type MonitorDetail as MonitorDetailType,
} from "@/api/monitorApi";
import { formatRelativeTime } from "@/lib/format";
import { exportChecksToCSV, exportChecksToPDF } from "@/lib/exportChecks";

export function MonitorDetail() {
  return (
    <ProtectedRoute>
      <MonitorDetailView />
    </ProtectedRoute>
  );
}

function MonitorDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<MonitorDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    document.title = "Pulseboard — Real-time API health monitoring";
  }, []);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const d = await monitorApi.get(id);
      setData(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load monitor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const doDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await monitorApi.remove(id);
      toast.success("Monitor deleted");
      navigate("/dashboard");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const avgResponseTime =
    data && data.checks.length > 0
      ? Math.round(
          data.checks.reduce((s, c) => s + c.responseTimeMs, 0) /
            data.checks.length,
        )
      : null;

  const violations = data
    ? data.checks.filter(
        (c) => !c.isUp || c.responseTimeMs > data.latencyThresholdMs,
      ).length
    : 0;

  const doExport = (fmt: "csv" | "pdf") => {
    if (!data) return;
    try {
      if (fmt === "csv") exportChecksToCSV(data);
      else exportChecksToPDF(data);
      toast.success(`Exported ${fmt.toUpperCase()} report`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <Link
          to="/dashboard"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to monitors
        </Link>

        {loading && <DetailSkeleton />}

        {!loading && error && (
          <Card className="flex flex-col items-center gap-3 p-10 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div className="font-medium">Couldn't load this monitor</div>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={load} variant="outline" className="gap-2">
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </Button>
          </Card>
        )}

        {!loading && !error && data && (
          <>
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:flex-wrap">
              <div className="min-w-0 max-w-full">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <h1 className="min-w-0 break-words text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
                    {data.name}
                  </h1>
                  <StatusBadge status={data.status} />
                </div>
                <a
                  href={data.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1.5 inline-flex max-w-full items-center gap-1.5 break-all font-mono text-xs text-muted-foreground hover:text-foreground sm:text-sm"
                >
                  {data.url}
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                </a>
              </div>
              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      disabled={data.checks.length === 0}
                    >
                      <Download className="h-3.5 w-3.5" /> Export
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => doExport("csv")}
                      className="gap-2"
                    >
                      <FileText className="h-4 w-4" /> Export CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => doExport("pdf")}
                      className="gap-2"
                    >
                      <FileText className="h-4 w-4" /> Export PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditOpen(true)}
                  className="gap-2"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDelete(true)}
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard
                label="Uptime (24h)"
                value={
                  data.uptimePercent24h != null
                    ? `${data.uptimePercent24h.toFixed(2)}%`
                    : "—"
                }
              />
              <StatCard
                label="Avg response"
                value={avgResponseTime != null ? `${avgResponseTime}ms` : "—"}
              />
              <StatCard
                label="Threshold violations"
                value={String(violations)}
                tone={violations > 0 ? "warning" : "default"}
              />
              <StatCard
                label="Last checked"
                value={
                  data.lastCheckedAt
                    ? formatRelativeTime(data.lastCheckedAt)
                    : "—"
                }
              />
            </div>

            <Card className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 p-4 text-xs">
              <div>
                <span className="text-muted-foreground">
                  Latency threshold:{" "}
                </span>
                <span className="font-mono font-semibold">
                  {data.latencyThresholdMs}ms
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">
                  Downtime threshold:{" "}
                </span>
                <span className="font-mono font-semibold">
                  {data.downtimeThresholdMinutes} min
                </span>
              </div>
              <div className="text-muted-foreground">
                Checks above the latency threshold or with a down status are
                highlighted as violations.
              </div>
            </Card>

            <Card className="mt-6 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Response time</div>
                  <div className="text-xs text-muted-foreground">
                    Recent checks · red dots indicate downtime
                  </div>
                </div>
              </div>
              {data.checks.length === 0 ? (
                <EmptyChecks />
              ) : (
                <ResponseTimeChart checks={data.checks} />
              )}
            </Card>

            <Card className="mt-6 overflow-hidden p-0">
              <div className="flex items-center justify-between p-5">
                <div>
                  <div className="text-sm font-semibold">Recent checks</div>
                  <div className="text-xs text-muted-foreground">
                    Latest activity from the checker
                  </div>
                </div>
              </div>
              <Separator />
              {data.checks.length === 0 ? (
                <div className="p-6">
                  <EmptyChecks />
                </div>
              ) : (
                <>
                  <RecentChecksTable
                    checks={[...data.checks].reverse().slice(0, visibleCount)}
                    latencyThresholdMs={data.latencyThresholdMs}
                  />
                  {visibleCount < data.checks.length && (
                    <div className="flex justify-center border-t border-border p-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setVisibleCount((c) => c + 20)}
                      >
                        Load more
                      </Button>
                    </div>
                  )}
                </>
              )}
            </Card>
          </>
        )}
      </main>

      <AddEditMonitorModal
        open={editOpen}
        onOpenChange={setEditOpen}
        monitor={data}
        onSuccess={load}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete monitor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove{" "}
              <span className="font-medium text-foreground">{data?.name}</span>{" "}
              and its check history. This action can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={doDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warning";
}) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={
          "mt-1 font-mono text-xl font-semibold tracking-tight " +
          (tone === "warning" ? "text-[color:var(--warning)]" : "")
        }
      >
        {value}
      </div>
    </Card>
  );
}

function EmptyChecks() {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-full bg-muted text-muted-foreground">
        <Clock className="h-5 w-5" />
      </div>
      <div className="text-sm font-medium">No checks yet</div>
      <p className="max-w-sm text-xs text-muted-foreground">
        The first check will run within a few minutes. Data will appear here
        automatically.
      </p>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2 h-6 w-16" />
          </Card>
        ))}
      </div>
      <Card className="p-5">
        <Skeleton className="mb-4 h-4 w-32" />
        <Skeleton className="h-64 w-full" />
      </Card>
      <Card className="space-y-3 p-5">
        <Skeleton className="h-4 w-40" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </Card>
    </div>
  );
}
