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
        SC: 'images/dragon_wolf/sc.png',
        WD: 'images/dragon_wolf/wd.png',
        M1: 'images/dragon_wolf/m1.png',
        M2: 'images/dragon_wolf/m2.png',
        M3: 'images/dragon_wolf/m3.png',
        M4: 'images/dragon_wolf/m4.png',
        A1: 'images/dragon_wolf/a1.png',
        A2: 'images/dragon_wolf/a2.png',
        A3: 'images/dragon_wolf/a3.png',
        A4: 'images/dragon_wolf/a4.png'
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
    // 驗證：Base RTP ~60.3%（10M 局，目標 60%）
    BASE_PAY: {
        M2: { 3: 0.16, 4: 0.32, 5: 0.70 },
        M3: { 3: 0.10, 4: 0.29, 5: 0.60 },
        M4: { 3: 0.10, 4: 0.13, 5: 0.35 },
        A1: { 3: 0.06, 4: 0.06, 5: 0.16 },
        A2: { 3: 0.06, 4: 0.06, 5: 0.13 },
        A3: { 3: 0.06, 4: 0.06, 5: 0.13 },
        A4: { 3: 0.05, 4: 0.05, 5: 0.10 }
    },

    // Free Game 賠率表（per-way 倍率 × bet）
    // 驗證：Free RTP ~35.7%（10M 局，目標 36%），整體 RTP 96.04%
    FREE_PAY: {
        M1: { 3: 0.07, 4: 0.20, 5: 0.35 },
        M4: { 3: 0.03, 4: 0.07, 5: 0.13 },
        A1: { 3: 0.01, 4: 0.03, 5: 0.07 },
        A2: { 3: 0.01, 4: 0.03, 5: 0.04 },
        A3: { 3: 0.01, 4: 0.03, 5: 0.04 },
        A4: { 3: 0.01, 4: 0.01, 5: 0.03 }
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
        { SC:2,      M1:21, M4:5,  A1:14, A2:17, A3:24, A4:27 }, // 軸1 (110) - 不變；M1 最高密度，由 generateGrid 強制 ≤2/視窗
        { SC:2, WD:4, M1:9, M4:7,  A1:14, A2:17, A3:24, A4:38 }, // 軸2 (115) - WD:6→4, M4:5→7
        { SC:2, WD:5, M1:9, M4:7,  A1:14, A2:17, A3:24, A4:42 }, // 軸3 (120) - WD:7→5, M4:5→7
        {       WD:5, M1:6, M4:11, A1:15, A2:17, A3:26, A4:42 }, // 軸4 (122) - WD:8→5, M1:8→6, M4:6→11
        {       WD:6, M1:6, M4:11, A1:15, A2:17, A3:26, A4:47 }  // 軸5 (128) - WD:9→6, M1:8→6, M4:6→11
    ],

    // 動畫時序
    REEL_SPIN_DURATION:  1000,
    REEL_STOP_STAGGER:   350,
    TURBO_SPEED_FACTOR:  0.4,
    WIN_CYCLE_DELAY:     1500,

    // FS 轉場動畫時長（ms）
    // CSS 動畫在 ~6s 完成（fadeout 5.2s delay + 0.8s duration），多留 0.5s 緩衝
    FS_TRANSITION_DURATION: 6500
};
