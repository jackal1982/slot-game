# Slot Game Platform

[繁體中文](README.zh-TW.md) | English

A multi-game slot machine platform with lobby, built with pure HTML5, CSS3, and vanilla JavaScript. No frameworks, no dependencies, no build step required.

## Play Now

**https://jackal1982.github.io/slot-game/**

---

## Games

### 🎰 Fortune Slots

Classic 5-reel, 20-payline video slot with Free Spins, Bonus Game, and Progressive Jackpot.

- **5 Reels × 3 Rows** | 20 Fixed Paylines | Target RTP: 96%
- Route: `#game/slot`

| Symbol | x3 | x4 | x5 | Special |
|--------|----|----|-----|---------|
| Wild | 40 | 100 | 300 | Substitutes all (except Scatter) |
| Scatter | - | - | - | 3/4/5 = 8/12/18 Free Spins (3x multiplier) |
| Crown | 25 | 70 | 200 | 3 on payline = Bonus Game (pick 3 of 12 chests) |
| Bell | 15 | 50 | 125 | - |
| Seven | 12 | 35 | 100 | - |
| Cherry | 8 | 25 | 75 | - |
| Lemon | 5 | 15 | 50 | - |
| Grape | 3 | 8 | 40 | - |

> Pay values × bet per line = actual payout.

**Special Features**: Free Spins (3x multiplier, retriggerable) · Bonus Pick Game · Progressive Jackpot (seed 5,000, 1/50,000 base rate)

---

### 🐉 Legend of Dragon & Wolf（黑白龍狼傳）

Eastern martial arts themed 1024-Ways video slot. Free Spins feature a Random Wilds mechanic triggered by M1 (黑白郎君).

- **5 Reels × 4 Rows** | 1024 Ways | Target RTP: 96%
- Route: `#game/dragon_wolf`

**Base Game Pay Table** (per-way multiplier × bet):

| Symbol | Description | x3 | x4 | x5 |
|--------|-------------|-----|-----|-----|
| M2 | 黑龍 | 0.16 | 0.32 | 0.70 |
| M3 | 白狼 | 0.10 | 0.29 | 0.60 |
| M4 | 憶無心 | 0.10 | 0.13 | 0.35 |
| A1 | A | 0.06 | 0.06 | 0.16 |
| A2 | K | 0.06 | 0.06 | 0.13 |
| A3 | Q | 0.06 | 0.06 | 0.13 |
| A4 | J | 0.05 | 0.05 | 0.10 |

**Free Game Pay Table** (per-way multiplier × bet):

| Symbol | Description | x3 | x4 | x5 |
|--------|-------------|-----|-----|-----|
| M1 | 黑白郎君 | 0.07 | 0.20 | 0.35 |
| M4 | 憶無心 | 0.03 | 0.07 | 0.13 |
| A1 | A | 0.01 | 0.03 | 0.07 |
| A2 | K | 0.01 | 0.03 | 0.04 |
| A3 | Q | 0.01 | 0.03 | 0.04 |
| A4 | J | 0.01 | 0.01 | 0.03 |

**Special Features**: Free Spins (10 spins, retriggerable up to 50) · Random Wilds (M1 triggers 2~16 extra Wilds on reels 2~5) · MP3 BGM with qigong SFX tier system

---

## Platform Features

- **SPA Architecture** — Single `index.html` with hash routing (`#lobby` / `#game/slot` / `#game/dragon_wolf`)
- **Game Lobby** — Card-based game selection with themed backgrounds
- **Platform-Level Balance** — Shared balance across all games, persisted via `localStorage`
- **Seamless Transitions** — CSS class-based view switching between lobby and games
- **Splash Screen** — AudioContext unlock for direct URL access; skipped when entering from lobby
- **Legacy Migration** — Automatic migration from old single-game state format

---

## Technical Highlights

- **Zero Dependencies** — Pure HTML5 + CSS3 + Vanilla JS, no frameworks required
- **SVG Graphics** — Vector symbols scale perfectly at any resolution
- **Reel Strip RNG** — Strip-based random generation for accurate RTP targeting
- **Two-Phase Bounce Animation** — Phase 1 overshoot + Phase 2 bounce-back for natural reel stop
- **Spin Generation Counter** — Prevents stale callbacks on slam stop
- **Web Audio API** — Programmatic BGM (Fortune Slots) + MP3 buffer preloading (Dragon Wolf)
- **localStorage** — Platform state (balance, settings, per-game data) persists across sessions
- **Responsive Design** — Desktop (>768px), tablet (≤768px), mobile (≤480px), small mobile (≤360px)
- **iOS Compatibility** — `touch-action: manipulation` on all overlays prevents double-tap zoom; `orientationchange` reflow handler fixes iOS viewport residue

---

## Project Structure

```
slot-game/
├── index.html                  # Single-page HTML (lobby + all game views)
├── css/
│   ├── main.css                # Root variables, layout, overlays
│   ├── lobby.css               # Lobby styles, game cards, view transitions
│   ├── reels.css               # Reel grid, symbols, cloud bubble background
│   ├── dragon_wolf.css         # Dragon Wolf Legend styles (5×4 grid, dark theme)
│   ├── ui.css                  # Controls, buttons, paytable, HUD
│   ├── animations.css          # Keyframes, particles, transitions
│   └── responsive.css          # Media queries for all breakpoints
├── js/
│   ├── platform.js             # ⭐ Platform state: balance API, lifecycle, persistence
│   ├── router.js               # SPA hash routing, view transitions
│   ├── lobby.js                # Lobby UI: game cards, directory, interaction
│   ├── config.js               # Fortune Slots: symbols, payouts, reel strips, paylines
│   ├── state.js                # Fortune Slots: game state + platform sync
│   ├── rng.js                  # Fortune Slots: strip-based RNG + RTP simulator
│   ├── audio.js                # Fortune Slots: procedural Web Audio BGM + SFX
│   ├── paylines.js             # Fortune Slots: win evaluation engine
│   ├── features.js             # Fortune Slots: Free Spins + Bonus Game
│   ├── jackpot.js              # Fortune Slots: progressive jackpot pool
│   ├── reels.js                # Fortune Slots: reel rendering + spin animation
│   ├── animations.js           # Fortune Slots: win lines, particles, highlights
│   ├── ui.js                   # Fortune Slots: DOM events, paytable, back button
│   ├── main.js                 # Fortune Slots: bootstrap, game loop, cleanup
│   └── dragon_wolf/            # ⭐ Dragon Wolf Legend (window.DragonWolf namespace)
│       ├── dw-config.js        # Symbols, payouts, reel strips (5×4), 1024-Ways config
│       ├── dw-state.js         # Game state management
│       ├── dw-rng.js           # Strip-based RNG (SC/WD retry logic)
│       ├── dw-audio.js         # Web Audio API: MP3 BGM + SFX (qigong tier system)
│       ├── dw-payways.js       # 1024-Ways win evaluation
│       ├── dw-features.js      # Free Spins + Random Wilds logic
│       ├── dw-reels.js         # Reel rendering + spin animation
│       ├── dw-animations.js    # Visual effects, FS transition, qigong animation
│       ├── dw-ui.js            # DOM events, paytable
│       └── dw-main.js          # Bootstrap, game loop
├── images/
│   ├── (Fortune Slots SVGs)    # wild, scatter, crown, bell, seven, cherry, lemon, grape
│   ├── reel-bg-fortune.svg     # Fortune Slots reel background
│   ├── slot-icon.svg           # Fortune Slots lobby card icon
│   └── dragon_wolf/            # Dragon Wolf SVG symbols (11 files)
│       └── dragon, wolf, tiger, phoenix, koi, turtle, coin, sword, jade, scatter, wild
├── audio/
│   └── dragon_wolf/            # Dragon Wolf MP3 audio files
│       ├── dw-bgm-normal.mp3   # Base Game BGM
│       ├── dw-bgm-free.mp3     # Free Game BGM
│       ├── dw-laugh.mp3        # 黑白郎君 laugh SFX
│       ├── free-bigwin.mp3     # Big win fanfare
│       ├── qigong-1.mp3        # Qigong SFX Tier 1 (2~4 wilds, 2s)
│       ├── qigong-2.mp3        # Qigong SFX Tier 2 (5~8 wilds, 4s)
│       └── qigong-3.mp3        # Qigong SFX Tier 3 (9+ wilds, 7s)
└── tools/
    ├── rtp-verify-fortune-slots.js  # Node.js Monte Carlo RTP verification (5M spins)
    └── rtp-verify-dragon-wolf.js    # Node.js Monte Carlo RTP verification (10M spins)
```

### JS Load Order

**Fortune Slots**:
```
config → platform → router → state → rng → audio → paylines → features → jackpot → reels → animations → ui → lobby → main
```

**Dragon Wolf Legend**:
```
dw-config → dw-state → dw-rng → dw-audio → dw-payways → dw-features → dw-reels → dw-animations → dw-ui → dw-main
```

---

## RTP Verification

```bash
# Fortune Slots (5 million spins)
node tools/rtp-verify-fortune-slots.js

# Dragon Wolf Legend (10 million spins)
node tools/rtp-verify-dragon-wolf.js
```

Target RTP: ~96% for both games.

---

## Run Locally

No build step needed. Just serve with any HTTP server:

```bash
# Python
python -m http.server 8080

# Node.js
npx serve .
```

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                 Platform Layer                  │
│  platform.js  (balance API, game lifecycle)     │
│  router.js    (hash routing, view switching)    │
│  lobby.js     (game directory, card UI)         │
├──────────────────────┬──────────────────────────┤
│   Fortune Slots      │   Dragon Wolf Legend     │
│   window.SlotGame    │   window.DragonWolf      │
│   5×3, 20 paylines   │   5×4, 1024 Ways         │
│   config/state/rng…  │   dw-config/state/rng…   │
└──────────────────────┴──────────────────────────┘
Persistence: platform_state localStorage key
State machine: IDLE → SPINNING → EVALUATING → SHOWING_WINS → IDLE
               (+ FEATURE_PENDING for highlight delays)
```

---

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome for Android)

## License

This project is for educational and entertainment purposes only.
Not intended for real-money gambling.
