# Graph Report - .  (2026-04-24)

## Corpus Check
- Corpus is ~20,569 words - fits in a single context window. You may not need a graph.

## Summary
- 170 nodes · 223 edges · 21 communities detected
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 28 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Retro Arcade Redesign Specs|Retro Arcade Redesign Specs]]
- [[_COMMUNITY_Session and Results Logic|Session and Results Logic]]
- [[_COMMUNITY_Game Shell and Navigation|Game Shell and Navigation]]
- [[_COMMUNITY_Canada SVG Regions|Canada SVG Regions]]
- [[_COMMUNITY_Infrastructure and Data Flow|Infrastructure and Data Flow]]
- [[_COMMUNITY_North America Atlas Map|North America Atlas Map]]
- [[_COMMUNITY_Main Game Orchestrator|Main Game Orchestrator]]
- [[_COMMUNITY_City Sorter Game Logic|City Sorter Game Logic]]
- [[_COMMUNITY_Leaderboard Module|Leaderboard Module]]
- [[_COMMUNITY_Pin It Game Logic|Pin It Game Logic]]
- [[_COMMUNITY_Region Ranger Game Logic|Region Ranger Game Logic]]
- [[_COMMUNITY_Scoring Engine|Scoring Engine]]
- [[_COMMUNITY_Test Runner Framework|Test Runner Framework]]
- [[_COMMUNITY_Crack the Code Game|Crack the Code Game]]
- [[_COMMUNITY_Visual Identity and Branding|Visual Identity and Branding]]
- [[_COMMUNITY_City Sorter Tests|City Sorter Tests]]
- [[_COMMUNITY_Crack the Code Tests|Crack the Code Tests]]
- [[_COMMUNITY_Pin It Tests|Pin It Tests]]
- [[_COMMUNITY_Region Ranger Tests|Region Ranger Tests]]
- [[_COMMUNITY_Scoring Tests|Scoring Tests]]
- [[_COMMUNITY_Session Tests|Session Tests]]

## God Nodes (most connected - your core abstractions)
1. `Canada Provinces/Territories Group (SVG)` - 14 edges
2. `Atlas Explorer Design Spec (2026-04-24)` - 13 edges
3. `Retro Arcade Redesign Plan` - 11 edges
4. `mountResults()` - 10 edges
5. `Landing Page (index.html)` - 8 edges
6. `USA States Group (SVG)` - 8 edges
7. `getSubmissionPayload()` - 6 edges
8. `Atlas Explorer` - 6 edges
9. `Google Apps Script Web App` - 6 edges
10. `Mini-Game 2: Pin It! (SVG Map Click)` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Retro Arcade CSS Theme (css/retro.css)` --semantically_similar_to--> `Color Palette (Teal / Gold / Coral / Navy / Paper)`  [INFERRED] [semantically similar]
  implementation_plan.md → stitch_instructions.md
- `mountResults()` --calls--> `renderLeaderboard()`  [INFERRED]
  js\results.js → js\leaderboard.js
- `Atlas Map Preview` --references--> `North America SVG Atlas Map`  [EXTRACTED]
  index.html → maps/north-america.svg
- `Results — Classified Dossier / 8-bit Terminal Style` --semantically_similar_to--> `Screen 7 — Results Summary Dashboard Spec`  [INFERRED] [semantically similar]
  implementation_plan.md → stitch_instructions.md
- `Mini-Game 2: Pin It! (SVG Map Click)` --references--> `North America SVG Atlas Map`  [EXTRACTED]
  docs/superpowers/specs/2026-04-24-atlas-explorer-design.md → maps/north-america.svg

## Hyperedges (group relationships)
- **Four Mini-Games as Layered Geography Training System** — spec_minigame1_crack_the_code, spec_minigame2_pin_it, spec_minigame3_city_sorter, spec_minigame4_region_ranger [EXTRACTED 1.00]
- **Scoring, Pass Threshold, and Blocked State Gate Progression** — spec_pass_threshold, spec_blocked_state, spec_star_rating [EXTRACTED 1.00]
- **Google Apps Script / Sheets / Leaderboard Data Pipeline** — readme_google_apps_script, readme_google_sheets_backend, spec_leaderboard [EXTRACTED 1.00]

## Communities

### Community 0 - "Retro Arcade Redesign Specs"
Cohesion: 0.11
Nodes (26): City Sorter — Kanban Board Style, Crack the Code — Falling Blocks / Tetris Style, Main Hub — Interactive Atlas with Glowing Waypoints, Pin It! — Radar Sweep Style, Region Ranger — Tagging Ring Style, Results — Classified Dossier / 8-bit Terminal Style, Retro Arcade Redesign Plan, Retro Arcade CSS Theme (css/retro.css) (+18 more)

### Community 1 - "Session and Results Logic"
Cohesion: 0.2
Nodes (12): downloadCertificate(), escapeHtml(), mountResults(), applyFinalAttempt(), getSubmissionPayload(), getTotalScore(), getTotalStars(), isAllPassed() (+4 more)

### Community 2 - "Game Shell and Navigation"
Cohesion: 0.12
Nodes (16): Game Container (#game-container), Game Shell (game.html), main.js (game orchestrator), Player Summary Bar, Challenge Track (4-step progress list), Landing Page (index.html), Readiness Row (4 games / 70% / 12 stars), session.js (createSession / saveSession) (+8 more)

### Community 3 - "Canada SVG Regions"
Cohesion: 0.14
Nodes (14): Canada Provinces/Territories Group (SVG), Alberta (AB), British Columbia (BC), Manitoba (MB), New Brunswick (NB), Newfoundland and Labrador (NL), Nova Scotia (NS), Northwest Territories (NT) (+6 more)

### Community 4 - "Infrastructure and Data Flow"
Cohesion: 0.25
Nodes (11): Atlas Explorer, GitHub Pages Hosting, Google Apps Script Web App, Google Sheets Backend, LocalStorage Score Fallback, Vanilla JS / No-Build Stack, CORS Requirement — Apps Script Auto-Adds Allow-Origin Headers, Data Flow: Games → JS Collect → Apps Script POST → Google Sheets → Leaderboard JSON (+3 more)

### Community 5 - "North America Atlas Map"
Cohesion: 0.18
Nodes (11): Atlas Map Preview, atlas-region CSS Class (Clickable SVG Paths), North America SVG Atlas Map, Alaska (AK), California (CA), Florida (FL), Hawaii (HI), New York (NY) (+3 more)

### Community 6 - "Main Game Orchestrator"
Cohesion: 0.33
Nodes (8): attemptLabel(), handleGameComplete(), introCopy(), renderAttemptResult(), renderIntro(), renderShell(), route(), saveSession()

### Community 7 - "City Sorter Game Logic"
Cohesion: 0.31
Nodes (4): buildRounds(), groupCitiesByState(), mountCitySorter(), shuffle()

### Community 8 - "Leaderboard Module"
Cohesion: 0.42
Nodes (7): fetchLeaderboard(), getLocalScores(), isConfigured(), readLocalScores(), renderLeaderboard(), saveLocalScore(), submitScore()

### Community 9 - "Pin It Game Logic"
Cohesion: 0.28
Nodes (3): mountPinIt(), pickPinQuestions(), shuffle()

### Community 10 - "Region Ranger Game Logic"
Cohesion: 0.32
Nodes (3): mountRegionRanger(), pickQuestions(), shuffle()

### Community 11 - "Scoring Engine"
Cohesion: 0.52
Nodes (5): calculateStars(), isPassed(), normalizeAttempt(), percentCorrect(), requiredCorrect()

### Community 12 - "Test Runner Framework"
Cohesion: 0.29
Nodes (0): 

### Community 13 - "Crack the Code Game"
Cohesion: 0.6
Nodes (3): mountCrackTheCode(), pickQuestions(), shuffle()

### Community 14 - "Visual Identity and Branding"
Cohesion: 0.5
Nodes (4): Brand Mark (AE), Color Palette (Teal / Gold / Coral / Navy / Paper), Timer Bar with Gradient Fill, Visual Identity — Recruitment Geography Lab Aesthetic

### Community 15 - "City Sorter Tests"
Cohesion: 1.0
Nodes (0): 

### Community 16 - "Crack the Code Tests"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Pin It Tests"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Region Ranger Tests"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Scoring Tests"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "Session Tests"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **38 isolated node(s):** `Batch IDs (data/batches.json)`, `Agent Login Form`, `Challenge Track (4-step progress list)`, `Readiness Row (4 games / 70% / 12 stars)`, `main.js (game orchestrator)` (+33 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `City Sorter Tests`** (1 nodes): `test-city-sorter.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Crack the Code Tests`** (1 nodes): `test-crack-the-code.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Pin It Tests`** (1 nodes): `test-pin-it.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Region Ranger Tests`** (1 nodes): `test-region-ranger.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Scoring Tests`** (1 nodes): `test-scoring.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Session Tests`** (1 nodes): `test-session.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `North America SVG Atlas Map` connect `North America Atlas Map` to `Retro Arcade Redesign Specs`, `Canada SVG Regions`?**
  _High betweenness centrality (0.126) - this node is a cross-community bridge._
- **Why does `Mini-Game 2: Pin It! (SVG Map Click)` connect `Retro Arcade Redesign Specs` to `North America Atlas Map`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Why does `Atlas Explorer Design Spec (2026-04-24)` connect `Retro Arcade Redesign Specs` to `Game Shell and Navigation`, `Infrastructure and Data Flow`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `Retro Arcade Redesign Plan` (e.g. with `Mini-Game 1: Crack the Code (Abbreviation Quiz)` and `Mini-Game 2: Pin It! (SVG Map Click)`) actually correct?**
  _`Retro Arcade Redesign Plan` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 8 inferred relationships involving `mountResults()` (e.g. with `route()` and `isAllPassed()`) actually correct?**
  _`mountResults()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Batch IDs (data/batches.json)`, `Agent Login Form`, `Challenge Track (4-step progress list)` to the rest of the system?**
  _38 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Retro Arcade Redesign Specs` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._