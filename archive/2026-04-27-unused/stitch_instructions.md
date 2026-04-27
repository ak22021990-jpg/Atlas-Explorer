# Design & Style Instructions for Atlas Explorer

These instructions are intended for generating a premium, high-fidelity design for the **Atlas Explorer** recruitment geography lab. The design should feel professional, cartographic, and academic, yet modern and interactive.

## 1. Visual Identity & Aesthetic
- **Core Theme**: "Recruitment Geography Lab" — A mix of a modern intelligence dashboard and a classic cartographic explorer.
- **Atmosphere**: Clean, precise, and authoritative. Use subtle textures like paper or blueprint grids.
- **Color Palette**:
  - **Teal (#0F7B72)**: Primary action and brand color.
  - **Gold (#D1972A)**: Accents and highlighting achievements.
  - **Coral (#D8664A)**: Error states and critical markers.
  - **Navy (#23394F)**: Deep contrast for text and headers.
  - **Paper (#F5EFE2)**: Base background color for a physical map feel.
- **Typography**: Clean sans-serif (e.g., **Inter** or **Outfit**) with heavy weights for titles to convey importance.

---

## 2. Global UI Elements
- **Containers**: Cards with subtle shadows (`0 18px 46px rgba(23, 36, 33, 0.14)`), 8px border radius, and thin 1px borders (#D7D0C0).
- **Buttons**:
    - **Primary**: Teal to Navy gradient, 900 weight text, subtle lift on hover.
    - **Secondary**: Light green/gray (#EEF3F0) with a thin border.
- **Progress Markers**: A "Timer Bar" with a gradient fill (Teal to Gold) that turns Coral when time is running low.
- **Branding**: A "Brand Mark" square with "AE" in bold 900 weight, using a Teal to Blue gradient background.

---

## 3. Screen-Specific Requirements

### Screen 1: Landing/Entry (index.html)
- **Layout**: Split screen. Left side is the entry form; right side is the "Atlas Mission Board".
- **Elements**: 
    - **Eyebrow tags**: Small uppercase pills for "Live Route" or "Lab Mode".
    - **Readiness Row**: 3 columns showing "4 mini-games", "70% pass line", "12 stars" in styled boxes.
    - **Challenge Track**: A horizontal 4-step progress list showing game names and descriptions.

### Screen 2: Game Intro
- **Layout**: Centered modal-style panel.
- **Elements**: Large H1 title, game number indicator (e.g., "Game 1 of 4"), and a clear "Start Game" button.
- **Context**: Display high-level goals like "Decode location shorthand before it slows down a screening call."

### Screen 3: Game 1 - Crack the Code
- **Layout**: Large question header with a 2x2 grid of answer options.
- **Interactions**: Options should highlight Teal on hover and show Green (correct) or Coral (wrong) feedback instantly.

### Screen 4: Game 2 - Pin It
- **Layout**: Large SVG-based map container.
- **Elements**: An interactive map where regions (states/provinces) change color on hover (#B8D2CA).
- **Review Mode**: A special view showing the map with correct/incorrect pins marked with different colored dots.

### Screen 5: Game 3 - City Sorter
- **Layout**: Drag-and-drop interface with a "City Tray" on the left and "Region Buckets" on the right.
- **Elements**: "City Cards" that can be moved or clicked into buckets. Buckets should have a dashed border that turns Teal when hovered.

### Screen 6: Game 4 - Region Ranger
- **Layout**: A map divided into broad regions.
- **Interaction**: A "Legend" that disappears after a few seconds, forcing the player to classify regions from memory.

### Screen 7: Results Summary
- **Layout**: A comprehensive dashboard showing total score, pass/fail status, and a breakdown of every game attempt.
- **Elements**: Large metric numbers for the score and a "Result Card" for each game played.

---

## 4. Micro-interactions
- **Feedback**: Smooth transitions (0.16s) for all button hovers and color changes.
- **Animations**: Subtle "bounce" animation for incorrect placements in the Sorter game.
- **State Changes**: Disabled states should use 0.58 opacity and a "not-allowed" cursor.
