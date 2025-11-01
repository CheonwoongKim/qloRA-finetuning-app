import { cn } from "@/lib/utils";
import type { JobStatus } from "@/types/common";

interface StatusBadgeProps {
  status: JobStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles: Record<JobStatus, string> = {
    running: "bg-neutral-100 text-black",
    completed: "bg-green-50 text-green-700",
    failed: "bg-red-50 text-red-700",
    pending: "bg-neutral-100 text-neutral-600",
    paused: "bg-yellow-50 text-yellow-700",
    stopped: "bg-neutral-100 text-neutral-500",
  };

  const labels: Record<JobStatus, string> = {
    running: "Running",
    completed: "Completed",
    failed: "Failed",
    pending: "Pending",
    paused: "Paused",
    stopped: "Stopped",
  };

  return (
    <span
      className={cn(
        "px-2 py-0.5 text-[10px] font-semibold rounded-sm",
        styles[status],
        className
      )}
    >
      {labels[status]}
    </span>
  );
}
