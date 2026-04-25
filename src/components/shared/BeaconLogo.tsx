import { cn } from "@/lib/utils";

interface BeaconLogoProps {
  className?: string;
  /** When set, the logo is exposed as an `img` with this label. Default is decorative (`aria-hidden`). */
  ariaLabel?: string;
  /** Optional unique id for the radial gradient when more than one logo coexists in the DOM. */
  gradientId?: string;
}

/**
 * Brand mark used in the navbar, landing page, and loading screen.
 * Concentric rings + center dot, all driven by theme tokens so it adapts to light/dark.
 */
export function BeaconLogo({
  className,
  ariaLabel,
  gradientId = "beaconGradient",
}: BeaconLogoProps) {
  const labelled = !!ariaLabel;
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("w-9 h-9", className)}
      xmlns="http://www.w3.org/2000/svg"
      role={labelled ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={labelled ? undefined : true}
      focusable="false"
    >
      <defs>
        <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
          <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0.8" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="none" stroke="hsl(var(--secondary))" strokeWidth="2" opacity="0.3" />
      <circle cx="32" cy="32" r="20" fill="none" stroke="hsl(var(--secondary))" strokeWidth="2" opacity="0.6" />
      <circle cx="32" cy="32" r="12" fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" opacity="0.9" />
      <circle cx="32" cy="32" r="4" fill={`url(#${gradientId})`} />
      <circle cx="32" cy="32" r="2.5" fill="hsl(var(--primary))" opacity="0.6" />
    </svg>
  );
}
