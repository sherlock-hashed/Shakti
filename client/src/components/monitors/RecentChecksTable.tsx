import { useState } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, CircleCheck, CircleX } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Check } from "@/api/mockData";

type SortKey = "checkedAt" | "status" | "responseTimeMs";
type SortDir = "asc" | "desc";

interface Props {
  checks: Check[];
  latencyThresholdMs: number;
}

export function RecentChecksTable({ checks, latencyThresholdMs }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("checkedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir(k === "checkedAt" ? "desc" : "asc");
    }
  };

  const sorted = [...checks].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "checkedAt") cmp = new Date(a.checkedAt).getTime() - new Date(b.checkedAt).getTime();
    else if (sortKey === "responseTimeMs") cmp = a.responseTimeMs - b.responseTimeMs;
    else if (sortKey === "status") cmp = Number(a.isUp) - Number(b.isUp) || a.statusCode - b.statusCode;
    return sortDir === "asc" ? cmp : -cmp;
  });

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            <TableHead>
              <SortButton label="Timestamp" active={sortKey === "checkedAt"} dir={sortDir} onClick={() => toggleSort("checkedAt")} />
            </TableHead>
            <TableHead className="text-right">
              <SortButton label="Status" active={sortKey === "status"} dir={sortDir} onClick={() => toggleSort("status")} align="right" />
            </TableHead>
            <TableHead className="text-right">
              <SortButton label="Response time" active={sortKey === "responseTimeMs"} dir={sortDir} onClick={() => toggleSort("responseTimeMs")} align="right" />
            </TableHead>
            <TableHead className="text-right">Threshold</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((c) => {
            const slow = c.isUp && c.responseTimeMs > latencyThresholdMs;
            const violates = !c.isUp || slow;
            return (
              <TableRow key={c.id} className={cn(violates && "bg-destructive/[0.04]")}>
                <TableCell>
                  {c.isUp ? (
                    <CircleCheck className={cn("h-4 w-4", slow ? "text-[color:var(--warning)]" : "text-[color:var(--success)]")} />
                  ) : (
                    <CircleX className="h-4 w-4 text-destructive" />
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                  {new Date(c.checkedAt).toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  <span className={c.isUp ? "text-foreground" : "text-destructive"}>{c.statusCode}</span>
                </TableCell>
                <TableCell className={cn("text-right font-mono text-xs", slow && "font-semibold text-[color:var(--warning)]")}>
                  {c.responseTimeMs}ms
                </TableCell>
                <TableCell className="text-right">
                  {violates ? (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
                        !c.isUp
                          ? "border-destructive/30 bg-destructive/10 text-destructive"
                          : "border-[color:var(--warning)]/30 bg-[color:var(--warning)]/10 text-[color:var(--warning)]",
                      )}
                    >
                      <AlertTriangle className="h-3 w-3" />
                      {!c.isUp ? "Down" : "Slow"}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">OK</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function SortButton({
  label,
  active,
  dir,
  onClick,
  align = "left",
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  align?: "left" | "right";
}) {
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-1 -mx-1 text-xs font-medium transition-colors hover:text-foreground",
        active ? "text-foreground" : "text-muted-foreground",
        align === "right" && "flex-row-reverse",
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}