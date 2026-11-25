import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  // yellow stays a background colour, the text on it is always navy
  primary:
    "bg-brand text-[#0f1d33] hover:bg-brand-dark shadow-[var(--shadow-brand)] hover:shadow-[0_12px_26px_-8px_rgba(254,221,0,0.6)] hover:-translate-y-px",
  secondary:
    "bg-surface text-foreground border border-border hover:border-border-strong hover:bg-black/[0.02] dark:hover:bg-white/[0.04] shadow-[var(--shadow-xs)]",
  ghost: "bg-transparent text-foreground hover:bg-black/[0.05] dark:hover:bg-white/[0.08]",
  danger: "bg-red-soft text-red hover:bg-red/15 border border-red/15",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm rounded-xl",
  md: "h-11 px-5 text-sm rounded-xl",
  lg: "h-14 px-7 text-base rounded-2xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 font-bold tracking-tight transition-all duration-200 ease-[var(--ease-out-quart)] active:scale-[0.97] active:translate-y-0 active:duration-100 disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
