🕹️ Comets League: Retro-Futuristic Arcade Refactor Master Plan

1. The Vision

Aesthetic: "Neon Void Arcade Sports".
Inspiration: Mario Super Sluggers meets Cyberpunk 2077 UI.
Core Vibe: High contrast, deep blacks (#050505), punchy neon accents (Cyan, Yellow, Magenta), tactile "juicy" interactions, and diegetic elements (scanlines, holograms).

2. The Tech Stack

Framework: Next.js 14+ (App Router)

Styling: Tailwind CSS

Animation: Framer Motion (Critical for the "arcade" feel)

Icons: Lucide React

Fonts: * Dela Gothic One (Headings/Impact)

Rajdhani (UI/HUD)

Chivo (Body)

Space Mono (Data/Numbers)

3. Phase 1: The System (Setup)

Goal: Establish the physics and atmosphere of the world.

3.1 Design Tokens (tailwind.config.ts)

Define the "Neon Void" palette and font stacks.

Colors:

background: #050505

surface: #0a0a0a

comets-yellow: #F4D03F

comets-cyan: #00F3FF

comets-red: #FF4D4D

comets-purple: #BD00FF

Animations: spin-slow (12s), pulse-slow (6s).

3.2 Global CSS (app/globals.css)

Theme: Set root variables for colors.

Utility: Create a .scanlines class using a linear-gradient to simulate a CRT monitor overlay.

Scrollbar: Custom dark/yellow scrollbar.

3.3 Root Layout (app/layout.tsx)

Font Loading: Load the 4 Google Fonts and inject them as CSS variables.

Structure: * Fixed Sidebar (Left, Desktop)

Header (Top, Sticky)

Footer (Bottom)

SidebarMobile (Overlay, Mobile only)

4. Phase 2: The "Lego Bricks" (UI Primitives)

Goal: Create the atomic components used to build every page.

4.1 RetroButton

Visual: Sharp corners, uppercase text (Rajdhani).

Interaction: On hover, a solid color block slides up (translate-y) to fill the button background.

Variants: primary (Yellow/Black), outline (White border).

4.2 RetroCard

Visual: Dark surface (#0a0a0a) with a subtle white border (border-white/10).

Interaction: Mouse hover triggers a radial gradient glow effect behind the content.

Animation: Staggered entry on page load (opacity: 0 -> 1).

4.3 RetroTable

Visual: "High-Score Screen" aesthetic.

Headers: Uppercase, tracked-out, neon yellow.

Rows: Monospace numbers.

Interaction: Hovering a row highlights it and adds a glowing "selection bar" to the left edge.

4.4 RetroLoader

Visual: A spinning "coin" or baseball graphic.

Text: Blinking "INSERT COIN" or "LOADING..." text in Dela Gothic One.

5. Phase 3: Feature Components (Complex UI)

Goal: Specialized UI for specific data views.

5.1 StatHighlight (The "Hologram")

Usage: Homepage Hero, Player Profiles.

Visual: A 3D-tilted card (using framer-motion perspective) showing a player's key stats.

Content: Large Avatar, Name, and animated progress bars for stats (OPS, HR, AVG).

5.2 VersusCard (The "Matchup")

Usage: Schedule Page, Team Detail Page.

Visual: Horizontal card split diagonally.

Left: Home Team (Background color = Team Color).

Right: Away Team (Background color = Team Color).

Center: Large "VS" text or Final Score.

5.3 TeamSelectCard (The "Character Select")

Usage: Teams Index Page.

Visual: Vertical card. Large Team Logo in the center.

Interaction: Hover scales the logo and reveals a stats summary overlay.

5.4 HolographicField (The "Tactical Map")

Usage: Lineup Builder Tool.

Visual: A CSS-drawn baseball diamond tilted in 3D space (rotate-x).

Features: Glowing nodes at positions (P, C, 1B, etc.). Clicking a node triggers an action.

6. Phase 4: Page-by-Page Implementation Details

🏠 Homepage (/)

Hero: Massive "COMETS LEAGUE" text with logo reveal animation.

Ticker: Scrolling marquee of latest news/scores.

Grid: 4 RetroCard links to main sections.

Highlight: A StatHighlight component featuring the league MVP.

🏆 Standings (/standings)

Layout: Simple container.

Component: StandingsTable.

Columns: Rank, Team (Logo+Name), W, L, PCT, Streak, Diff.

Logic: Sort by PCT > Wins > Diff.

Style: Top 4 ranks get a special "Gold/Yellow" glow on the rank number.

🗓️ Schedule (/schedule)

Layout: Vertical timeline.

Header: "Week Selector" (Horizontal scroll of neon pills).

Content: List of VersusCard components.

Grouping: Group matches by Date headers.

🧢 Teams Index (/teams)

Layout: Responsive Grid (1 col mobile -> 4 col desktop).

Content: Map through teams and render TeamSelectCard.

Vibe: Character Select Screen.

🏟️ Team Detail (/teams/[slug])

Header: "Locker Room" Banner. Full width, gradient background using team color. Large Logo watermark.

Tabs: Navigation tabs for "Roster", "Schedule", "Stats".

Tab: Roster: Renders RetroTable with player list.

Tab: Schedule: Renders grid of VersusCards.

⚾ Players Index (/players)

Layout: "Scouting Database".

Header: Search bar + Filter toggles (styled as HUD buttons).

Content: RetroTable.

Custom Cells: "Stamina" column renders a progress bar. "Team" renders a small logo.

👤 Player Profile (/players/[slug])

Hero: StatHighlight (The Hologram Card).

Stats: Tabbed interface below the hero.

Game Log: RetroTable showing recent matches.

Splits: Bar charts for L/R pitching performance.

🛠️ Lineup Builder (/tools/lineup)

Layout: Split Screen (Desktop).

Left: Player "Deck" (Scrollable list of cards).

Right: HolographicField.

Interaction: Clicking a player in the deck, then clicking a position on the field assigns them.

Feedback: "Chemistry" lines draw between players on the field (Blue=Good, Red=Bad).

⚔️ Head-to-Head (/tools/compare)

Layout: "Tale of the Tape" (Split Screen).

Visuals: * Left Side: Player A (Red Theme).

Right Side: Player B (Blue Theme).

Center: List of stats. The higher number glows.
