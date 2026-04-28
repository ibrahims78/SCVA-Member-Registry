/**
 * SCVA Design Tokens — TypeScript bridge.
 *
 * Use these constants when CSS variables can't be referenced directly
 * (e.g. inside Recharts colour props, or canvas drawings).
 * Keep this file in sync with client/src/index.css.
 *
 * See docs/DESIGN_SYSTEM.md for the full specification.
 */

export const tokens = {
  font: {
    sans: "'Cairo', 'Inter', sans-serif",
    mono: "'JetBrains Mono', ui-monospace, monospace",
  },
  text: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
  },
  radius: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  /** Resolves a CSS variable as an `hsl(var(--token))` string usable in inline styles or Recharts. */
  cssVar: (name: string): string => `hsl(var(--${name}))`,
  /** Brand chart palette — derived from primary, success, warning, info, accent. */
  chart: [
    "hsl(var(--primary))",
    "hsl(var(--success))",
    "hsl(var(--warning))",
    "hsl(var(--info))",
    "hsl(var(--accent-foreground))",
    "hsl(var(--destructive))",
  ],
} as const;

export type DesignTokens = typeof tokens;
