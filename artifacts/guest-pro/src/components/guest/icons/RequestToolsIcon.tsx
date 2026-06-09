import { Hammer } from "lucide-react";
import { cn } from "@/lib/utils";

interface RequestToolsIconProps {
  className?: string;
  strokeWidth?: number;
}

/** @deprecated Use Hammer directly — kept for HMR/cache compatibility. */
export function RequestToolsIcon({ className, strokeWidth = 1.75 }: RequestToolsIconProps) {
  return <Hammer className={cn("h-5 w-5 shrink-0", className)} strokeWidth={strokeWidth} />;
}
