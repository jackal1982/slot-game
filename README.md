# Fortune Slots

[繁體中文](README.zh-TW.md) | English

A fully-featured slot game platform with a lobby and 5-reel video slot machine, built with pure HTML5, CSS3, and vanilla JavaScript. No frameworks, no dependencies, no build step required.

## Play Now

**https://jackal1982.github.io/slot-game/**

## Features

### Game Platform
- **SPA Architecture** - Single `index.html` with hash routing (`#lobby` / `#game/slot`)
- **Game Lobby** - Card-based game selection with themed backgrounds
- **Platform-Level Balance** - Shared balance across all games, persisted via `localStorage`
- **Seamless Transitions** - CSS class-based view switching between lobby and games
- **Legacy Migration** - Automatic migration from old single-game state format

### Core Gameplay
- **5 Reels x 3 Rows** with 20 fixed paylines (all active)
- **8 SVG Symbols** with reel strip-based random generation
- **Wild Symbol** - Substitutes for all symbols except Scatter
- **Left-to-right** payline evaluation (3+ consecutive matches)
- **Adjustable Bet** - Multiple bet levels per line
- **Target RTP: 96%** (Base Game ~56.5% + Free Spins ~29.5% + Jackpot ~10.2%)

### Special Features
- **Free Spins** - 3+ Scatter symbols trigger free spins (3=8, 4=12, 5=18 spins) with 3x multiplier. Can retrigger during free spins
- **Bonus Game** - 3 Crown symbols on a payline trigger a treasure chest pick game (12 chests, pick 3)
- **Progressive Jackpot** - Seed 5,000 credits, grows with 10% of every bet. Base trigger rate: 1/50,000
- **Scatter/Crown Highlight** - Cyan pulsing glow on Scatter, gold pulsing glow on Crown when features trigger, with 2-second delay before overlay appears

### Audio System
- **Programmatic BGM** - 4-layer procedural music (pad / bass / arpeggio / rhythm), no audio files
  - Normal Mode: 100 BPM, Cmaj7→Am7→Fmaj7→G7
  - Free Spins Mode: 130 BPM, Dm→Bb→Gm→A (D minor)
  - Instant mode switching with 0.15s crossfade
- **Independent Controls** - MUSIC and SOUND toggles are separate
- **Web Audio API** - All sound effects generated programmatically
- **Splash Screen** - AudioContext unlock for direct URL access; skipped when entering from lobby

### Player Controls
- **SPIN / STOP / SKIP** - Context-aware button that adapts to game phase
- **Slam Stop** - Instantly stop spinning reels with staggered bounce animation
- **Turbo Mode** - 2.5x faster spin animations
- **Auto Spin** - Automatic 100-spin sessions
- **Keyboard** - Spacebar to spin/stop/skip
- **Tap to Spin** - Click anywhere on the reel area
- **Back to Lobby** - Available only during IDLE state (disabled during spins/features)

### Technical Highlights
- **Zero Dependencies** - Pure HTML5 + CSS3 + Vanilla JS
- **SVG Graphics** - Vector symbols scale perfectly at any resolution
- **CSS Transitions** - GPU-accelerated reel scrolling via `transform: translateY()`
- **Two-Phase Bounce Animation** - Phase 1 overshoot + Phase 2 bounce-back for natural reel stop
- **Spin Generation Counter** - Prevents stale callbacks on slam stop
- **Canvas Overlay** - Animated win line drawing with glow effects
- **localStorage** - Platform state (balance, settings, game data) persists across sessions
- **Responsive Design** - Desktop (>768px), tablet (≤768px), mobile (≤480px), small mobile (≤360px)
- **Light Blue Theme** - Casual-friendly color scheme (`#E8F4FF` primary, `#0099FF` accent)

## Symbols & Pay Table

| Symbol | x3 | x4 | x5 | Special |
|--------|----|----|-----|---------|
| Wild | 40 | 100 | 300 | Substitutes all (except Scatter) |
| Scatter | - | - | - | 3/4/5 = 8/12/18 Free Spins (3x) |
| Crown | 25 | 70 | 200 | 3 on payline = Bonus Game |
| Bell | 15 | 50 | 125 | - |
| Seven | 12 | 35 | 100 | - |
| Cherry | 8 | 25 | 75 | - |
| Lemon | 5 | 15 | 50 | - |
| Grape | 3 | 8 | 40 | - |

> Pay values are multiplied by the bet per line.

## Project Structure

```
slot-game/
├── index.html              # Single-page HTML (lobby + game views)
├── GAME_SPEC_TEMPLATE.md   # Game spec template v2.0 for new games
├── tools/
│   ├── rtp-verify-fortune-slots.js  # Node.js Monte Carlo RTP verification for Fortune Slots (5M spins)
│   └── rtp-verify-dragon-wolf.js    # Node.js Monte Carlo RTP verification for Dragon Wolf (10M spins)
├── css/
│   ├── main.css            # Root variables, layout, overlays
│   ├── lobby.css           # Lobby styles, game cards, view transitions
│   ├── reels.css           # Reel grid, symbols, cloud bubble background
│   ├── ui.css              # Controls, buttons, paytable, HUD
│   ├── animations.css      # Keyframes, particles, transitions
│   └── responsive.css      # Media queries for all breakpoints
├── js/
│   ├── config.js           # Symbols, payouts, weights, reel strips, paylines
│   ├── platform.js         # Platform state: balance API, game lifecycle, persistence
│   ├── router.js           # SPA hash routing (#lobby / #game/slot), view transitions
│   ├── lobby.js            # Lobby UI: game cards, directory, interaction events
│   ├── state.js            # Game state + platform sync (syncFromPlatform/syncToPlatform)
│   ├── rng.js              # Strip-based random generation + built-in RTP simulator
│   ├── audio.js            # Web Audio API: sound effects + procedural BGM (dual mode)
│   ├── paylines.js         # Win evaluation engine (Wild substitution, L-to-R matching)
│   ├── features.js         # Free Spins + Bonus Game logic
│   ├── jackpot.js          # Progressive jackpot pool
│   ├── reels.js            # Reel rendering + spin animation (two-phase bounce)
│   ├── animations.js       # Win lines, particles, Scatter/Crown highlights
│   ├── ui.js               # DOM events, display updates, paytable, back button
│   └── main.js             # Bootstrap, game loop, cleanup, returnToLobby
└── images/                 # SVG assets
    ├── wild.svg
    ├── scatter.svg
    ├── crown.svg
    ├── bell.svg
    ├── seven.svg
    ├── cherry.svg
    ├── lemon.svg
    ├── grape.svg
    ├── reel-bg-fortune.svg # Reel area background
    └── slot-icon.svg       # Game card icon
```

### JS Load Order

```
config → platform → router → state → rng → audio → paylines → features → jackpot → reels → animations → ui → lobby → main
```

## Run Locally

No build step needed. Just serve the files with any HTTP server:

```bash
# Python
python -m http.server 8080

# Node.js
npx serve .

# Or simply open index.html in a browser
```

## RTP Verification

The project includes both in-browser and standalone RTP verification:

```bash
# Fortune Slots RTP verification (5 million spins)
node tools/rtp-verify-fortune-slots.js

# Dragon Wolf Legend RTP verification (10 million spins)
node tools/rtp-verify-dragon-wolf.js
```

```javascript
// In-browser (open developer console)
SlotGame.RNG.simulateRTP(1000000);
```

Target RTP: ~96% (Base Game ~56.5% + Free Spins ~29.5% + Jackpot ~10.2%)

## Architecture

```
┌─────────────────────────────────────────┐
│              Platform Layer             │
│  platform.js (balance, lifecycle)       │
│  router.js (hash routing, view switch)  │
│  lobby.js (game directory, cards)       │
├─────────────────────────────────────────┤
│               Game Layer                │
│  state.js ←→ platform sync             │
│  main.js (game loop orchestration)      │
│  config / rng / paylines / features     │
│  reels / animations / audio / ui        │
│  jackpot                                │
└─────────────────────────────────────────┘
Global namespace: window.SlotGame
State machine: IDLE → SPINNING → EVALUATING → SHOWING_WINS → IDLE
              (+ FEATURE_PENDING for highlight delays)
Persistence: platform_state localStorage key
```

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome for Android)

## License

This project is for educational and entertainment purposes only.
Not intended for real-money gambling.
