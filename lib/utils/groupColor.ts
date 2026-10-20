// Gives every group its own stable colour (derived from its name) so avatars
// and badges are easy to tell apart. Works in light and dark mode.
export interface GroupTone {
  bg: string;
  fg: string;
  dot: string;
}

export function groupColor(name: string | null): GroupTone {
  if (!name) {
    return { bg: "var(--red-soft)", fg: "var(--red)", dot: "var(--red)" };
  }
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 360;
  return {
    bg: `hsl(${hash} 70% 50% / 0.16)`,
    fg: `color-mix(in oklab, hsl(${hash} 65% 45%) 55%, var(--foreground))`,
    dot: `hsl(${hash} 65% 50%)`,
  };
}

// Colour for a mastery percentage: red (needs attention) → amber → green.
export function masteryColor(percent: number): string {
  if (percent < 20) return "var(--red)";
  if (percent < 60) return "var(--amber)";
  return "var(--green)";
}
