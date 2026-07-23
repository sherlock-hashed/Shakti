import { CircleCheck, CircleDashed, CircleX } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "up" | "down" | "pending";

const map: Record<Status, { label: string; className: string; Icon: typeof CircleCheck }> = {
  up: {
    label: "Up",
    className: "bg-[color:var(--success)]/10 text-[color:var(--success)] border-[color:var(--success)]/25",
    Icon: CircleCheck,
  },
  down: {
    label: "Down",
    className: "bg-destructive/10 text-destructive border-destructive/25",
    Icon: CircleX,
  },
  pending: {
    label: "Pending",
    className: "bg-muted text-muted-foreground border-border",
    Icon: CircleDashed,
  },
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const { label, className: cls, Icon } = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        cls,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}