import { cn } from "@/lib/utils";

interface GuestSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rounded?: string;
}

export function GuestSkeleton({ className, rounded = "rounded-xl", ...props }: GuestSkeletonProps) {
  return (
    <div
      className={cn("guest-skeleton-shimmer", rounded, className)}
      aria-hidden
      {...props}
    />
  );
}
