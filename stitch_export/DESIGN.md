---
name: Aubergine & Oyster Minimalist Swiss Healthcare
colors:
  surface: '#fff7fc'
  surface-dim: '#e3d6e4'
  surface-bright: '#fff7fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fdeffe'
  surface-container: '#f7eaf8'
  surface-container-high: '#f2e4f2'
  surface-container-highest: '#ecdeed'
  on-surface: '#201923'
  on-surface-variant: '#4c444c'
  inverse-surface: '#362e38'
  inverse-on-surface: '#faecfb'
  outline: '#7e747c'
  outline-variant: '#cfc3cc'
  surface-tint: '#745377'
  primary: '#331737'
  on-primary: '#ffffff'
  primary-container: '#4a2c4e'
  on-primary-container: '#ba94bc'
  inverse-primary: '#e2b9e4'
  secondary: '#7b580c'
  on-secondary: '#ffffff'
  secondary-container: '#fecd79'
  on-secondary-container: '#785508'
  tertiary: '#002819'
  on-tertiary: '#ffffff'
  tertiary-container: '#00402a'
  on-tertiary-container: '#66af8c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffd6ff'
  primary-fixed-dim: '#e2b9e4'
  on-primary-fixed: '#2c1031'
  on-primary-fixed-variant: '#5b3c5f'
  secondary-fixed: '#ffdea9'
  secondary-fixed-dim: '#efbf6c'
  on-secondary-fixed: '#271900'
  on-secondary-fixed-variant: '#5f4100'
  tertiary-fixed: '#a8f2cc'
  tertiary-fixed-dim: '#8cd6b1'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#005237'
  background: '#fff7fc'
  on-background: '#201923'
  surface-variant: '#ecdeed'
typography:
  display-title:
    fontFamily: Mukta
    fontSize: 56px
    fontWeight: '600'
    lineHeight: 64px
    letterSpacing: -0.02em
  display-title-mobile:
    fontFamily: Mukta
    fontSize: 38px
    fontWeight: '600'
    lineHeight: 46px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Mukta
    fontSize: 44px
    fontWeight: '600'
    lineHeight: 52px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Mukta
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Mukta
    fontSize: 28px
    fontWeight: '500'
    lineHeight: 36px
  headline-sm:
    fontFamily: Mukta
    fontSize: 22px
    fontWeight: '500'
    lineHeight: 30px
  body-lg:
    fontFamily: Mukta
    fontSize: 20px
    fontWeight: '400'
    lineHeight: 32px
  body-md:
    fontFamily: Mukta
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-sm:
    fontFamily: Mukta
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  caption:
    fontFamily: Mukta
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  mono-token:
    fontFamily: IBM Plex Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.04em
  mono-label:
    fontFamily: IBM Plex Mono
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  space-3xl: 4rem
  gutter-desktop: 2rem
  gutter-mobile: 1rem
  margin-desktop: 4rem
  margin-mobile: 1.5rem
  touch-min: 3.5rem
  button-height-lg: 4rem
---

## Brand & Style

This design system expresses calm authority, human-centered clarity, and clinical exactitude. Drawing directly from Swiss International Typographic Style and refined editorial publishing, the visual architecture rejects sterile blue-dominated clinical tropes and chaotic dashboards. Instead, it frames personal health narratives as serious, dignified literature.

### Design Principles
- **Editorial Legibility:** Clinical data is parsed into narrative cadence. Content breathes with intentional macro-whitespace (48px–64px) rather than crowded multi-pane layouts.
- **Architectural Linearity:** Spatial separation is established strictly through 1px structural hairline rules and typographic hierarchy, never through heavy drop shadows or saturated background blocks.
- **Dignified Restraint:** A warm palette of deep aubergines, oysters, and brass accents instills emotional calm, intellectual precision, and understated warmth.
- **Tactile Honesty:** Surfaces are strictly solid and flat. Zero synthetic gradients, zero skeuomorphism, and zero ambient blur.

## Colors

The palette pairs organic oyster whites with deep plum-aubergine tones and balanced brass accents. Every functional state maps to high-contrast WCAG AAA compliant combinations.

### Surface Tiers
- **Canvas (`#F1EDE8`):** The foundational ambient background. Warm, tactile, non-glare oyster white.
- **Raised Surfaces (`#F8F6F2`):** Elevated reading panels, navigation modules, and modal backgrounds.
- **Data Surfaces (`#FFFFFF`):** Reserved strictly for actionable input containers, tabular figures, diagnostic charts, and clinical records.

### Text & Hierarchy
- **Primary Ink (`#211A24`):** Near-black plum. Used for headings, primary narrative text, and key readouts.
- **Secondary Ink (`#544A58`):** Supporting explanations, descriptive sub-copy, and field headers.
- **Muted Metadata (`#645A6A`):** Footnotes, timestamps, units of measure, and passive structural labels.

### Brand & Accents
- **Primary Aubergine Family:**
  - Base: `#4A2C4E` (interactive targets, primary actions, active navigation states)
  - Deepest: `#331E36` (hover/active states, authoritative titles)
  - Lighter Plum: `#6E4573` (secondary interactive elements, selected borders)
  - Tints: `#EBE0EC` (structural section backgrounds), `#F5EFF6` (subtle highlight fills)
- **Brass Accent Family:**
  - Base Accent: `#9A7328` (focal dots, editorial markers, key highlights)
  - Brass Text: `#7A5A1C` (high-contrast brass labels on light grounds)
  - Brass Tint: `#F0E6CE` (contextual highlight containers)

### Status & Rules
- **Success:** `#1F6B4D` (cleared metrics, confirmed consents)
- **Warning:** `#7A5A1C` (pending review, observational flags)
- **Critical / Red Flag:** `#A8412F` (alerts, contradictions, immediate interventions)
- **Hairlines:** Structural borders use `#D6CFD0`. Fine table lines and inner separators use `#E7E1E2`.

## Typography

The typographic hierarchy anchors readability through generous scale and deliberate contrast. **Mukta** provides a warm, humanist structure with clear letterforms suitable for clinical narrative clarity. Body text never falls below 18px on core reading views.

**IBM Plex Mono** is employed surgically for objective clinical identifiers: laboratory parameters, timestamps, reference ranges, protocol tags, and medical record indices. It brings architectural order to quantitative records.

### Implementation Rules
- Primary narrative text uses `body-md` (18px) with generous 28px line heights for high-comfort scanning.
- Key medical chapters and entry points use `headline-lg` (44px) or `display-title` (56px) on desktop, adjusting to 32px and 38px on handheld viewports.
- All uppercase identifiers, table column descriptors, and status tags are set in `mono-label` with uppercase styling and positive letter-spacing (`0.08em`).

## Layout & Spacing

Layouts follow an asymmetric Swiss editorial structure. Space is structural rather than decorative. 

### Spacing Philosophy
- Major narrative sections are separated by `space-2xl` (48px) to `space-3xl` (64px) of vertical breathing room.
- Micro-spacing strictly adheres to an 8px base increment, with a 4px half-step reserved for form labels and hairline rules.
- Content conforms to an asymmetric 12-column grid with 32px gutters on desktop (max content container: 1280px) and a single-column reflow model with 24px side padding on mobile.

### Persistent Rail Pattern
The persistent navigation rail maintains a dedicated vertical axis on desktop (occupying the initial 2 columns or fixed left boundary) anchored by a continuous 1px `#D6CFD0` hairline. It presents sequential waypoints: `YOU`, `CONSENT`, `YOUR STORY`, and `DOCTOR`. The active milestone is punctuated by an 8px solid brass dot (`#9A7328`) placed precisely on the centerline of the rule.

## Elevation & Depth

Depth is conveyed through tonal planar stratification and razor-sharp structural lines rather than atmospheric blur or drop shadows.

### Elevation Hierarchy
- **Level 0 (Base Canvas):** Solid `#F1EDE8`. Forms the continuous substrate.
- **Level 1 (Structural Separation):** Flat solid `#F8F6F2` framed by a 1px solid hairline (`#D6CFD0`).
- **Level 2 (Data Cards & Inputs):** Pure `#FFFFFF` planes. Used for input fields, diagnostic graphs, and medical record logs.
- **Soft Lift (Flyouts, Toasts & Dropdowns):** Subtle boundary offset achieved by:
  `box-shadow: 0 1px 3px rgba(33, 26, 36, 0.06); border: 1px solid #D6CFD0;`

Atmospheric diffusion, colored glows, and heavy multi-stop box-shadows are strictly forbidden. Visual priority is dictated by ink value, whitespace density, and hairline perimeter definition.

## Shapes

The design system uses a strict, unified corner radius of **4px** (`roundedness: 1`) across all operational containers, inputs, buttons, and alert modules. 

### Geometric Rules
- Buttons, inputs, modals, and surface containers use `border-radius: 4px`.
- Status indicators, track markers, and Lekha rail sequence dots remain true circles (`border-radius: 50%`).
- Pill shapes (`border-radius: 9999px`) are prohibited; rounded corners must remain architectural and compact, avoiding playful or soft consumer aesthetics.

## Components

### Action Buttons
- **Primary Buttons:** Height of 64px (`button-height-lg`) when full-width, minimum touch height of 56px (`touch-min`) on inline variants. Filled with `#4A2C4E`, text set in `Mukta` 18px Medium in `#FFFFFF`. Hover state: `#331E36`. Corner radius: 4px.
- **Secondary Buttons:** Background transparent or `#F8F6F2`, framed with 1px hairline `#D6CFD0`. Text in `#211A24`. Hover state: background `#EBE0EC`, border `#6E4573`.
- **Destructive Buttons:** Border 1px `#A8412F`, background transparent, text `#A8412F`. Hover state: background `#A8412F`, text `#FFFFFF`.

### Inputs & Form Fields
- Field containers feature a strict minimum height of 56px, background `#FFFFFF`, and 1px border `#D6CFD0`.
- Typed input is rendered in `Mukta` 18px `#211A24`. Field titles utilize `mono-label` (11px uppercase) placed above the input container with 6px spacing.
- Focus state: Outline zero; border transforms to 1.5px `#4A2C4E`.
- Validation errors: Border transforms to 1.5px `#A8412F` accompanied by an explicit text description below in 14px `#A8412F`.

### Checkboxes & Radios
- Minimum touch bounding box: 56px x 56px centered hit-target. Visual indicator: 20px x 20px square (checkbox) or 20px x 20px circle (radio).
- Unselected: 1px border `#645A6A` on `#FFFFFF` fill.
- Selected: `#4A2C4E` fill with sharp white checkmark or inner dot. Must always be paired with high-contrast text labels; color is never the sole differentiator.

### Clinical Data Cards
- Background: `#FFFFFF` (data-entry/metrics) or `#F8F6F2` (narrative context).
- Border: 1px hairline `#D6CFD0`. No ambient drop shadows.
- Internal padding: 24px on mobile, 32px on desktop.
- Header row: Segmented by a 1px internal rule (`#E7E1E2`) separating header metadata from record content.

### Lekha Progression Rail
- Vertical 1px rule `#D6CFD0` running along the section axis.
- Waypoint items (`YOU`, `CONSENT`, `YOUR STORY`, `DOCTOR`) spaced at `space-2xl` (48px) intervals, rendered in `mono-label` `#645A6A`.
- Active item text: `#211A24` (Bold) anchored with a 8px solid `#9A7328` brass dot centered directly on the hairline. Completed items replace the brass dot with a `#1F6B4D` check indicator.

### Medical Chips & Tags
- Height: 28px. Padding: 0 10px. Border radius: 4px.
- Typographic style: `mono-token` (13px).
- Informational: Background `#F5EFF6`, border 1px `#EBE0EC`, text `#4A2C4E`.
- Critical/Red Flag: Background `#FDF2F0`, border 1px `#F5CBC4`, text `#A8412F`.
- Verified/Normal: Background `#EDF6F2`, border 1px `#CDE5D9`, text `#1F6B4D`.