# QueueLess GovCore OS - Light Neumorphism Design System

## Core Aesthetic
- **Style:** Clean, modern, minimal Light Neumorphism
- **Base Philosophy:** Soft extrusion from the background, avoiding harsh borders or stark contrast.
- **Reference Inspiration:** [Neumorphism.io](https://neumorphism.io/#e0e0e0) adapted for a modern web application.

## Colors
- **Primary Background:** `#F0F2F5` (Soft light grey/blue)
- **Surface / Card / Sidebar / Header:** `#F0F2F5` (Matching background to maintain the "extruded" physical material look)
- **Text Primary (Foreground):** `#334155` (Slate-700) for high readability without the harshness of pure black.
- **Text Secondary (Muted):** `#64748B` (Slate-500)
- **Primary Accent:** `#3B82F6` (Blue-500) for key metrics or subtle active states.

## Neumorphic Shadows
Shadows define the UI depth instead of borders.
- **Light Source:** Top-left (typical for Neumorphism)
- **Base Shadow (Default/Cards):** `6px 6px 12px #d1d5db, -6px -6px 12px #ffffff`
- **Small Shadow (Buttons/Inputs):** `4px 4px 8px #d1d5db, -4px -4px 8px #ffffff`
- **Inset Shadow (Pressed/Active):** `inset 4px 4px 8px #d1d5db, inset -4px -4px 8px #ffffff`

## Typography
- **Font Family:** Plus Jakarta Sans (or default Geist/Inter if already configured)
- **Headings:** Bold (`font-bold`, 700), `text-slate-800`
- **Body:** Regular (`font-normal`, 400), `text-slate-700`
- **Metrics/Numbers:** Bold, clear hierarchy using sizes from `text-2xl` up to `text-4xl`.

## Layout & Components
### Dark Theme Configuration
- **Background:** `#111111` (Deep dark grey / nearly black)
- **Foreground (Text):** `#fde047` (Bright yellow) for optimal high-contrast in dark mode.
- **Dark Neumorphic Shadows:** 
  - Standard: `6px 6px 12px #070707, -6px -6px 12px #1b1b1b`
  - Small: `4px 4px 8px #070707, -4px -4px 8px #1b1b1b`
  - Inset: `inset 4px 4px 8px #070707, inset -4px -4px 8px #1b1b1b`
- **Toggle:** A theme toggle is located in the header for fast switching between light and dark modes. The dark mode uses the identical Extruded/Inset Neumorphism principles but shifts the shadow light source matching `#111111`.

### Sidebar & Header
- Blends into the main background (`bg-[#F0F2F5]` / `bg-[#111111]`).
- Separated from the main content using subtle Neumorphic outer shadows rather than harsh borders.
- **Interactive Elements (Sidebar Items, Avatars, Actions):** Use smooth transitions (`transition-all duration-300`) with `hover:-translate-y-0.5` and `hover:shadow-neu-hover` to create a lightweight lift effect on hover.
- **Active Menu Items / Click States:** Uses inset shadows (`shadow-neu-inset`) and `active:translate-y-0` to look genuinely "pressed in", mimicking physical buttons. Active menu items also use slightly accented text or icons (e.g., Blue-600 or Yellow-300).

### Cards (Stats, Charts)
- Matches background color (`bg-[#F0F2F5]` / `bg-[#111111]`).
- Rounded corners: `rounded-2xl` (globally enforced in `card.tsx`).
- Spacing/Padding: Default card padding (`--card-spacing`) increased to `1.5rem` (equivalent to `p-6`) for a spacious, premium feel.
- Shadows: Outer soft shadow to appear elevated (`shadow-neu`).
- **Hover State:** Smooth, simple elevation using `transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-neu-hover` to make the cards lift gracefully on hover without being aggressive.
- No visible borders (or extremely subtle transparent ones) since the shadow creates the edge.

### Buttons & Inputs
- **Default Button:** Elevated (`shadow-neu-sm`), rounded-lg or full. Hover state reduces shadow slightly or transitions color.
- **Active/Pressed Button:** Inset shadow (`shadow-neu-inset`) to show depth.
- **Inputs:** Inset shadow to appear as a physical groove for typing.

## Spacing & Radii
- **Radii:** `rounded-xl` and `rounded-2xl` used broadly for a soft, friendly appearance.
- **Spacing:** Generous padding (`p-6` for cards, `gap-6` for grids).

---
*Note: This file should be updated incrementally as new components are styled.*
