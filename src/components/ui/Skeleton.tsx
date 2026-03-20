// src/components/ui/Skeleton.tsx
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div className={cn("shimmer rounded-xl", className)} style={style} />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-square rounded-2xl" />
      <Skeleton className="h-3 w-1/3 rounded-lg" />
      <Skeleton className="h-4 w-4/5 rounded-lg" />
      <Skeleton className="h-4 w-2/5 rounded-lg" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-white/[0.04]">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-4">
          <Skeleton
            className="h-4 rounded-lg"
            style={{ width: `${60 + Math.random() * 40}%` }}
          />
        </td>
      ))}
    </tr>
  );
}