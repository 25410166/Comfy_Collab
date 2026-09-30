---
name: ui-ux-pro
description: >-
  Premier UI/UX Design System and Pro Guidelines for 2027 Trend Blue (Bioluminescent Electric Cobalt & Cybernetic Azure).
  Specialized for modern AI generation suites, workflow editors, and pro workstations.
---

# UI/UX Pro Design System: 2027 Trend Blue

## 1. Color Palette: Bioluminescent Electric Azure (Trend 2027)
- **Primary Electric Blue**: `#0D5CFF` (RGB 13, 92, 255) - High-energy, futuristic, visionary.
- **Deep Space Obsidian Base**: `#050811` - Ultra-deep dark canvas preventing eye strain.
- **Subsurface Translucent Navy**: `#0B1120` / `rgba(11, 17, 32, 0.85)` - Glassmorphism surface.
- **Border Structural System**:
  - Passive: `#1E293B` (`border-slate-800/80`)
  - Hover / Focus: `#0D5CFF` with `box-shadow: 0 0 12px rgba(13, 92, 255, 0.35)`
- **Cybernetic Cyan Accents**: `#00F0FF` / `#38BDF8` - For live indicators, success states, and telemetry.
- **Luminescent Glow Utilities**:
  - `glow-primary`: `0 0 24px -4px rgba(13, 92, 255, 0.4)`
  - `glow-pill`: `0 0 8px rgba(13, 92, 255, 0.5)`

## 2. Typography & Hierarchy
- **Primary Sans**: System Apple SF Pro / Inter / Plus Jakarta Sans.
- **Micro Labels**: `text-[10px]` uppercase tracking-wider font-semibold text-slate-400.
- **Data & Numeric**: `font-mono` with tabular figures for GPU VRAM, token counts, render timing.

## 3. Interaction & Animation Principles
- Smooth cubic-bezier transitions (`transition-all duration-200 ease-out`).
- Mac-style segmented controls with subtle border illumination.
- Hover cards scale by `scale-[1.015]` with subtle top rim light.
- Instant tactile feedback for actions (Generate, Optimize, Copy).

## 4. Layout Architecture
- Persistent high-contrast dark theme with 0 light bleeds.
- Clean responsive grid layout for workflow cards (1 to 3 columns).
- Glassmorphic modal & drawer overlays with `backdrop-blur-xl`.
