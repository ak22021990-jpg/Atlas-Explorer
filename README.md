# Atlas Explorer

A vanilla JavaScript geography training game for recruitment screening agents. It covers US states and Canadian provinces through four mini-games and can submit scores to Google Sheets through Google Apps Script.

The app intentionally stays plain HTML, CSS, and ES-module JavaScript. There is no React, Vite, build step, or generated framework shell, which keeps the interface easy to customize and deploy on GitHub Pages.

## Run Locally

This app uses ES modules and fetches local JSON/SVG files, so run it from a local web server:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Mini-Games

1. **Crack the Code**: match abbreviation codes to full state/province names.
2. **Pin It!**: click the requested region on the atlas map.
3. **City Sorter**: drag city cards into the correct state/province buckets.
4. **Region Ranger**: classify states and provinces into broad geographic regions.

Agents must pass each mini-game at 70% or higher. One retry is allowed per mini-game. A second failure blocks progression and flags the session for trainer review.

## Tests

```powershell
npm.cmd test
```

PowerShell may block `npm test` on some Windows systems because it resolves to `npm.ps1`; `npm.cmd test` avoids that policy issue.

## Google Sheets Backend

1. Create a Google Sheet named `Atlas Explorer Scores`.
2. Open Extensions > Apps Script.
3. Paste the contents of `apps-script/Code.gs`.
4. Replace `REPLACE_WITH_YOUR_SPREADSHEET_ID` with the sheet ID from the Sheet URL.
5. Deploy as a Web App with:
   - Execute as: Me
   - Who has access: Anyone
6. Copy the deployed Web App URL.
7. In `js/leaderboard.js`, replace `REPLACE_WITH_YOUR_APPS_SCRIPT_URL` with that URL.

Until the Apps Script URL is configured, scores are stored in browser localStorage so the game remains usable for local demos.

## Batch IDs

Batch choices live in `data/batches.json`. Add upcoming cohort IDs there before training starts so agents choose from a controlled list.

## GitHub Pages

The app is static and can be served from the repository root:

1. Push the repository to GitHub.
2. In repository Settings > Pages, choose Deploy from branch.
3. Select the `main` branch and `/ (root)` folder.
4. Use the Pages URL for training sessions.

## Assets

The current build includes a stylized SVG atlas at `maps/north-america.svg`.
