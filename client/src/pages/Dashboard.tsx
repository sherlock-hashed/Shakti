import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BellRing,
  Download,
  FileText,
  Inbox,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
import { MonitorCard } from "@/components/monitors/MonitorCard";
import { AddEditMonitorModal } from "@/components/monitors/AddEditMonitorModal";
import { AlertReportsModal } from "@/components/monitors/AlertReportsModal";
import { useMonitors } from "@/hooks/useMonitors";
import { monitorApi, type Monitor } from "@/api/monitorApi";
import { TooltipProvider } from "@/components/ui/tooltip";
import { exportMonitorsToCSV, exportMonitorsToPDF } from "@/lib/exportMonitors";

type FilterKey = "all" | "up" | "down" | "paused";

export function Dashboard() {
  useEffect(() => {
    document.title = "Pulseboard — Real-time API health monitoring";
  }, []);

  return (
    <ProtectedRoute>
      <DashboardView />
    </ProtectedRoute>
  );
}

function DashboardView() {
  const { monitors, loading, error, refresh } = useMonitors();
  const [modalOpen, setModalOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [editing, setEditing] = useState<Monitor | null>(null);
  const [toDelete, setToDelete] = useState<Monitor | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<
    "pause" | "activate" | "delete" | null
  >(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const counts = useMemo(() => {
    const list = monitors ?? [];
    return {
      all: list.length,
      up: list.filter((m) => m.isActive && m.status === "up").length,
      down: list.filter((m) => m.isActive && m.status === "down").length,
      paused: list.filter((m) => !m.isActive).length,
    };
  }, [monitors]);

  const filtered = useMemo(() => {
    const list = monitors ?? [];
    const q = query.trim().toLowerCase();
    return list.filter((m) => {
      if (filter === "up" && !(m.isActive && m.status === "up")) return false;
      if (filter === "down" && !(m.isActive && m.status === "down"))
        return false;
      if (filter === "paused" && m.isActive) return false;
      if (
        q &&
        !m.name.toLowerCase().includes(q) &&
        !m.url.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [monitors, query, filter]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (m: Monitor) => {
    setEditing(m);
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await monitorApi.remove(toDelete.id);
      toast.success("Monitor deleted");
      setToDelete(null);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelect = (m: Monitor) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(m.id)) next.delete(m.id);
      else next.add(m.id);
      return next;
    });
  };

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((m) => selected.has(m.id));

  const toggleSelectAllFiltered = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) filtered.forEach((m) => next.delete(m.id));
      else filtered.forEach((m) => next.add(m.id));
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const runBulk = async () => {
    if (!bulkAction || selected.size === 0 || !monitors) return;
    const ids = Array.from(selected);
    setBulkBusy(true);
    try {
      if (bulkAction === "delete") {
        await Promise.all(ids.map((id) => monitorApi.remove(id)));
        toast.success(
          `Deleted ${ids.length} monitor${ids.length === 1 ? "" : "s"}`,
        );
      } else {
        const isActive = bulkAction === "activate";
        await Promise.all(ids.map((id) => monitorApi.update(id, { isActive })));
        toast.success(
          `${isActive ? "Activated" : "Paused"} ${ids.length} monitor${ids.length === 1 ? "" : "s"}`,
        );
      }
      clearSelection();
      setBulkAction(null);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bulk action failed");
    } finally {
      setBulkBusy(false);
    }
  };

  const filterLabel = filter === "all" ? "all" : filter;
  const doDashboardExport = (fmt: "csv" | "pdf") => {
    if (filtered.length === 0) {
      toast.error("No monitors to export");
      return;
    }
    try {
      if (fmt === "csv") exportMonitorsToCSV(filtered, filterLabel);
      else exportMonitorsToPDF(filtered, filterLabel);
      toast.success(
        `Exported ${filtered.length} monitor${filtered.length === 1 ? "" : "s"} to ${fmt.toUpperCase()}`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
                Monitors
              </h1>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {monitors
                  ? `${monitors.length} endpoint${monitors.length === 1 ? "" : "s"} tracked`
                  : "Loading monitors…"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAlertsOpen(true)}
                className="hidden gap-2 sm:inline-flex"
              >
                <BellRing className="h-3.5 w-3.5" /> Alert reports
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="hidden gap-2 sm:inline-flex"
                    disabled={!monitors || filtered.length === 0}
                  >
                    <Download className="h-3.5 w-3.5" /> Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => doDashboardExport("csv")}
                    className="gap-2"
                  >
                    <FileText className="h-4 w-4" /> Export CSV (
                    {filtered.length})
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => doDashboardExport("pdf")}
                    className="gap-2"
                  >
                    <FileText className="h-4 w-4" /> Export PDF (
                    {filtered.length})
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={openCreate} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden xs:inline sm:inline">Add monitor</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>

          {/* Mobile-only quick actions */}
          <div className="mt-3 flex gap-2 sm:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAlertsOpen(true)}
              className="flex-1 gap-2"
            >
              <BellRing className="h-3.5 w-3.5" /> Reports
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-2"
                  disabled={!monitors || filtered.length === 0}
                >
                  <Download className="h-3.5 w-3.5" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => doDashboardExport("csv")}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" /> Export CSV
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => doDashboardExport("pdf")}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" /> Export PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {!loading && !error && monitors && monitors.length > 0 && (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="relative w-full min-w-[220px] sm:max-w-md sm:flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or URL…"
                  className="pl-9 pr-9"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <ToggleGroup
                type="single"
                value={filter}
                onValueChange={(v) => v && setFilter(v as FilterKey)}
                className="w-full overflow-x-auto rounded-md border border-border bg-card p-0.5 sm:w-auto"
              >
                <ToggleGroupItem
                  value="all"
                  className="h-8 px-3 text-xs data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
                >
                  All{" "}
                  <span className="ml-1 text-muted-foreground">
                    {counts.all}
                  </span>
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="up"
                  className="h-8 px-3 text-xs data-[state=on]:bg-[color:var(--success)]/15 data-[state=on]:text-[color:var(--success)]"
                >
                  Up{" "}
                  <span className="ml-1 text-muted-foreground">
                    {counts.up}
                  </span>
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="down"
                  className="h-8 px-3 text-xs data-[state=on]:bg-destructive/15 data-[state=on]:text-destructive"
                >
                  Down{" "}
                  <span className="ml-1 text-muted-foreground">
                    {counts.down}
                  </span>
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="paused"
                  className="h-8 px-3 text-xs data-[state=on]:bg-muted data-[state=on]:text-foreground"
                >
                  Paused{" "}
                  <span className="ml-1 text-muted-foreground">
                    {counts.paused}
                  </span>
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          )}

          {/* Bulk selection bar */}
          {!loading && !error && monitors && monitors.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={allFilteredSelected}
                  onCheckedChange={toggleSelectAllFiltered}
                  aria-label="Select all filtered monitors"
                />
                <span className="text-muted-foreground">
                  {selected.size > 0
                    ? `${selected.size} selected`
                    : `Select all (${filtered.length})`}
                </span>
              </label>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5"
                  disabled={selected.size === 0}
                  onClick={() => setBulkAction("activate")}
                >
                  <Play className="h-3.5 w-3.5" /> Activate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5"
                  disabled={selected.size === 0}
                  onClick={() => setBulkAction("pause")}
                >
                  <Pause className="h-3.5 w-3.5" /> Pause
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-destructive hover:text-destructive"
                  disabled={selected.size === 0}
                  onClick={() => setBulkAction("delete")}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
                {selected.size > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={clearSelection}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="mt-6">
            {loading && <MonitorsSkeleton />}
            {!loading && error && (
              <Card className="flex flex-col items-center gap-3 p-10 text-center">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <div>
                  <div className="font-medium">Couldn't load monitors</div>
                  <p className="text-sm text-muted-foreground">
                    Check your connection and try again.
                  </p>
                </div>
                <Button onClick={refresh} variant="outline" className="gap-2">
                  <RefreshCw className="h-3.5 w-3.5" /> Retry
                </Button>
              </Card>
            )}
            {!loading && !error && monitors && monitors.length === 0 && (
              <Card className="flex flex-col items-center gap-3 p-10 text-center md:p-14">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
                  <Inbox className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-base font-semibold">No monitors yet</div>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Add your first endpoint and Pulseboard will start checking
                    it in the background.
                  </p>
                </div>
                <Button onClick={openCreate} className="mt-2 gap-2">
                  <Plus className="h-4 w-4" /> Add your first monitor
                </Button>
              </Card>
            )}
            {!loading &&
              !error &&
              monitors &&
              monitors.length > 0 &&
              (filtered.length === 0 ? (
                <Card className="flex flex-col items-center gap-2 p-10 text-center">
                  <Search className="h-6 w-6 text-muted-foreground" />
                  <div className="text-sm font-medium">
                    No monitors match your filters
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Try clearing the search or switching to All.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      setQuery("");
                      setFilter("all");
                    }}
                  >
                    Reset filters
                  </Button>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((m) => (
                    <MonitorCard
                      key={m.id}
                      monitor={m}
                      onEdit={openEdit}
                      onDelete={setToDelete}
                      selected={selected.has(m.id)}
                      onToggleSelect={toggleSelect}
                    />
                  ))}
                </div>
              ))}
          </div>
        </main>

        <AddEditMonitorModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          monitor={editing}
          onSuccess={refresh}
        />

        <AlertReportsModal open={alertsOpen} onOpenChange={setAlertsOpen} />

        <AlertDialog
          open={!!toDelete}
          onOpenChange={(o) => !o && setToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete monitor?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove{" "}
                <span className="font-medium text-foreground">
                  {toDelete?.name}
                </span>{" "}
                and its check history. This action can't be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? "Deleting…" : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={!!bulkAction}
          onOpenChange={(o) => !o && setBulkAction(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {bulkAction === "delete"
                  ? `Delete ${selected.size} monitor${selected.size === 1 ? "" : "s"}?`
                  : bulkAction === "pause"
                    ? `Pause ${selected.size} monitor${selected.size === 1 ? "" : "s"}?`
                    : `Activate ${selected.size} monitor${selected.size === 1 ? "" : "s"}?`}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {bulkAction === "delete"
                  ? "Selected monitors and their check history will be removed. This action can't be undone."
                  : bulkAction === "pause"
                    ? "Selected monitors will stop being checked until you activate them again."
                    : "Selected monitors will resume checking on their configured intervals."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={bulkBusy}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={runBulk}
                disabled={bulkBusy}
                className={
                  bulkAction === "delete"
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : ""
                }
              >
                {bulkBusy ? "Working…" : "Confirm"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
}

function MonitorsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="space-y-4 p-5">
          <div className="flex items-start justify-between">
            <div className="w-2/3 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-full" />
            </div>
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <Skeleton className="h-px w-full" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-6 w-14" />
          </div>
        </Card>
      ))}
    </div>
  );
}
