import type { Status } from "@/src/types";

// AI: Maps each status to its display label and color classes.
// Placeholder colors until Phase 4 branding — slate/amber/green is a
// conventional neutral choice. Swap the classes when the theme is set.
const STATUS_CONFIG: Record<Status, { label: string; classes: string }> = {
  "to-try": {
    label: "To Try",
    classes: "bg-sand text-slate-700",
  },
  wip: {
    label: "WIP",
    classes: "bg-amber-100 text-amber-800",
  },
  completed: {
    label: "Completed",
    classes: "bg-emerald-100 text-emerald-800",
  },
};

interface StatusBadgeProps {
  status: Status;
}

// renders a small pill from STATUS_CONFIG
export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${config.classes}`}
    >
      {config.label}
    </span>
  );
}

export default StatusBadge;
