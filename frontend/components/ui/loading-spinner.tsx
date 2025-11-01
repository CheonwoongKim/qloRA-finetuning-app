import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export function LoadingSpinner({ size = "md", text, className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-4",
    lg: "w-12 h-12 border-4",
  };

  const textSizeClasses = {
    sm: "text-[10px]",
    md: "text-[12px]",
    lg: "text-sm",
  };

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div
        className={cn(
          "border-neutral-300 border-t-neutral-600 rounded-full animate-spin",
          sizeClasses[size]
        )}
      />
      {text && (
        <div className={cn("text-neutral-500 font-normal", textSizeClasses[size])}>
          {text}
        </div>
      )}
    </div>
  );
}
