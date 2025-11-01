import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold transition-elegant focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-card hover:scale-105 active:scale-95",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/90 shadow-elegant hover:shadow-floating",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-elegant",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-elegant hover:shadow-floating",
        outline: "text-foreground border-2 hover:bg-accent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
