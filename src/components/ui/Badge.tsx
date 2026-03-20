// src/components/ui/Badge.tsx
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "purple" | "gray";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: "badge-purple",
  success: "badge-green",
  warning: "badge-amber",
  danger: "badge-red",
  info: "badge-blue",
  purple: "badge-purple",
  gray: "badge-gray",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
