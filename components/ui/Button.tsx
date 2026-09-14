import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand text-foreground hover:bg-brand-dark shadow-[var(--shadow-brand)] hover:shadow-[0_10px_24px_-6px_rgba(255,199,0,0.45)]",
  secondary:
    "bg-surface text-foreground border border-border hover:border-border-strong hover:bg-black/[0.02] shadow-[var(--shadow-xs)]",
  ghost: "bg-transparent text-foreground hover:bg-black/[0.04]",
  danger: "bg-red-soft text-red hover:bg-red/15",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm rounded-xl",
  md: "h-11 px-5 text-sm rounded-2xl",
  lg: "h-14 px-7 text-base rounded-2xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 ease-[var(--ease-out-quart)] active:scale-[0.97] active:duration-100 disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-background ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
