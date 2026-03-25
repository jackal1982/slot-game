/**
 * Dragon Wolf (黑白龍狼傳) Configuration
 * 符號定義、賠率表、Reel Strip 設定、下注系統
 */
var DragonWolf = window.DragonWolf || {};

DragonWolf.Config = {
    REELS: 5,
    ROWS:  4,

    SCATTER_ID: 'SC',
    WILD_ID:    'WD',
    M1_ID:      'M1',

    // 符號圖檔路徑
    SYMBOL_IMGS: {
        SC: 'images/dragon_wolf/sc.svg',
        WD: 'images/dragon_wolf/wd.svg',
        M1: 'images/dragon_wolf/m1.svg',
        M2: 'images/dragon_wolf/m2.svg',
        M3: 'images/dragon_wolf/m3.svg',
        M4: 'images/dragon_wolf/m4.svg',
        A1: 'images/dragon_wolf/a1.svg',
        A2: 'images/dragon_wolf/a2.svg',
        A3: 'images/dragon_wolf/a3.svg',
        A4: 'images/dragon_wolf/a4.svg'
    },

    SYMBOL_NAMES: {
        SC: '幽靈馬車',
        WD: '太極',
        M1: '黑白郎君',
        M2: '黑龍',
        M3: '白狼',
        M4: '憶無心',
        A1: 'A',
        A2: 'K',
        A3: 'Q',
        A4: 'J'
    },

    // Base Game 賠率表（per-way 倍率 × bet）
    BASE_PAY: {
        M2: { 3: 0.10, 4: 0.20, 5: 0.44 },
        M3: { 3: 0.06, 4: 0.18, 5: 0.38 },
        M4: { 3: 0.06, 4: 0.08, 5: 0.22 },
        A1: { 3: 0.04, 4: 0.04, 5: 0.10 },
        A2: { 3: 0.04, 4: 0.04, 5: 0.08 },
        A3: { 3: 0.04, 4: 0.04, 5: 0.08 },
        A4: { 3: 0.04, 4: 0.04, 5: 0.06 }
    },

    // Free Game 賠率表（SC 增量後降低補償，Total RTP ~96.1%）
    FREE_PAY: {
        M1: { 3: 0.12, 4: 0.34, 5: 0.66 },
        M4: { 3: 0.06, 4: 0.12, 5: 0.24 },
        A1: { 3: 0.02, 4: 0.06, 5: 0.14 },
        A2: { 3: 0.02, 4: 0.06, 5: 0.08 },
        A3: { 3: 0.02, 4: 0.06, 5: 0.08 },
        A4: { 3: 0.02, 4: 0.02, 5: 0.06 }
    },

    // 下注設定：1注 = 50 分，倍數 1~10
    BASE_BET:        50,
    BET_MULTIPLIERS: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],

    // Free Spins 設定
    SCATTER_FREE_SPINS: 10,
    SCATTER_RETRIGGER:  10,
    MAX_FREE_SPINS:     50,

    // Reel Strip 符號數量設定（傳入 RNG._buildReel）
    BASE_REEL_CONFIGS: [
        { SC:7,      M2:3, M3:4, M4:6, A1:14, A2:18, A3:24, A4:32 }, // 軸1 (108)
        { SC:8, WD:4, M2:3, M3:4, M4:6, A1:14, A2:18, A3:24, A4:34 }, // 軸2 (115)
        { SC:8, WD:5, M2:3, M3:4, M4:6, A1:14, A2:18, A3:24, A4:50 }, // 軸3 (132)
        {       WD:5, M2:3, M3:4, M4:7, A1:15, A2:18, A3:26, A4:44 }, // 軸4 (122)
        {       WD:6, M2:3, M3:4, M4:7, A1:15, A2:18, A3:26, A4:46 }  // 軸5 (125)
    ],
    FREE_REEL_CONFIGS: [
        { SC:2,      M1:21, M4:5, A1:14, A2:17, A3:24, A4:27 }, // 軸1 (110)
        { SC:2, WD:6, M1:9, M4:5, A1:14, A2:17, A3:24, A4:38 }, // 軸2 (115)
        { SC:2, WD:7, M1:9, M4:5, A1:14, A2:17, A3:24, A4:42 }, // 軸3 (120)
        {       WD:8, M1:8, M4:6, A1:15, A2:17, A3:26, A4:42 }, // 軸4 (122)
        {       WD:9, M1:8, M4:6, A1:15, A2:17, A3:26, A4:47 }  // 軸5 (128)
    ],

    // 動畫時序
    REEL_SPIN_DURATION:  1000,
    REEL_STOP_STAGGER:   350,
    TURBO_SPEED_FACTOR:  0.4,
    WIN_CYCLE_DELAY:     1500,

    // FS 轉場動畫時長（ms）
    FS_TRANSITION_DURATION: 4000
};
