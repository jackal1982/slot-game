# Slot Game Development Reference
# Fortune Slots - Complete Architecture & Development Guide

> **Scope**: This document covers **Fortune Slots** specifically (5×3, 20-payline, `window.SlotGame`).
> For **Dragon Wolf Legend** (5×4, 1024-Ways, `window.DragonWolf`), refer to:
> - Game spec: `GAME_SPEC_dragon_wolf.md`
> - Source: `js/dragon_wolf/` directory

> **Purpose**: This document records the complete architecture, design decisions, problems encountered, and solutions applied during the development of "Fortune Slots". Use as a reference when building future slot games.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [File Structure](#2-file-structure)
3. [Module Architecture](#3-module-architecture)
4. [Data Flow & Game Loop](#4-data-flow--game-loop)
5. [Symbol System](#5-symbol-system)
6. [Reel System](#6-reel-system)
7. [RNG & Weighted Random](#7-rng--weighted-random)
8. [Payline Evaluation Engine](#8-payline-evaluation-engine)
9. [Feature Systems](#9-feature-systems)
10. [Jackpot System](#10-jackpot-system)
11. [Audio System](#11-audio-system)
12. [Animation System](#12-animation-system)
13. [UI & Controls](#13-ui--controls)
14. [State Management & Persistence](#14-state-management--persistence)
15. [CSS Architecture](#15-css-architecture)
16. [Responsive Design](#16-responsive-design)
17. [Design Decisions & Rationale](#17-design-decisions--rationale)
18. [Issues Encountered & Fixes](#18-issues-encountered--fixes)
19. [RTP Simulation](#19-rtp-simulation)
20. [Testing Checklist](#20-testing-checklist)
21. [Future Improvements](#21-future-improvements)

---

## 1. Project Overview

**Game Type**: 5-Reel, 3-Row, 20-Payline Video Slot Machine
**Technology**: Pure HTML5 + CSS3 + Vanilla JavaScript (no frameworks)
**Features**:
- Weighted random symbol generation
- 20 configurable paylines with wild substitution
- Progressive jackpot (pool-based)
- Free Spins with multiplier and retrigger
- Bonus Pick Game (treasure chest)
- Turbo mode, Auto-spin, Slam stop
- Web Audio API sound effects (programmatic, no audio files)
- SVG vector symbol graphics (no external image dependencies)
- localStorage persistence
- Fully responsive (desktop, tablet, mobile, landscape)

---

## 2. File Structure

```
Slot/
├── index.html              # Single HTML page, all DOM structure
├── css/
│   ├── main.css            # Root variables, layout, overlays, base styles
│   ├── reels.css           # Reel grid, viewport, symbol styling
│   ├── ui.css              # Controls, buttons, paytable, HUD, bonus game
│   ├── animations.css      # @keyframes, particle effects, transitions
│   └── responsive.css      # Media queries: tablet/mobile/small/landscape
├── js/
│   ├── config.js           # All constants, symbol definitions, paylines, tuning params
│   ├── state.js            # Game state + localStorage persistence
│   ├── rng.js              # Weighted random generation + RTP simulator
│   ├── audio.js            # Web Audio API programmatic sounds
│   ├── paylines.js         # Win evaluation engine
│   ├── features.js         # Free Spins + Bonus Game logic
│   ├── jackpot.js          # Progressive jackpot pool
│   ├── reels.js            # Reel rendering, spin animation, slam stop
│   ├── animations.js       # Win line canvas, particles, celebrations
│   ├── ui.js               # DOM events, display updates, paytable builder
│   └── main.js             # Bootstrap + game loop orchestration
└── images/
    ├── wild.svg            # Golden star with "W"
    ├── scatter.svg         # Blue diamond
    ├── crown.svg           # Golden crown with jewels
    ├── bell.svg            # Golden bell with bow
    ├── seven.svg           # Red "7" with gold outline
    ├── cherry.svg          # Twin red cherries
    ├── lemon.svg           # Yellow lemon
    └── grape.svg           # Purple grape cluster
```

### Script Load Order (Critical)

```html
<script src="js/config.js"></script>   <!-- 1. Constants first -->
<script src="js/state.js"></script>    <!-- 2. State manager -->
<script src="js/rng.js"></script>      <!-- 3. Random generator -->
<script src="js/audio.js"></script>    <!-- 4. Audio system -->
<script src="js/paylines.js"></script> <!-- 5. Win evaluation -->
<script src="js/features.js"></script> <!-- 6. Free spins & bonus -->
<script src="js/jackpot.js"></script>  <!-- 7. Jackpot pool -->
<script src="js/reels.js"></script>    <!-- 8. Reel rendering -->
<script src="js/animations.js"></script><!-- 9. Visual effects -->
<script src="js/ui.js"></script>       <!-- 10. UI bindings -->
<script src="js/main.js"></script>     <!-- 11. Bootstrap & game loop -->
```

All modules attach to the global `SlotGame` namespace object, avoiding ES module complexity for simplicity and broad compatibility.

---

## 3. Module Architecture

```
SlotGame (namespace)
├── Config      # Read-only constants and tuning parameters
├── State       # Mutable game state with save/load
├── RNG         # Random number generation (weighted)
├── Audio       # Programmatic Web Audio API sounds
├── Paylines    # Win evaluation engine
├── Features    # Free Spins + Bonus Game state machines
├── Jackpot     # Progressive pool management
├── Reels       # DOM rendering + spin/stop animation
├── Animations  # Canvas win lines + particle effects
├── UI          # DOM events, display updates
└── Main        # Bootstrap + game loop orchestration
```

### Module Dependency Graph

```
Config ← (all modules read from Config)
State  ← (all modules read/write State)
RNG    ← Main, Reels
Audio  ← Main, UI, Reels
Paylines ← Main, RNG (for RTP sim)
Features ← Main
Jackpot  ← Main
Reels    ← Main, UI
Animations ← Main, UI
UI       ← Main
Main     ← (entry point, orchestrates everything)
```

### Key Design Principle

Every module is a **plain object literal** attached to `SlotGame`. No classes, no prototypes, no `new`. This was chosen for:
- Simplicity and readability
- Easy debugging (everything is on `window.SlotGame`)
- No build step required
- Works in all browsers including older ones

---

## 4. Data Flow & Game Loop

### Phase State Machine

```
IDLE → SPINNING → EVALUATING → SHOWING_WINS → IDLE
                       │              │
                       │              ├→ Free Spins Intro → Free Spins Loop
                       │              ├→ Bonus Game
                       │              └→ Jackpot Overlay
                       │
                       └→ (no wins) → IDLE
```

### Spin Flow (Main.onSpin → continueAfterSpin)

```
1. onSpin()
   ├── Guard: phase must be IDLE
   ├── Deduct bet (or use free spin)
   ├── Clear previous win display
   ├── Set phase = SPINNING
   ├── Generate target grid via RNG
   └── Start reel animation → callback: onReelsStopped()

2. onReelsStopped(grid)
   ├── Set phase = EVALUATING
   ├── Evaluate all paylines
   ├── Apply free spin multiplier (if applicable)
   ├── Check scatter (3+ → queue free spins)
   ├── Check bonus trigger (3+ Crowns on payline)
   ├── Check jackpot (5 wilds middle row or random)
   ├── Add winnings to balance
   ├── If wins → phase = SHOWING_WINS → animate
   └── If no wins → onWinsShown()

3. onWinsShown()
   ├── Stop win line animations
   ├── Handle pending jackpot → show overlay, return
   ├── Handle pending bonus → start bonus game, return
   ├── Handle pending free spins → show intro, return
   └── continueAfterSpin()

4. continueAfterSpin()
   ├── Set phase = IDLE
   ├── Check free spins completion → show summary
   ├── Auto-spin free spins (if remaining)
   └── Auto-spin regular (if active)
```

### Spin Button State Machine

| Phase | Button Text | Button Style | Click Action |
|-------|-------------|-------------|--------------|
| IDLE | SPIN / FREE | Gold gradient | Start new spin |
| SPINNING | STOP | Red gradient | Slam stop |
| SHOWING_WINS | SKIP | Dim gold | Skip to next phase |
| IDLE (no balance) | SPIN (disabled) | Gray | Nothing |

---

## 5. Symbol System

### Symbol Definitions (config.js)

| ID | Name | SVG File | Weight | Pay x3 | Pay x4 | Pay x5 | Special |
|----|------|----------|--------|--------|--------|--------|---------|
| 0 | Wild | wild.svg | 2 | 31 | 118 | 435 | Substitutes all except Scatter |
| 1 | Scatter | scatter.svg | 3 | - | - | - | 3+ triggers Free Spins |
| 2 | Crown | crown.svg | 4 | 24 | 80 | 248 | 3+ on payline triggers Bonus |
| 3 | Bell | bell.svg | 6 | 15 | 48 | 150 | - |
| 4 | Seven | seven.svg | 8 | 12 | 40 | 97 | - |
| 5 | Cherry | cherry.svg | 10 | 8 | 24 | 75 | - |
| 6 | Lemon | lemon.svg | 14 | 5 | 15 | 48 | - |
| 7 | Grape | grape.svg | 14 | 3 | 8 | 40 | - |

**Total Weight**: 61

### SVG Symbol Design Specs

- ViewBox: `0 0 100 100`
- Uses `<defs>` for gradients and filters
- No external dependencies (self-contained SVGs)
- Radial/linear gradients for 3D appearance
- Drop shadow filters for depth
- Design style: Casino-themed, colorful, glossy

### Symbol Rendering

```javascript
// In reels.js - createSymbolEl()
createSymbolEl: function(symbolId) {
    var div = document.createElement('div');
    div.className = 'symbol';
    div.setAttribute('data-symbol', symbolId);
    var img = document.createElement('img');
    img.src = SlotGame.Config.symbols[symbolId].img;
    img.alt = SlotGame.Config.symbols[symbolId].name;
    img.draggable = false;
    div.appendChild(img);
    return div;
}
```

CSS for symbol images:
```css
.symbol img {
    width: 82%;
    height: 82%;
    object-fit: contain;
    pointer-events: none;
    user-select: none;
}
```

### Per-Reel Symbol Constraint

**Rule**: Wild (0), Scatter (1), Crown (2) can appear **at most once** per reel.

Implementation in `RNG.generateGrid()`:
```javascript
var LIMITED = [SlotGame.Config.WILD_ID, SlotGame.Config.SCATTER_ID, SlotGame.Config.CROWN_ID];
// Per reel: track which limited symbols already appeared
var usedLimited = {};
// do-while retry loop with max 50 attempts to avoid infinite loop
do {
    sym = this.pickSymbol();
    attempts++;
} while (attempts < 50 && usedLimited[sym]);
if (LIMITED.indexOf(sym) !== -1) {
    usedLimited[sym] = true;
}
```

---

## 6. Reel System

### Reel DOM Structure

```html
<div class="reel-viewport" data-reel="0">    <!-- Clip window, shows 3 rows -->
    <div class="reel-strip" id="reel-strip-0"> <!-- Slides vertically via CSS transform -->
        <div class="symbol" data-symbol="5">   <!-- Individual symbol -->
            <img src="images/cherry.svg" alt="Cherry">
        </div>
        <!-- ... more symbols ... -->
    </div>
</div>
```

### Spin Animation Technique

Uses **CSS transition** for smooth scrolling:

1. **Build Strip**: `[current 3] + [N random extras] + [target 3]`
2. **Start Position**: `translateY(0)` — shows current symbols
3. **Animate**: CSS transition `transform Xms cubic-bezier(0.1, 0.0, 0.2, 1.0)` to `translateY(-targetY)`
4. **Target Y Calculation**:
   ```javascript
   var totalSymbols = (currentColumn ? currentColumn.length : 0) + reelStrip.length;
   var totalHeight = totalSymbols * symbolSize;
   var viewportHeight = ROWS * symbolSize;
   var targetY = -(totalHeight - viewportHeight);
   ```

### Stagger Timing

Each reel starts and stops slightly after the previous one:
- **Start delay**: `reel_index * REEL_STOP_STAGGER`
- **Spin time**: `baseDuration + reel_index * REEL_STOP_STAGGER`
- **Extra symbols**: `baseExtra + reel_index * 5` (more scrolling for later reels)

### Turbo Mode

Multiplies all timings by `TURBO_SPEED_FACTOR` (0.4):
```javascript
if (turbo) {
    baseDuration *= Config.TURBO_SPEED_FACTOR;  // 300 → 120ms
    stagger *= Config.TURBO_SPEED_FACTOR;        // 200 → 80ms
    baseExtra = 8;  // fewer scroll symbols (vs 20 normal)
}
```

### Slam Stop (Instant Stop)

When user clicks STOP during spin:

1. Increment `_spinGeneration` to invalidate all stale callbacks
2. Clear all pending setTimeout timers
3. For each reel:
   - **Already stopped**: Clean up to static state
   - **Still spinning**: Bounce animation with stagger
4. Bounce: Build `[extra_top] + [target 3] + [extra_bottom]`, start offset, cubic-bezier bounce
5. After all bounces complete, clean up extra symbols

### Visual Continuity (Spin Start)

**Key Requirement**: When spin starts, the display should still show the previous result, then scroll away.

Implementation: Prepend `SlotGame.State.grid[r]` (current visible symbols) at the top of the reel strip before random extras and target symbols.

```
Strip layout: [current 3] [random N] [target 3]
                ↑                       ↑
          visible at start       visible at end
```

---

## 7. RNG & Weighted Random

### Weighted Symbol Selection

```javascript
pickSymbol: function() {
    var total = SlotGame.Config.TOTAL_WEIGHT; // 61
    var rand = Math.random() * total;
    var cumulative = 0;
    for (var i = 0; i < symbols.length; i++) {
        cumulative += symbols[i].weight;
        if (rand < cumulative) return symbols[i].id;
    }
    return symbols[symbols.length - 1].id;
}
```

**Probability per symbol**:
| Symbol | Weight | Probability |
|--------|--------|-------------|
| Wild | 2 | 3.28% |
| Scatter | 3 | 4.92% |
| Crown | 4 | 6.56% |
| Bell | 6 | 9.84% |
| Seven | 8 | 13.11% |
| Cherry | 10 | 16.39% |
| Lemon | 14 | 22.95% |
| Grape | 14 | 22.95% |

### Grid Generation

- 5 reels x 3 rows = 15 positions
- Each position selected independently via `pickSymbol()`
- Per-reel constraint: Wild/Scatter/Crown max 1 each per reel
- Retry loop with 50-attempt limit to prevent deadlock

### Reel Strip Generation (for animation)

```javascript
generateReelStrip: function(targetColumn, extraSymbols) {
    var strip = [];
    for (var i = 0; i < extraSymbols; i++) {
        strip.push(this.pickSymbol()); // random filler
    }
    for (var j = 0; j < targetColumn.length; j++) {
        strip.push(targetColumn[j]); // target at end
    }
    return strip;
}
```

---

## 8. Payline Evaluation Engine

### 20 Paylines

```
Line 0:  [1,1,1,1,1]  Middle row (straight)
Line 1:  [0,0,0,0,0]  Top row (straight)
Line 2:  [2,2,2,2,2]  Bottom row (straight)
Line 3:  [0,1,2,1,0]  V shape
Line 4:  [2,1,0,1,2]  Inverted V
Line 5:  [0,0,1,2,2]  Descending slope
...
Line 19: [0,2,0,2,0]  Wide zigzag
```

Each line is an array of 5 row indices: `paylines[lineIndex][reelIndex] = rowIndex`

### Evaluation Algorithm

```
For each payline (0-19):
  1. Collect 5 symbols along the line
  2. Find first non-Wild symbol = matchSymbol
  3. If all Wilds → matchSymbol = Wild
  4. If matchSymbol is Scatter → skip (scatter is position-independent)
  5. Count consecutive matches from left (Wild counts as match)
  6. If count >= 3 → win = pay[count] * betPerLine
```

### Wild Substitution

- Wild substitutes for **all symbols except Scatter**
- Leading wilds adopt the identity of the first non-wild symbol
- All-wild combo uses Wild's own pay table

### Scatter Evaluation

- Counted **separately** from paylines (position-independent)
- 3+ scatters anywhere on the grid trigger Free Spins
- Scatter rewards:
  - 3 scatters → 6 free spins
  - 4 scatters → 9 free spins
  - 5 scatters → 13 free spins

### Bonus Trigger

- 3+ **Crown** symbols on any single winning payline
- Triggers the Treasure Chest bonus game

---

## 9. Feature Systems

### Free Spins

**Trigger**: 3+ Scatter symbols anywhere on the grid

**Flow**:
1. Show Free Spins intro overlay (count + multiplier)
2. Player clicks "START"
3. HUD appears showing: remaining / total, total win
4. Auto-spin each free spin with delay
5. All wins multiplied by `FREE_SPIN_MULTIPLIER` (2x)
6. **Retrigger**: 3+ scatters during free spins → add more spins
7. When complete → show summary overlay with total winnings

**State tracked**:
- `freeSpinsRemaining` / `freeSpinsTotal`
- `freeSpinsWinnings`
- `inFreeSpins` flag

### Bonus Game (Treasure Chest)

**Trigger**: 3+ Crown symbols on a winning payline (not during free spins)

**Mechanics**:
- 12 treasure chests in a 4x3 grid
- Player starts with 3 picks
- Chest contents (shuffled randomly):
  - 7x Credit prizes (5x, 10x, 10x, 15x, 20x, 30x, 50x total bet)
  - 2x Extra Pick (+1)
  - 2x Collect (ends bonus immediately)
  - 1x Jackpot (wins the progressive jackpot)

**UI**: 3D flip animation (CSS perspective + rotateY)

### Event Priority Queue

When multiple events trigger on the same spin:
1. **Jackpot** (highest priority)
2. **Bonus Game**
3. **Free Spins**

Each is handled sequentially — after collecting one, the next pending event fires.

---

## 10. Jackpot System

### Progressive Pool

```
Pool starts at: JACKPOT_SEED (5000)
Each spin adds: totalBet * JACKPOT_CONTRIBUTION_RATE (10%)
```

### Win Conditions

1. **5 Wilds on middle row** (deterministic)
2. **Random chance** (per spin):
   ```
   baseChance = 1/50000
   adjustedChance = baseChance * min(totalBet/20, JACKPOT_MAX_BET_MULTIPLIER)
   ```
   Higher bets increase jackpot probability (capped at 5x)

### Display Ticker

- Uses `requestAnimationFrame` for smooth count-up animation
- Approaches target value with easing: `displayed += (target - displayed) * 0.05 + 0.1`

---

## 11. Audio System

### No Audio Files

All sounds are generated programmatically using **Web Audio API**:
- `OscillatorNode` for tones (sine, square, triangle waveforms)
- `BufferSource` with random data for noise/percussion
- `GainNode` with `exponentialRampToValueAtTime` for envelope

### Sound Effects

| Event | Technique |
|-------|-----------|
| Spin start | 5 descending square tones (rapid) |
| Reel stop | Low triangle tone + noise burst |
| Button click | Single 600Hz sine, short |
| Small win | C-E-G arpeggio (sine) |
| Big win | C-E-G-C6-G-C6 arpeggio (triangle) |
| Jackpot | 20 ascending tones + harmonics |
| Scatter hit | 4 ascending high tones |
| Free spin start | G-B-D-E-G ascending (triangle) |
| Bonus reveal | 800Hz → 1200Hz double tap |

### AudioContext Handling

- Created on page load (`init()`)
- Resumed on first user interaction (`ensureContext()`)
- Respects `SlotGame.State.soundEnabled` flag
- All audio calls wrapped in try-catch for graceful degradation

---

## 12. Animation System

### Win Line Drawing (Canvas)

- Dedicated `<canvas>` overlay on top of reel grid
- Resizes to match reel grid dimensions
- Uses `ctx.strokeStyle`, `shadowColor`, `shadowBlur` for glowing lines
- Circles drawn at each winning position
- **Cycling**: Shows one payline at a time, rotates every `WIN_LINE_CYCLE_DELAY` ms

### Symbol Highlights

- `.winning` class: Scale 1→1.15, brightness 1→1.4, infinite alternate animation
- `.dimmed` class: Opacity 0.3, grayscale 80% (non-winning symbols)
- `.scatter-hit` class: Scale+rotate sparkle animation (0.8s)

### Coin Particles

- Created dynamically as `<div>` elements with emoji (coins/sparkles)
- CSS `@keyframes coinFall`: translateY(0→400px), rotate(0→720deg), scale(1→0.5)
- Self-cleaning: removed from DOM after 3 seconds

---

## 13. UI & Controls

### Control Panel Layout

```
[−] BET/LINE [+]  |  LINES  |  TOTAL BET  |  (SPIN)  |  MAX BET  AUTO  TURBO
```

### Bet System

- **Bet Levels**: [1, 2, 3, 5, 10, 15, 20, 25, 50, 100]
- **Active Lines**: Fixed at 20 (all lines always active)
- **Total Bet**: betPerLine × 20
- Bet controls disabled during spin and free spins

### Auto Spin

- Toggles on/off (100 spins per session)
- Button shows "STOP" when active (with `.active` class)
- Continues through free spins automatically
- Respects turbo mode timing

### Interaction Methods

- **Click SPIN button**: Start spin / slam stop / skip wins
- **Click reel area**: Same as SPIN button
- **Spacebar**: Same as SPIN button
- **Anti-double-tap**: 500ms cooldown between IDLE actions

### Paytable

- Dynamically built from `Config.symbols` array
- Shows symbol image, name, and pay table
- Includes feature descriptions (Wild, Scatter, Bonus, Jackpot)
- Modal overlay with close button

---

## 14. State Management & Persistence

### Saved to localStorage

```javascript
{
    balance: number,
    betIndex: number,
    jackpotPool: number,
    soundEnabled: boolean,
    turboMode: boolean
}
```

### NOT Saved (reset on page load)

- `phase` (always starts IDLE)
- `grid` (regenerated)
- `winDetails`, `totalWin`
- Free spin state (session only)
- Bonus game state (session only)
- Auto spin state

### Save Triggers

- After every spin completion
- On bet change
- On turbo/sound toggle

### Load Validation

```javascript
// Balance must be non-negative number
if (typeof data.balance === 'number' && data.balance >= 0)
// Bet index must be in valid range
Math.max(0, Math.min(data.betIndex, BET_LEVELS.length - 1))
// Jackpot pool must be at least seed value
if (data.jackpotPool >= JACKPOT_SEED)
```

---

## 15. CSS Architecture

### CSS Variable System (main.css `:root`)

```css
--bg-primary: #1a0a2e;      /* Deep purple background */
--bg-secondary: #2d1b4e;    /* Game container background */
--bg-tertiary: #3d2a5e;     /* Info bar, controls */
--accent-gold: #ffd700;      /* Primary accent (gold) */
--accent-amber: #ff8c00;     /* Spin button gradient */
--reel-bg: #0d0d1a;          /* Dark reel background */
--reel-border: #ffd700;       /* Gold reel border */
--btn-gradient: linear-gradient(180deg, #ffd700, #ff8c00);
```

### File Responsibilities

| File | Purpose |
|------|---------|
| `main.css` | Root variables, reset, body, container, overlays, message |
| `reels.css` | Reel area, grid, viewport, strip, symbol, win states, canvas |
| `ui.css` | Controls, buttons, spin button states, HUD, bonus, paytable |
| `animations.css` | @keyframes, particle effects, transition helpers |
| `responsive.css` | All media queries for different screen sizes |

### Key CSS Techniques

- **Reel scrolling**: `transform: translateY()` with CSS transition
- **Symbol clipping**: `overflow: hidden` on `.reel-viewport`
- **Win line overlay**: Absolutely positioned `<canvas>`
- **Bonus chest flip**: CSS 3D `perspective` + `transform: rotateY(180deg)`
- **Spin button states**: BEM-like modifier classes (`spin-btn--stop`, `spin-btn--skip`)

---

## 16. Responsive Design

### Breakpoints

| Breakpoint | Target | Key Changes |
|-----------|--------|-------------|
| Default (>768px) | Desktop | 100px symbols, 90px spin button |
| ≤768px | Tablet | 80px symbols, 75px spin button |
| ≤480px | Mobile | vw-based symbols `(100vw-30px)/5`, flex reorder |
| ≤360px | Small Mobile | 55px symbols, 55px spin button |
| ≤400px height + landscape | Landscape | 60px symbols, compact layout |

### Mobile-Specific Techniques

```css
/* Viewport-width-based sizing (fills screen) */
.reel-viewport {
    width: calc((100vw - 30px) / 5);
    height: calc(((100vw - 30px) / 5) * 3);
}

/* Fix 100vh issue with mobile browser chrome */
min-height: 100dvh;
min-height: -webkit-fill-available;

/* Reorder flex items for mobile layout */
#jackpot-banner { order: 1; }
#info-bar { order: 2; }
#reel-area { order: 3; }
#free-spins-hud { order: 4; }  /* Moved between reels and controls */
#controls { order: 5; }
#bottom-bar { order: 6; }
```

### Symbol Size Detection

```javascript
// Reels.detectSymbolSize() — called on init and before each spin
this.symbolSize = viewport.clientHeight / Config.ROWS;
```

This ensures the scroll distance calculation is always correct regardless of screen size.

---

## 17. Design Decisions & Rationale

### Decision 1: Vanilla JS over Framework

**Chosen**: Plain JavaScript objects, no build tools
**Rationale**: Slot games are self-contained; no routing, no complex state trees. Object literals are debuggable, transparent, and fast. Future slot games can copy this structure directly.

### Decision 2: SVG over Emoji/PNG

**Chosen**: Hand-crafted SVG files with gradients and filters
**Rationale**:
- Emoji rendering varies across OS/browser (inconsistent look)
- SVG scales perfectly at any resolution (no pixelation)
- Self-contained (no CDN, no loading delays)
- Unified visual style (casino theme)

**Migration approach**:
- Added `img` property to symbol config
- Changed `createSymbolEl()` from `textContent = emoji` to `<img src=svg>`
- Updated paytable builder similarly
- CSS: removed `font-size` rules, added `.symbol img` with `object-fit: contain`

### Decision 3: CSS Transition for Reel Scrolling (vs requestAnimationFrame)

**Chosen**: CSS `transition: transform` with cubic-bezier easing
**Rationale**:
- GPU-accelerated (composited layer via `will-change: transform`)
- Built-in easing without manual curve math
- `transitionend` event for completion callback
- Cleaner than managing rAF loops per reel

**Trade-off**: Less control over mid-animation state (solved with slam stop technique)

### Decision 4: Web Audio API (vs Audio Files)

**Chosen**: Programmatic oscillator + noise generation
**Rationale**:
- Zero file downloads = instant loading
- No cross-origin issues
- Complete control over pitch, duration, envelope
- Easy to add new sounds without sourcing audio files

### Decision 5: 20 Fixed Lines (vs Adjustable)

**Chosen**: All 20 lines always active
**Rationale**: Simplifies UI and math. Modern slot games trend toward fixed lines. Reduces UI clutter (no line selector). Total bet = betPerLine × 20.

### Decision 6: Client-Side RNG (vs Server)

**Chosen**: Math.random() with weighted selection
**Rationale**: This is a demo/fun game, not real gambling. No server needed. Includes Monte Carlo RTP simulator for verification.

### Decision 7: Free Spins HUD Positioning on Mobile

**Chosen**: `position: static` with `order: 4` in flex container (between reels and controls)
**Rationale**: On mobile, `position: absolute` causes the HUD to overlap reels or go off-screen. Using flex order with static positioning places it naturally in the layout flow.

---

## 18. Issues Encountered & Fixes

### Issue 1: Spin Button Not Changing to STOP/SKIP

**Symptom**: Button stayed as "SPIN" during spinning and win display
**Root Cause**: Missing button state management for different phases
**Fix**: Added `updateSpinButton()` with phase-based text/style changes:
- SPINNING → "STOP" (red, `spin-btn--stop`)
- SHOWING_WINS → "SKIP" (dim gold, `spin-btn--skip`)
- IDLE → "SPIN" / "FREE" (gold gradient)

### Issue 2: Slam Stop Missing — No Way to Quick-Stop Reels

**Symptom**: Players had to wait for full spin animation to complete
**Fix**: Implemented `Reels.slamStop()`:
1. Increment `_spinGeneration` to invalidate stale callbacks
2. Clear all pending timers
3. Bounce animation for still-spinning reels
4. Skip already-stopped reels
5. Staggered landing (60ms between reels)

### Issue 3: Stale Callbacks After Slam Stop

**Symptom**: After slam stop, old `transitionend` or `setTimeout` callbacks still fired, causing double-evaluation or state corruption
**Fix**: `_spinGeneration` counter — incremented on each new spin and on slam stop. All callbacks check `gen !== self._spinGeneration` and bail out if stale.

### Issue 4: Free Spins HUD Values Not Updating

**Symptom**: HUD showed but values stayed at "0 / 0" and didn't change
**Root Cause**: During testing, `document.getElementById('fs-counter').textContent = '...'` was used, which **destroyed the inner `<span>` elements**. The `<span>` references (`fsRemaining`, `fsTotal`) became orphaned.
**Fix**: Page reload restored the DOM. Not a code bug — was caused by destructive testing. **Lesson**: Never use `textContent` on elements that contain child elements you need to reference.

### Issue 5: Symbols Appeared Random at Spin Start

**Symptom**: When spin started, all symbols immediately changed to random ones instead of showing the previous result
**Root Cause**: The reel strip was built with only `[random extras] + [target 3]`. Since `translateY` started at 0, random symbols were visible immediately.
**Fix**: Prepend `SlotGame.State.grid[r]` (current visible symbols) at the top of the strip:
```
Before: [random N] + [target 3]  ← random visible at start
After:  [current 3] + [random N] + [target 3]  ← previous grid visible at start
```

### Issue 6: targetY Calculation Wrong After Prepending Current Symbols

**Symptom**: After adding visual continuity fix, reels stopped 3 symbols too early (showing random symbols instead of target)
**Root Cause**: `totalHeight` calculation only used `reelStrip.length` but the DOM now had `currentColumn.length + reelStrip.length` symbols
**Fix**:
```javascript
// Before (wrong):
var totalHeight = reelStrip.length * symbolSize;
// After (correct):
var totalSymbols = (currentColumn ? currentColumn.length : 0) + reelStrip.length;
var totalHeight = totalSymbols * symbolSize;
```

### Issue 7: Duplicate Wild/Scatter/Crown Per Reel

**Symptom**: Sometimes 2-3 Wilds appeared on the same reel, making wins too frequent
**Fix**: Added per-reel tracking in `generateGrid()`:
```javascript
var usedLimited = {}; // per reel
do {
    sym = this.pickSymbol();
    attempts++;
} while (attempts < 50 && usedLimited[sym]);
```
The 50-attempt limit prevents infinite loops in edge cases.

### Issue 8: Auto Spin Not Stopping Properly

**Symptom**: Auto spin continued even after clicking "STOP" (auto button)
**Fix**: When auto spin count reaches 0:
1. Set `autoSpinActive = false`
2. Remove `.active` class from button
3. Reset button text to "AUTO"
4. Guard check `if (state.autoSpinActive)` before each auto-spin trigger

### Issue 9: Mobile 100vh Not Accounting for Browser Chrome

**Symptom**: On mobile browsers, the game extended behind the address bar/navigation bar
**Fix**: Used modern CSS units:
```css
min-height: 100dvh;                    /* Dynamic viewport height */
min-height: -webkit-fill-available;     /* Safari fallback */
```
Combined with `overflow: auto` on `html, body` and `height: auto` on `#game-container`.

### Issue 10: Win Display Timer Causing Double-Advance

**Symptom**: Sometimes `onWinsShown()` was called twice — once by the timer and once by SKIP click
**Fix**: Store timer reference in `_showWinsTimer`, clear it at the start of `onWinsShown()`:
```javascript
if (this._showWinsTimer) {
    clearTimeout(this._showWinsTimer);
    this._showWinsTimer = null;
}
```
Plus guard: `if (state.phase !== 'SHOWING_WINS' && state.phase !== 'EVALUATING') return;`

---

## 19. RTP Simulation

### Built-in Monte Carlo Simulator

Run from browser console:
```javascript
SlotGame.RNG.simulateRTP(1000000); // 1M spins
```

### Output Format

```
=== RTP Simulation Results ===
Iterations: 1,000,000
Total Wagered: 20,000,000
---
Base Game RTP:  56% (target: 56%)
Free Spins RTP: 30% (target: 30%)
Jackpot RTP:    10% (target: 10%)
---
Overall RTP:    96% (target: 96%)
---
Free Spins Triggered: XXX (X.XXX%)
```

### RTP Tuning Levers

| Parameter | Effect | Location |
|-----------|--------|----------|
| Symbol weights | Base game frequency | `Config.symbols[].weight` |
| Pay tables | Base game RTP | `Config.symbols[].pay` |
| Scatter weight + free spin count | Free spins RTP | `Config.symbols[1].weight`, `Config.scatterFreeSpins` |
| Free spin multiplier | Free spins RTP | `Config.FREE_SPIN_MULTIPLIER` |
| Jackpot contribution rate | Jackpot RTP | `Config.JACKPOT_CONTRIBUTION_RATE` |
| Jackpot random chance | Jackpot RTP | `Config.JACKPOT_RANDOM_BASE_CHANCE` |

---

## 20. Testing Checklist

### Core Gameplay

- [ ] SPIN: Click button, click reel area, press Spacebar
- [ ] STOP (slam stop): Click during SPINNING phase
- [ ] SKIP: Click during SHOWING_WINS phase
- [ ] Bet +/− and MAX BET
- [ ] Balance deduction on spin
- [ ] Win calculation (check against pay table)
- [ ] Wild substitution (left-to-right)
- [ ] Scatter count (position-independent)

### Features

- [ ] Free Spins trigger (3+ scatters)
- [ ] Free Spins intro overlay
- [ ] Free Spins HUD (remaining / total, total win)
- [ ] Free Spins multiplier applied
- [ ] Free Spins retrigger
- [ ] Free Spins summary
- [ ] Bonus Game trigger (3+ Crowns on payline)
- [ ] Bonus chest picks, extra picks, collect, jackpot
- [ ] Jackpot trigger (5 wilds middle row)
- [ ] Jackpot random trigger (at high bets)

### UI / Controls

- [ ] SPIN button states (SPIN/STOP/SKIP/FREE/disabled)
- [ ] Auto Spin start/stop
- [ ] Turbo mode toggle
- [ ] Sound on/off
- [ ] Paytable open/close
- [ ] Insufficient balance message
- [ ] Win line cycling + symbol highlighting
- [ ] Big win celebration (20x+ total bet)

### Visual / Responsive

- [ ] Desktop (1280x800): Full layout
- [ ] Tablet (768x1024): Scaled symbols
- [ ] Mobile (375x812): vw-based sizing, flex reorder
- [ ] Small Mobile (360x640): Compact layout
- [ ] Landscape (812x375): Short viewport handling
- [ ] SVG symbols render correctly at all sizes
- [ ] Spin animation smooth (no jank)
- [ ] Slam stop bounce animation smooth

### State Persistence

- [ ] Balance saved after spin
- [ ] Bet level persisted across refresh
- [ ] Jackpot pool persisted
- [ ] Sound/Turbo settings persisted
- [ ] Zero balance → reset to starting balance

---

## 21. Future Improvements

### Potential Enhancements

1. **Gamble Feature**: Double-or-nothing after each win (red/black card game)
2. **Multiple Jackpots**: Mini / Minor / Major / Grand tiers
3. **Adjustable Paylines**: Let player choose 1-20 lines
4. **Expanding Wilds**: Wild expands to fill entire reel during free spins
5. **Cascading Reels**: Winning symbols disappear, new ones fall in
6. **Multiplier Trail**: Progressive multiplier during free spins
7. **Sound Themes**: Background music + more detailed SFX
8. **Achievements System**: Unlock badges for milestones
9. **Server-Side RNG**: For real-money implementation
10. **Accessibility**: Screen reader support, high contrast mode

### Performance Considerations

- Use `requestAnimationFrame` instead of CSS transitions for more control
- Implement object pooling for symbol DOM elements (reduce GC)
- Use `OffscreenCanvas` for win line drawing on web workers
- Lazy-load SVGs as data URIs for instant availability

---

## Quick Start: New Slot Game

To create a new slot game based on this architecture:

1. **Copy the file structure**
2. **Modify `config.js`**:
   - Change symbol definitions (names, images, weights, pay tables)
   - Adjust paylines (or keep 20)
   - Tune RTP parameters
3. **Create new SVG symbols** (100x100 viewBox)
4. **Run RTP simulator** to verify target RTP
5. **Adjust CSS variables** in `main.css` for new theme colors
6. **Test across all breakpoints** using the checklist above

The modular architecture allows swapping out individual systems (e.g., different bonus game, different animation style) without affecting the core game loop.
