/**
 * SlotGame Configuration
 * All game constants, symbol definitions, paylines, and tunable parameters.
 */
var SlotGame = window.SlotGame || {};

SlotGame.Config = {
    // --- Game Dimensions ---
    REELS: 5,
    ROWS: 3,
    TOTAL_POSITIONS: 15, // 5 * 3

    // --- Symbol IDs ---
    WILD_ID: 0,
    SCATTER_ID: 1,
    CROWN_ID: 2,

    // --- Symbol Definitions ---
    symbols: [
        { id: 0, name: 'Wild',    img: 'images/wild.svg',    weight: 2,  pay: { 3: 31, 4: 118, 5: 435 } },
        { id: 1, name: 'Scatter', img: 'images/scatter.svg',  weight: 3,  pay: null }, // Scatter pays via free spins
        { id: 2, name: 'Crown',   img: 'images/crown.svg',    weight: 4,  pay: { 3: 24, 4: 80, 5: 248 } },
        { id: 3, name: 'Bell',    img: 'images/bell.svg',     weight: 6,  pay: { 3: 15, 4: 48, 5: 150 } },
        { id: 4, name: 'Seven',   img: 'images/seven.svg',    weight: 8,  pay: { 3: 12, 4: 40, 5: 97 } },
        { id: 5, name: 'Cherry',  img: 'images/cherry.svg',   weight: 10, pay: { 3: 8,  4: 24, 5: 75 } },
        { id: 6, name: 'Lemon',   img: 'images/lemon.svg',    weight: 14, pay: { 3: 5,  4: 15, 5: 48 } },
        { id: 7, name: 'Grape',   img: 'images/grape.svg',    weight: 14, pay: { 3: 3,  4: 8,  5: 40 } },
    ],

    // Total weight per reel position
    get TOTAL_WEIGHT() {
        return this.symbols.reduce(function(sum, s) { return sum + s.weight; }, 0);
    },

    // --- Scatter Payout (free spins awarded) ---
    scatterFreeSpins: {
        3: 6,
        4: 9,
        5: 13,
    },

    // --- Free Spins ---
    FREE_SPIN_MULTIPLIER: 2,

    // --- Paylines (20 lines) ---
    // Each payline is an array of 5 row indices (0=top, 1=middle, 2=bottom)
    // paylines[i][reel] = row index
    paylines: [
        [1, 1, 1, 1, 1], // 0: Middle row
        [0, 0, 0, 0, 0], // 1: Top row
        [2, 2, 2, 2, 2], // 2: Bottom row
        [0, 1, 2, 1, 0], // 3: V shape
        [2, 1, 0, 1, 2], // 4: Inverted V
        [0, 0, 1, 2, 2], // 5: Descending slope
        [2, 2, 1, 0, 0], // 6: Ascending slope
        [1, 0, 0, 0, 1], // 7: Top dip
        [1, 2, 2, 2, 1], // 8: Bottom dip
        [0, 1, 0, 1, 0], // 9: Zigzag up
        [2, 1, 2, 1, 2], // 10: Zigzag down
        [1, 0, 1, 0, 1], // 11: Zigzag mid-up
        [1, 2, 1, 2, 1], // 12: Zigzag mid-down
        [0, 1, 1, 1, 0], // 13: Shallow V
        [2, 1, 1, 1, 2], // 14: Shallow inverted V
        [0, 0, 1, 0, 0], // 15: Top with mid dip
        [2, 2, 1, 2, 2], // 16: Bottom with mid bump
        [1, 0, 1, 2, 1], // 17: Wave
        [1, 2, 1, 0, 1], // 18: Inverted wave
        [0, 2, 0, 2, 0], // 19: Wide zigzag
    ],

    // Payline colors for win line drawing
    paylineColors: [
        '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF',
        '#00FFFF', '#FF8800', '#88FF00', '#0088FF', '#FF0088',
        '#FF4444', '#44FF44', '#4444FF', '#FFAA00', '#AA00FF',
        '#00FFAA', '#FF6600', '#6600FF', '#00FF66', '#FF0066',
    ],

    // --- Bet Configuration ---
    BET_LEVELS: [1, 2, 3, 5, 10, 15, 20, 25, 50, 100],
    DEFAULT_BET_INDEX: 0,
    ACTIVE_LINES: 20, // All 20 lines always active

    // --- Jackpot ---
    JACKPOT_SEED: 5000,
    JACKPOT_CONTRIBUTION_RATE: 0.10, // 10% of total bet
    JACKPOT_RANDOM_BASE_CHANCE: 1 / 50000, // Base chance per spin
    JACKPOT_MAX_BET_MULTIPLIER: 5, // Cap for bet-based probability boost

    // --- Starting Balance ---
    STARTING_BALANCE: 10000,

    // --- Bonus Game ---
    BONUS_TRIGGER_COUNT: 3, // 3 Crowns on a payline
    BONUS_STARTING_PICKS: 3,
    BONUS_CHEST_COUNT: 12,

    // --- Animation Timing ---
    REEL_SPIN_DURATION: 300,   // ms per reel base
    REEL_STOP_STAGGER: 200,    // ms between each reel stopping
    TURBO_SPEED_FACTOR: 0.4,   // Turbo mode multiplier
    WIN_LINE_CYCLE_DELAY: 1500, // ms per win line display
};
