/**
 * Brutalist Button — border-2 + hard drop shadow, 48px touch targets.
 */
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-tech font-medium uppercase tracking-wide transition-transform duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric disabled:opacity-50 disabled:pointer-events-none select-none",
  {
    variants: {
      variant: {
        primary: "bg-crimson text-white border-2 border-black shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none dark:border-white",
        secondary: "bg-electric text-white border-2 border-black shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none dark:border-white",
        outline: "bg-transparent text-ink border-2 border-black shadow-brutal-sm hover:bg-ink/5 dark:border-white",
        ghost: "bg-transparent text-ink border-2 border-transparent hover:border-black dark:hover:border-white",
        mastery: "bg-mastery text-black border-2 border-black shadow-brutal-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none dark:border-white",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Shows a spinner and disables interaction. */
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, loading = false, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled ?? loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
});
