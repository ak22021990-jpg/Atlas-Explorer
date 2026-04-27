# Atlas Explorer: Retro Arcade Redesign

We will transform Atlas Explorer into a vibrant, pixel-art/80s synth-wave inspired "Retro Arcade" training game. 

To avoid hallucination and context exhaustion, we will execute this plan **one screen at a time**. After each screen is completed, I will pause to verify the results before moving on to the next.

## Global Setup: Theme Definition
First, we will update `css/styles.css` to establish the "Retro Arcade" design tokens (neon colors, pixel/arcade fonts, blocky shadows, CRT glow effects). We will import a suitable Google Font (like 'Press Start 2P' or 'VT323').

## Screen-by-Screen Implementation

### 1. Landing & Login Screen
**Preference: Option A (Split-Screen Panning Map)**
- Update `index.html` layout to a true 50/50 split.
- Left side: A stylized, panning retro map (using a dark background with neon grid lines and the existing SVG map tinted).
- Right side: A retro arcade cabinet "Insert Coin" style login form. Blocky buttons, blinking cursors.

### 2. Main Hub / Game Selector
**Preference: Option A (Interactive Atlas)**
- Replace the current list-based challenge track with an interactive map view in the hub.
- The 4 games will be represented as glowing, pulsating waypoints on the North American SVG map.
- Clicking a waypoint reveals the game description and a "START MISSION" button.

### 3. Mini-Game 1: Crack the Code
**Preference: Option C (Falling Blocks / Tetris style)**
- Rewrite `js/crack-the-code.js` to implement an arcade-style loop.
- State names fall from the top of the screen.
- A terminal input sits at the bottom where the agent rapidly types the abbreviation to "destroy" the block before it hits the bottom.

### 4. Mini-Game 2: Pin It!
**Preference: Option A (Radar Sweep)**
- Update `js/pin-it.js`.
- The map gets a dark overlay. We will add a CSS animation for a radar sweep.
- The target state name is displayed prominently at the top in neon text.
- Clicks trigger pixelated ripple or explosion effects.

### 5. Mini-Game 3: City Sorter
**Preference: Option B (Kanban Board / Trello style)**
- Update `js/city-sorter.js`.
- Change the layout to horizontal columns representing states.
- Cities appear as neon "tickets" that can be dragged and dropped into the respective columns.

### 6. Mini-Game 4: Region Ranger
**Preference: Option B (Tagging Ring)**
- Update `js/region-ranger.js`.
- Center the target state name in a glowing orb.
- Surround it with 5 retro-styled arcade buttons (representing the regions).
- The user must quickly click the correct corresponding button.

### 7. Post-Game & Leaderboard
**Preference: Option A (Classified Dossier)**
- Update `js/results.js`.
- Create an 8-bit style "MISSION PASSED" / "MISSION FAILED" stamp animation.
- Display stats in a retro computer terminal interface (green text on black background, scanlines).

## Execution Strategy
I will start by setting up the global CSS and implementing **Screen 1 (Landing & Login)**. Once I've finished the code changes for Screen 1, I will ask you to review it locally. Once you approve, we will move to Screen 2, and so on.

## User Review Required
Please review this plan. If you are happy with the breakdown, say "Approved" or "Start Screen 1", and I will begin generating the code for the global CSS theme and the Landing Screen!
