---
name: Modern Geographic
colors:
  surface: '#fbf9fa'
  surface-dim: '#dcd9db'
  surface-bright: '#fbf9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f4'
  surface-container: '#f0edee'
  surface-container-high: '#eae7e9'
  surface-container-highest: '#e4e2e3'
  on-surface: '#1b1b1d'
  on-surface-variant: '#44474c'
  inverse-surface: '#303031'
  inverse-on-surface: '#f3f0f1'
  outline: '#75777c'
  outline-variant: '#c5c6cc'
  surface-tint: '#535f70'
  primary: '#0e1a28'
  on-primary: '#ffffff'
  primary-container: '#232f3e'
  on-primary-container: '#8a97a9'
  inverse-primary: '#bbc7db'
  secondary: '#8a5100'
  on-secondary: '#ffffff'
  secondary-container: '#fe9800'
  on-secondary-container: '#643900'
  tertiary: '#271500'
  on-tertiary: '#ffffff'
  tertiary-container: '#432800'
  on-tertiary-container: '#c48a3b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d7e3f7'
  primary-fixed-dim: '#bbc7db'
  on-primary-fixed: '#101c2b'
  on-primary-fixed-variant: '#3c4858'
  secondary-fixed: '#ffdcbd'
  secondary-fixed-dim: '#ffb86f'
  on-secondary-fixed: '#2c1600'
  on-secondary-fixed-variant: '#693c00'
  tertiary-fixed: '#ffddb7'
  tertiary-fixed-dim: '#fbba67'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#fbf9fa'
  on-background: '#1b1b1d'
  surface-variant: '#e4e2e3'
typography:
  h1-display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  h2-headline:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '800'
    lineHeight: '1.2'
  h3-subheading:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.1em
  label-numeric:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin: 48px
  container-max: 1440px
---

## Brand & Style

This design system establishes a high-end, energetic aesthetic that balances the authority of a premium scientific journal with the excitement of modern global exploration. The brand personality is adventurous yet sophisticated, targeting users who value discovery, precision, and tactile quality.

The visual style is a hybrid of **Tactile Minimalism** and **Structural Modernism**. It moves away from generic digital interfaces by utilizing physical metaphors—specifically high-grade paper stock and cartographic drafting—while maintaining the crispness of a high-performance gaming application. The emotional response is one of curated discovery: the UI should feel like a bespoke field kit for a modern explorer.

## Colors

The palette operates in two distinct modes to differentiate navigation from immersion. 

**Landing & High-Energy States:** Uses a deep "Command Navy" (#232F3E) background to provide a premium, authoritative foundation. "Horizon Orange" (#FF9900) is reserved strictly for primary calls to action, ensuring maximum energy and visual hierarchy. "Sunlight Amber" (#FEBD69) provides secondary accents to soften the high-contrast transition.

**Gameplay & Exploration States:** Transitions to a "Paper-like" surface (#F5F0E8) to mimic physical maps. Text switches to "Ink Slate" (#2D3B2F) for a grounded, legible feel. Terrain accents (Teal, Ochre, Green, Slate) are muted and earth-toned, used for data visualization, map markers, and categorical iconography to ensure they feel part of the environment rather than digital overlays.

## Typography

This design system utilizes **Inter** exclusively to maintain a utilitarian and structured feel. The hierarchy is driven by extreme weight contrasts.

Headings use the 800 weight to create a "bold-stamp" effect, suggestive of titles on a physical atlas. Labels are kept exceptionally clean, often using uppercase with increased letter spacing to mimic coordinate markers on a map. For gameplay stats and coordinates, use the numeric label style with tabular lining enabled to ensure perfect alignment in dynamic data fields.

## Layout & Spacing

The layout philosophy follows a **Fixed Grid** model for landing experiences and a **Structured Modular** model for gameplay. 

A 12-column grid provides the backbone, with generous 48px outer margins to create a premium, "gallery-style" frame around the content. Spacing is based on a 4px baseline, but large-scale components should use 24px increments to maintain a sense of openness and breathability. Topographic patterns should be used as background overlays within containers, subtly breaking the grid to suggest organic terrain.

## Elevation & Depth

Depth in this design system is achieved through **Tonal Layering** and **Micro-Shadows**, rather than aggressive blurs.

*   **Surface Stacking:** Elements feel like layers of paper or parchment. Higher elevation is indicated by a shift from the base paper color to a pure white (#FFFFFF), creating a "stacked sheet" effect.
*   **Shadows:** Use extremely tight, low-opacity shadows (0px 2px 4px rgba(45, 59, 47, 0.1)) to simulate the thickness of heavy-weight paper.
*   **Dividers:** Use 1px "Ink" strokes at 10% opacity instead of shadows for flat organizational structures, maintaining the look of technical drafting.

## Shapes

The shape language is **Soft (0.25rem)**. This subtle rounding prevents the UI from feeling overly clinical or sharp (like a blueprint) while avoiding the consumer-grade "bubbly" look of standard mobile apps.

Buttons and active containers use the base 4px radius. Large panels or map overlays use the `rounded-lg` (8px) setting to distinguish themselves from the primary canvas. Rectilinear forms predominate to maintain the "Modern Geographic" structure.

## Components

*   **Buttons:** Primary buttons use the Orange CTA (#FF9900) with bold Inter text. They have no gradient, relying on a slight 2px vertical offset on hover to simulate being pressed into a surface.
*   **Panels:** Off-white paper panels (#F5F0E8) feature a subtle 1px border (#2D3B2F at 15% opacity). In gameplay, panels may feature a faint topographic watermark in the bottom corner.
*   **Chips/Tags:** Used for "Region" or "Climate" labels. These use the terrain-inspired palette (e.g., Forest Green background at 15% with dark forest text).
*   **Input Fields:** Ghost-style inputs with a bottom-border only, mimicking the look of a fillable form on a physical document.
*   **Compass/HUD Elements:** Use "Mountain Slate" for mechanical UI components. These should be framed in circular or semi-circular containers to break the rectangular grid and evoke navigation instruments.
*   **Lists:** Items are separated by subtle "dot-leader" lines (....) typically found in an index or table of contents.