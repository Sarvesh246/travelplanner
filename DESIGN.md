---
version: alpha
name: Beacon
description: Collaborative trip-planning product with a dark-first outdoors palette, glassy layered surfaces, and compact utility-driven navigation.
colors:
  primary: "#59A68A"
  primary-deep: "#2E5C4F"
  secondary: "#A1BFA6"
  secondary-deep: "#3A4A3E"
  success: "#5CA38B"
  warning: "#CE9B3B"
  error: "#D43535"
  neutral-0: "#FFFFFF"
  neutral-50: "#F7F9F6"
  neutral-100: "#F5F6F3"
  neutral-200: "#E9EFE6"
  neutral-300: "#E7EBE5"
  neutral-400: "#DFE3DE"
  neutral-500: "#E5E8E3"
  neutral-600: "#DADFD8"
  neutral-700: "#9EA9A0"
  neutral-800: "#6B7280"
  neutral-900: "#555D6D"
  ink-900: "#1F2933"
  ink-950: "#131613"
  night-surface: "#1F2320"
  night-surface-muted: "#2B312C"
  night-border: "#343D35"
  night-sidebar: "#0E110E"
  night-sidebar-accent: "#212722"
  night-foreground: "#EBEDE8"
  day-background: "#F5F6F3"
  day-surface: "#FFFFFF"
  day-muted: "#E7EBE5"
  day-sidebar: "#E9EFE6"
  day-foreground: "#1F2933"
  day-border: "#E5E8E3"
  glow-mint: "#89BDAA"
  glow-forest: "#59A68A"
  glow-cream: "#EBEDE8"
typography:
  display-xl:
    fontFamily: Inter
    fontSize: 72px
    fontWeight: 600
    lineHeight: 1.04
    letterSpacing: -0.02em
  display-lg:
    fontFamily: Inter
    fontSize: 60px
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.02em
  title-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.3
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.55
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.45
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.2
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.2
  label-caps:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0.1em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.35
rounded:
  sm: 8px
  md: 12px
  lg: 14px
  xl: 16px
  "2xl": 24px
  full: 9999px
spacing:
  "2xs": 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  "2xl": 40px
  "3xl": 56px
  "4xl": 80px
  page-padding-mobile: 16px
  page-padding-desktop: 24px
  card-padding: 16px
  panel-padding: 24px
  section-padding-y: 80px
  hero-action-gap: 12px
  app-header-height: 56px
  touch-target: 40px
  touch-target-large: 48px
  content-max: 1152px
components:
  surface-app:
    backgroundColor: "{colors.night-surface}"
    borderColor: "#343D35C7"
    rounded: "{rounded.xl}"
    padding: "{spacing.card-padding}"
    shadow: "0 14px 34px -30px #59A68A94, inset 0 1px 0 #EBEDE80A"
  surface-glass:
    backgroundColor: "#1F2320BD"
    borderColor: "#343D35D1"
    rounded: "{rounded.xl}"
    padding: "{spacing.card-padding}"
    backdropFilter: "blur(16px) saturate(130%)"
    shadow: "0 20px 54px -38px #59A68AA6, inset 0 1px 0 #EBEDE80D"
  surface-auth:
    backgroundColor: "{colors.day-surface}"
    borderColor: "{colors.day-border}"
    rounded: "{rounded.xl}"
    padding: "{spacing.panel-padding}"
    shadow: "0 1px 2px #1F29330A"
  top-nav:
    backgroundColor: "#131613D1"
    borderColor: "#343D35B3"
    height: "{spacing.app-header-height}"
    backdropFilter: "blur(20px)"
    shadow: "0 10px 34px -30px #59A68AA6"
  mobile-nav:
    backgroundColor: "#131613E6"
    borderColor: "#343D35BF"
    height: "64px"
    backdropFilter: "blur(20px)"
    shadow: "0 -14px 36px -30px #59A68AB3"
  sidebar:
    backgroundColor: "#0E110EE0"
    borderColor: "#262C27CC"
    width: "224px"
    backdropFilter: "blur(20px)"
    shadow: "16px 0 36px -34px #59A68ACC"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.ink-950}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    height: "{spacing.touch-target-large}"
    padding: "12px 24px"
    shadow: "0 14px 28px -10px #59A68A80, 0 4px 10px -2px #59A68A40"
  button-primary-hover:
    backgroundColor: "#66B69A"
    transform: "translateY(-2px)"
  button-secondary:
    backgroundColor: "#1F232080"
    textColor: "{colors.night-foreground}"
    borderColor: "#343D35"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    height: "{spacing.touch-target-large}"
    padding: "12px 24px"
    backdropFilter: "blur(10px)"
  button-icon:
    backgroundColor: "transparent"
    textColor: "{colors.neutral-700}"
    rounded: "{rounded.sm}"
    size: "{spacing.touch-target}"
  input-field:
    backgroundColor: "{colors.ink-950}"
    textColor: "{colors.night-foreground}"
    borderColor: "{colors.night-border}"
    rounded: "{rounded.sm}"
    height: "{spacing.touch-target-large}"
    padding: "10px 12px"
  input-field-light:
    backgroundColor: "{colors.day-background}"
    textColor: "{colors.day-foreground}"
    borderColor: "{colors.neutral-400}"
    rounded: "{rounded.sm}"
    height: "{spacing.touch-target-large}"
    padding: "10px 12px"
  trip-card:
    backgroundColor: "{colors.night-surface}"
    borderColor: "#343D35C7"
    rounded: "{rounded.xl}"
    padding: "{spacing.card-padding}"
    shadow: "0 18px 34px -30px #59A68AB8, inset 0 1px 0 #EBEDE80D"
  section-kicker:
    backgroundColor: "#1F2320B3"
    textColor: "{colors.primary}"
    borderColor: "#59A68A40"
    typography: "{typography.label-caps}"
    rounded: "{rounded.full}"
    padding: "6px 14px"
    backdropFilter: "blur(6px)"
  status-pill:
    backgroundColor: "#59A68A1A"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    padding: "6px 10px"
  gradient-text:
    textColor: "{colors.primary}"
    shadow: "0 0 22px #59A68AA6, 0 0 8px #59A68A66"
  motion-standard:
    duration: "240ms"
    easing: "cubic-bezier(0.16, 1, 0.3, 1)"
  motion-fast:
    duration: "180ms"
    easing: "ease"
  motion-entrance:
    duration: "850ms"
    easing: "cubic-bezier(0.16, 1, 0.3, 1)"
    transform: "translateY(18px)"
  motion-ambient:
    duration: "14000ms"
    easing: "ease-in-out"
  shadow-soft:
    value: "0 8px 32px -8px #59A68A40"
  shadow-glow:
    value: "0 34px 90px -36px #59A68AB3"
---

## Overview

Beacon is an outdoors-inspired planning product that treats trip coordination as a guided route rather than a spreadsheet. The visual identity is dark-first and atmospheric on public pages, then calmer and more utilitarian inside the authenticated workspace. It should feel like a night trail map lit by a beacon: low-glare backgrounds, mint-green wayfinding accents, pale text, and restrained layers of glow.

The design is not rustic, nostalgic, or heavily illustrated. It is modern product UI with natural cues: forest greens instead of electric brand colors, layered terrain silhouettes instead of generic gradients, and circular waypoint motifs instead of decorative blobs.

## Colors

The palette is built from neutral terrain tones with green used as the navigation and action signal.

- **Primary (`#59A68A` / `#2E5C4F`):** Beacon green. In dark mode it is a lit mint-sage for CTAs, progress trails, glows, and active states. In light mode it deepens into a forest tone so actions still feel grounded.
- **Secondary (`#A1BFA6` / `#3A4A3E`):** Moss and sage support colors for secondary emphasis, layered gradients, and tonal depth.
- **Neutrals:** Light mode uses warm paper-map surfaces (`#F5F6F3`, `#FFFFFF`, `#E9EFE6`). Dark mode uses charcoal-olive surfaces (`#131613`, `#1F2320`, `#2B312C`) rather than pure black.
- **Foreground:** Text stays high-contrast but softened. Use `#EBEDE8` on dark surfaces and `#1F2933` on light ones.
- **Utility colors:** Success stays in the same green family, warning is muted amber, and error is warm red. None of them should feel neon.

Green is the only color that should visibly glow. Most other accents should rely on opacity, tone shifts, or surface layering rather than saturation.

## Typography

Typography is direct and product-oriented. Inter carries nearly everything: hero headlines, page titles, labels, metadata, and body copy. The voice should feel clean, contemporary, and legible rather than editorial.

- **Displays and headlines:** Heavy enough to feel decisive, with tight tracking and short line heights. Hero copy is large and centered, often paired with a single glowing highlighted word.
- **Body text:** Neutral, readable, and slightly compact. The product is collaborative software, so copy should scan quickly.
- **Labels and metadata:** Semibold, often uppercase for section kickers, chips, compact nav labels, and small signals.
- **Mono:** JetBrains Mono is reserved for technical affordances such as keyboard hints and command surfaces.

Avoid decorative type pairings. The brand character comes from color, shape, and motion, not typography contrast.

## Layout

The layout system uses a compact 4px-based rhythm, usually expressed in 8px, 12px, 16px, 24px, and 32px steps. Public sections breathe more than the application workspace, but neither mode should feel sparse.

- **Landing page:** Wide center column with strong vertical pacing, immersive background treatments, and a visible next section peeking below the fold.
- **Authenticated app:** Max-width content with compact headers, dense cards, and quick-access navigation. Surfaces are grouped clearly, but whitespace is economical.
- **Mobile:** Navigation is condensed into fixed bottom tabs and tight top bars. Controls keep comfortable touch targets without wasting horizontal space.

Cards, panels, and form sections should be padded enough to feel deliberate, but the product should still read as a work tool rather than a marketing site.

## Elevation & Depth

Depth comes from stacked tonal layers, blur, and selective glow instead of large opaque shadows.

- **Public surfaces:** Atmospheric depth is strongest here. Use soft radial glows, glass overlays, thin strokes, and luminous progress trails.
- **Workspace surfaces:** Depth is quieter. Cards are separated with subtle borders, gentle internal highlights, and short-range shadows tinted by the brand green.
- **Sticky navigation:** Top and bottom navs use translucent backgrounds with blur so they feel fixed above the route without becoming heavy bars.

The brightest visual depth should be reserved for beacon moments: primary CTAs, active route markers, hero highlight text, and the landing-page traveler path.

## Shapes

The shape language is soft and practical.

- Standard controls lean on **8px to 16px** radii.
- Pills, chips, and route indicators use fully rounded ends.
- Feature cards and app panels feel gently softened, not bubbly.
- Circular motifs matter: waypoints, concentric beacon rings, traveler dots, and status halos should recur across the system.

Do not mix sharp corners with highly rounded capsules in the same cluster unless the round form is clearly being used as a waypoint or pill.

## Components

Buttons should look solid and tactile. Primary buttons are filled mint-green with dark text, modest lift on hover, and smooth eased motion. Secondary buttons are translucent or card-toned, bordered, and slightly glassy.

Inputs should stay simple and readable: clear border, quiet background contrast, and strong focus ring in the beacon green. In dark mode they sit inside the same charcoal surface family as the app. In light mode they sit on paper-like backgrounds with muted gray-green borders.

Navigation is compact and highly functional:

- **Top navigation:** blurred, sticky, and thin, with icon buttons and search access rather than oversized chrome.
- **Sidebar navigation:** narrow, tonal, and route-like, with active items highlighted by a filled band plus a vertical green rail.
- **Mobile navigation:** fixed to the bottom, icon-first, and compact. The active state is indicated by color and a small glowing dot instead of a large pill.

Cards split into two families:

- **Landing cards and hero callouts:** more dramatic glass treatment, subtle perspective motion, and soft glow.
- **Workspace cards:** quieter bordered panels with just enough lift to separate planning modules, stats, and trip summaries.

Kickers, chips, and section badges should feel like route markers: uppercase, spaced out, lightly bordered, and used sparingly.

Motion should stay smooth and gradual. Hover states, card lift, icon transitions, and ambient scene movement all use eased timing rather than abrupt snaps. Reduced-motion mode should preserve clarity by removing travel, parallax, and pulsing while keeping layout and hierarchy intact.

## Do's and Don'ts

- Do keep the overall palette outdoorsy and layered, especially in dark mode.
- Do use the primary green as the system's single strongest action and wayfinding signal.
- Do keep mobile navigation compact and efficient.
- Do favor translucent surfaces, tonal contrast, and low-angle shadows over heavy opaque cards.
- Do let public pages feel more atmospheric than the authenticated workspace.
- Don't flatten the interface into one undifferentiated green wash.
- Don't introduce bright blue, purple, or candy-colored accents that break the forest palette.
- Don't use abrupt hover or state transitions.
- Don't make the internal product feel like a landing page; once inside the workspace, utility should outrank spectacle.
