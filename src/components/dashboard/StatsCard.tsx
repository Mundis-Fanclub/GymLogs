import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  className?: string;
  action?: ReactNode;
}

export function StatsCard({
  title,
  value,
  subtitle,
  className,
  action,
}: StatsCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            {title}
          </p>
          {action && <span className="shrink-0">{action}</span>}
        </div>
        <p className="text-2xl font-bold">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
