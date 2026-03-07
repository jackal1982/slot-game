# Fortune Slots

[繁體中文](README.zh-TW.md) | English

A fully-featured 5-reel, 3-row, 20-payline video slot machine built with pure HTML5, CSS3, and vanilla JavaScript. No frameworks, no dependencies, no build step required.

## Play Now

**https://jackal1982.github.io/slot-game/**

## Features

### Core Gameplay
- **5 Reels x 3 Rows** with 20 fixed paylines
- **8 SVG Symbols** with weighted random generation
- **Wild Symbol** - Substitutes for all symbols except Scatter
- **Left-to-right** payline evaluation (3+ consecutive matches)
- **Adjustable Bet** - 10 bet levels (1 to 100 per line)

### Special Features
- **Free Spins** - 3+ Scatter symbols trigger 6-13 free spins with 2x multiplier. Can retrigger during free spins
- **Bonus Game** - 3+ Crown symbols on a payline trigger a treasure chest pick game with credit prizes, extra picks, and jackpot chance
- **Progressive Jackpot** - Grows with 10% of every bet. Win by landing 5 Wilds on the middle row

### Player Controls
- **SPIN / STOP / SKIP** - Context-aware button that adapts to game phase
- **Slam Stop** - Instantly stop spinning reels with bounce animation
- **Turbo Mode** - 2.5x faster spin animations
- **Auto Spin** - Automatic 100-spin sessions
- **Keyboard** - Spacebar to spin/stop/skip
- **Tap to Spin** - Click anywhere on the reel area

### Technical Highlights
- **Zero Dependencies** - Pure HTML5 + CSS3 + Vanilla JS
- **SVG Graphics** - Vector symbols scale perfectly at any resolution
- **CSS Transitions** - GPU-accelerated reel scrolling via `transform: translateY()`
- **Web Audio API** - All sound effects generated programmatically (no audio files)
- **Canvas Overlay** - Animated win line drawing with glow effects
- **localStorage** - Balance, settings, and jackpot pool persist across sessions
- **Responsive Design** - Desktop, tablet, mobile, and landscape orientations

## Symbols & Pay Table

| Symbol | x3 | x4 | x5 | Special |
|--------|----|----|-----|---------|
| Wild | 31 | 118 | 435 | Substitutes all (except Scatter) |
| Scatter | - | - | - | 3/4/5 = 6/9/13 Free Spins |
| Crown | 24 | 80 | 248 | 3+ on payline = Bonus Game |
| Bell | 15 | 48 | 150 | - |
| Seven | 12 | 40 | 97 | - |
| Cherry | 8 | 24 | 75 | - |
| Lemon | 5 | 15 | 48 | - |
| Grape | 3 | 8 | 40 | - |

> Pay values are multiplied by the bet per line.

## Project Structure

```
slot-game/
├── index.html              # Single-page HTML
├── css/
│   ├── main.css            # Root variables, layout, overlays
│   ├── reels.css           # Reel grid, symbols, win states
│   ├── ui.css              # Controls, buttons, paytable, HUD
│   ├── animations.css      # Keyframes, particles, transitions
│   └── responsive.css      # Media queries for all breakpoints
├── js/
│   ├── config.js           # Constants, symbols, paylines, tuning
│   ├── state.js            # Game state + localStorage persistence
│   ├── rng.js              # Weighted random + RTP simulator
│   ├── audio.js            # Web Audio API sound effects
│   ├── paylines.js         # Win evaluation engine
│   ├── features.js         # Free Spins + Bonus Game logic
│   ├── jackpot.js          # Progressive jackpot pool
│   ├── reels.js            # Reel rendering + spin animation
│   ├── animations.js       # Win lines, particles, celebrations
│   ├── ui.js               # DOM events + display updates
│   └── main.js             # Bootstrap + game loop orchestration
└── images/                 # 8 SVG symbol graphics
    ├── wild.svg
    ├── scatter.svg
    ├── crown.svg
    ├── bell.svg
    ├── seven.svg
    ├── cherry.svg
    ├── lemon.svg
    └── grape.svg
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

The game includes a built-in Monte Carlo RTP simulator. Open the browser console and run:

```javascript
SlotGame.RNG.simulateRTP(1000000); // Simulate 1 million spins
```

Target RTP: ~96% (Base Game ~56% + Free Spins ~30% + Jackpot ~10%)

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome for Android)

## License

This project is for educational and entertainment purposes only.
Not intended for real-money gambling.
