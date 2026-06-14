import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full min-w-0 max-w-full rounded-xl border border-input bg-input/35 px-3 py-2.5 text-base shadow-[inset_0_1px_0_oklch(1_0_0/0.04)] transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:bg-input/55 focus-visible:ring-3 focus-visible:ring-ring/35 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/35 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
