import type { ReactNode } from "react";

interface EmptyStateProps {
  // main line
  title: string;
  // secondary line
  subtitle?: string;
  // optional slot
  children?: ReactNode;
}

// no patterns saved or no matching current filters
export function EmptyState({ title, subtitle, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{title}</p>
      {subtitle && (
        <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">{subtitle}</p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export default EmptyState;
