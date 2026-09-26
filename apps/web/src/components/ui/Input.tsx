/**
 * Brutalist Input with accessible label + error wiring (aria-describedby).
 */
import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, error, id, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="font-tech text-xs font-medium uppercase tracking-wider">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? true : undefined}
        className={cn(
          "h-11 rounded-sm border-2 border-black bg-white px-3 text-sm dark:border-white dark:bg-neutral-900",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric",
          error && "border-crimson",
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-crimson">
          {error}
        </p>
      ) : null}
    </div>
  );
});
