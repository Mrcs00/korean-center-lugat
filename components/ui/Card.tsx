import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevation?: "sm" | "md" | "lg";
  interactive?: boolean;
}

const shadowByElevation = {
  sm: "shadow-[var(--shadow-sm)]",
  md: "shadow-[var(--shadow-md)]",
  lg: "shadow-[var(--shadow-lg)]",
};

export function Card({
  className = "",
  elevation = "sm",
  interactive = false,
  ...props
}: CardProps) {
  return (
    <div
      className={`bg-surface border border-border rounded-3xl transition-all duration-300 ease-[var(--ease-out-quart)] ${shadowByElevation[elevation]} ${
        interactive
          ? "hover:border-border-strong hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 cursor-pointer"
          : ""
      } ${className}`}
      {...props}
    />
  );
}
