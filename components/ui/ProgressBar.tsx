export function ProgressBar({
  value,
  max = 100,
  className = "",
  trackClassName = "",
  barClassName = "",
}: {
  value: number;
  max?: number;
  className?: string;
  trackClassName?: string;
  barClassName?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={`w-full ${className}`}>
      <div
        className={`h-2 w-full rounded-full bg-black/[0.055] overflow-hidden ${trackClassName}`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={`h-full rounded-full bg-gradient-to-r from-brand-dark to-brand transition-[width] duration-700 ease-[var(--ease-out-quart)] ${barClassName}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
