import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";
import logoSrc from "@/assets/logo.jpg";

type Variant = "full" | "mark" | "text";
type Size = "sm" | "md" | "lg" | "xl";

interface BrandMarkProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  /** Optional translation override; defaults to Arabic short name. */
  productLabel?: string;
}

const sizeMap: Record<Size, { logo: string; title: string; sub: string; gap: string }> = {
  sm: { logo: "h-8 w-8", title: "text-base", sub: "text-[10px]", gap: "gap-2" },
  md: { logo: "h-10 w-10", title: "text-lg", sub: "text-xs", gap: "gap-2.5" },
  lg: { logo: "h-12 w-12", title: "text-xl", sub: "text-xs", gap: "gap-3" },
  xl: { logo: "h-20 w-20", title: "text-3xl", sub: "text-sm", gap: "gap-4" },
};

/**
 * Unified brand presentation — replaces every direct <img src="logo"> usage.
 * Variants:
 *  - `full` : logo + name + product label  (default)
 *  - `mark` : logo only (favicon-style)
 *  - `text` : name only, no logo
 */
export function BrandMark({
  variant = "full",
  size = "md",
  className,
  productLabel,
}: BrandMarkProps) {
  const s = sizeMap[size];

  const Logo = (
    <div
      className={cn(
        "flex-shrink-0 rounded-full ring-1 ring-primary/15 bg-card overflow-hidden",
        s.logo,
      )}
    >
      <img
        src={logoSrc}
        alt={`${BRAND.fullNameAr} — شعار`}
        className="h-full w-full object-cover"
        loading="eager"
        decoding="async"
      />
    </div>
  );

  if (variant === "mark") {
    return <div className={className} data-testid="brand-mark">{Logo}</div>;
  }

  return (
    <div
      className={cn("flex items-center", s.gap, className)}
      data-testid="brand-full"
    >
      {variant === "full" && Logo}
      <div className="flex flex-col leading-tight min-w-0">
        <span className={cn("font-bold tracking-tight text-foreground truncate", s.title)}>
          {BRAND.shortName}
        </span>
        <span
          className={cn(
            "uppercase tracking-[0.2em] text-muted-foreground font-medium truncate",
            s.sub,
          )}
        >
          {productLabel ?? "Members"}
        </span>
      </div>
    </div>
  );
}

export default BrandMark;
