import { Link } from "react-router-dom";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StatusBadge } from "./StatusBadge";
import type { Monitor } from "@/api/monitorApi";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  monitor: Monitor;
  onEdit: (m: Monitor) => void;
  onDelete: (m: Monitor) => void;
  selected?: boolean;
  onToggleSelect?: (m: Monitor) => void;
}

export function MonitorCard({
  monitor,
  onEdit,
  onDelete,
  selected = false,
  onToggleSelect,
}: Props) {
  return (
    <Card
      className={cn(
        "group relative flex flex-col gap-4 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--shadow-soft)]",
        selected && "border-primary/50 ring-2 ring-primary/20",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          {onToggleSelect && (
            <Checkbox
              checked={selected}
              onCheckedChange={() => onToggleSelect(monitor)}
              aria-label={`Select ${monitor.name}`}
              className="mt-1"
            />
          )}
          <div className="min-w-0 flex-1">
            <Link
              to={`/monitors/${monitor.id}`}
              className="line-clamp-1 text-base font-semibold hover:text-primary"
            >
              {monitor.name}
            </Link>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="truncate font-mono">{monitor.url}</span>
                  <a
                    href={monitor.url}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 rounded p-0.5 opacity-60 hover:opacity-100 hover:text-foreground"
                    aria-label="Open URL"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </TooltipTrigger>
              <TooltipContent className="font-mono text-xs">
                {monitor.url}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        <StatusBadge status={monitor.status} />
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-border/60 pt-4 text-xs">
        <div>
          <div className="text-muted-foreground">Uptime (24h)</div>
          <div className="mt-0.5 font-mono text-sm text-foreground">
            {monitor.uptimePercent24h != null
              ? `${monitor.uptimePercent24h.toFixed(2)}%`
              : "—"}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground">Last checked</div>
          <div className="mt-0.5 font-mono text-sm text-foreground">
            {monitor.lastCheckedAt
              ? formatRelativeTime(monitor.lastCheckedAt)
              : "—"}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-4">
        <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono">
            every {monitor.intervalMinutes}m
          </span>
          {!monitor.isActive && (
            <span className="rounded-md bg-[color:var(--warning)]/15 px-1.5 py-0.5 font-medium text-[color:var(--warning)]">
              Paused
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(monitor)}
            aria-label="Edit monitor"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(monitor)}
            aria-label="Delete monitor"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
