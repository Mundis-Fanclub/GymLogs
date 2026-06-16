import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

type IconType = ComponentType<{ className?: string }>;

export function AppPage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-5xl space-y-5", className)}>
      {children}
    </div>
  );
}

export function AppSection({
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  icon?: IconType;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      {(title || description || action) && (
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h2 className="flex items-center gap-2 text-lg font-bold leading-tight text-foreground">
                {Icon && <Icon className="h-5 w-5 shrink-0 text-primary" />}
                <span className="truncate">{title}</span>
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function AppPanel({
  children,
  className,
  interactive,
  ...props
}: React.ComponentProps<"section"> & { interactive?: boolean }) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border/80 bg-card/75 text-card-foreground shadow-xl shadow-background/20 backdrop-blur-xl",
        "supports-[backdrop-filter]:bg-card/65",
        interactive &&
          "transition-[border-color,background-color,transform] duration-200 hover:border-primary/45 hover:bg-card/85 active:scale-[0.995]",
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export function AppMetricCard({
  label,
  value,
  sub,
  icon: Icon,
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: IconType;
  className?: string;
}) {
  return (
    <AppPanel className={cn("min-h-24 p-4", className)}>
      <div className="flex items-center gap-2 text-muted-foreground">
        {Icon && <Icon className="h-4 w-4 text-primary" />}
        <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
      </div>
      <div className="mt-3 text-2xl font-bold leading-none tabular-nums text-foreground">
        {value}
      </div>
      {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
    </AppPanel>
  );
}

export function AppEmptyPanel({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: IconType;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <AppPanel
      className={cn(
        "flex flex-col items-center justify-center px-4 py-10 text-center",
        className
      )}
    >
      {Icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </AppPanel>
  );
}
