/**
 * 黑白龍狼傳 RTP 驗證器 v2
 * 對應 dw-config.js + dw-rng.js + dw-paylines.js + dw-features.js 現行設定
 * 包含：新 FREE_REEL_CONFIGS、generateGrid M1≤2/A≤2 限制、randomWilds 60/36/3/1 機率
 */

'use strict';

// ── Reel Configs（同 dw-config.js）───────────────────────────────────────────

const BASE_REEL_CONFIGS = [
    { SC:7,       M2:3, M3:4, M4:6,  A1:14, A2:18, A3:24, A4:32 }, // 軸1
    { SC:8, WD:4, M2:3, M3:4, M4:6,  A1:14, A2:18, A3:24, A4:34 }, // 軸2
    { SC:8, WD:5, M2:3, M3:4, M4:6,  A1:14, A2:18, A3:24, A4:50 }, // 軸3
    {       WD:5, M2:3, M3:4, M4:7,  A1:15, A2:18, A3:26, A4:44 }, // 軸4
    {       WD:6, M2:3, M3:4, M4:7,  A1:15, A2:18, A3:26, A4:46 }  // 軸5
];

const FREE_REEL_CONFIGS = [
    { SC:5,       M1:21, M4:5,  A1:14, A2:17, A3:24, A4:25 }, // 軸1 (111) SC:6→5, Retrigger ~1%
    { SC:6, WD:4, M1:10, M4:7,  A1:14, A2:17, A3:24, A4:36 }, // 軸2 (118) SC:6 不動
    { SC:6, WD:5, M1:11, M4:7,  A1:14, A2:17, A3:24, A4:38 }, // 軸3 (122) SC:7→6, M1:9→11
    {       WD:5, M1:6,  M4:11, A1:15, A2:17, A3:26, A4:42 }, // 軸4 (122) 不動
    {       WD:6, M1:6,  M4:11, A1:15, A2:17, A3:26, A4:47 }  // 軸5 (128) 不動
];

// ── Pay Tables（同 dw-config.js）─────────────────────────────────────────────

// 目標：Base Game 50%、Free Game 46%，合計 96%
// M2=M3（黑龍=白狼等強），全體 ×0.829 scale
const BASE_PAY = {
    M2: { 3: 0.125, 4: 0.265, 5: 0.565 },
    M3: { 3: 0.125, 4: 0.265, 5: 0.565 },
    M4: { 3: 0.08,  4: 0.105, 5: 0.285 },
    A1: { 3: 0.05,  4: 0.05,  5: 0.125 },
    A2: { 3: 0.05,  4: 0.05,  5: 0.105 },
    A3: { 3: 0.05,  4: 0.05,  5: 0.105 },
    A4: { 3: 0.04,  4: 0.04,  5: 0.084 }
};

// Round 2：Round 1 Free 50.51% 太高，×0.911 修正
const FREE_PAY = {
    M1: { 3: 0.077, 4: 0.214, 5: 0.380 },
    M4: { 3: 0.033, 4: 0.077, 5: 0.146 },
    A1: { 3: 0.010, 4: 0.033, 5: 0.077 },
    A2: { 3: 0.010, 4: 0.033, 5: 0.044 },
    A3: { 3: 0.010, 4: 0.033, 5: 0.044 },
    A4: { 3: 0.010, 4: 0.010, 5: 0.033 }
};

// ── _buildReel（同 dw-rng.js，確保性洗牌 + SC/WD 等距插入）──────────────────

function buildReel(counts, fixedSeed) {
    const specials = [];
    const normals  = [];

    for (const [sym, n] of Object.entries(counts)) {
        if (sym === 'SC' || sym === 'WD') {
            specials.push({ sym, count: n });
        } else {
            for (let j = 0; j < n; j++) normals.push(sym);
        }
    }

    let seed;
    if (fixedSeed != null) {
        seed = fixedSeed;
    } else {
        seed = normals.length * 31;
        for (const s of specials) seed += s.count * 7;
    }

    function seededRand() {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed / 0x7fffffff;
    }

    // Fisher-Yates 確定性洗牌
    for (let i = normals.length - 1; i > 0; i--) {
        const j = Math.floor(seededRand() * (i + 1));
        [normals[i], normals[j]] = [normals[j], normals[i]];
    }

    const reel = normals.slice();

    // 等距插入特殊符號
    for (const s of specials) {
        const spacing = Math.floor(reel.length / s.count);
        const offset  = Math.floor(seededRand() * Math.floor(spacing / 2));
        for (let ci = s.count - 1; ci >= 0; ci--) {
            const pos = Math.min(offset + ci * spacing, reel.length);
            reel.splice(pos, 0, s.sym);
        }
    }

    return reel;
}

// ── 一次性建立所有輪帶 ────────────────────────────────────────────────────────

const baseReels = BASE_REEL_CONFIGS.map(cfg => buildReel(cfg));
// Free Reel 使用固定 seed v2（SC:5/6/6 + M1:21/10/11 設定的種子值）
const FREE_REEL_FIXED_SEEDS = [3321, 3418, 3518, 3662, 3824];
const freeReels = FREE_REEL_CONFIGS.map((cfg, i) => buildReel(cfg, FREE_REEL_FIXED_SEEDS[i]));

// ── 視窗合法性檢查（同 dw-rng.js 更新後邏輯）────────────────────────────────

function isValidWindow(win, isFree) {
    let sc = 0, wd = 0, m1 = 0, a1 = 0, a2 = 0, a3 = 0, a4 = 0;
    for (const s of win) {
        if (s === 'SC') sc++;
        if (s === 'WD') wd++;
        if (s === 'M1') m1++;
        if (s === 'A1') a1++;
        if (s === 'A2') a2++;
        if (s === 'A3') a3++;
        if (s === 'A4') a4++;
    }
    if (sc > 1 || wd > 1) return false;
    if (isFree && m1 > 2) return false;
    if (a1 > 2 || a2 > 2 || a3 > 2 || a4 > 2) return false;
    return true;
}

function generateGrid(isFree) {
    const reels = isFree ? freeReels : baseReels;
    const grid  = [];

    for (let col = 0; col < 5; col++) {
        const reel = reels[col];
        let window = null;

        for (let t = 0; t < 1000; t++) {
            const start = Math.floor(Math.random() * reel.length);
            const win   = [0, 1, 2, 3].map(r => reel[(start + r) % reel.length]);
            if (isValidWindow(win, isFree)) { window = win; break; }
        }

        if (!window) {
            for (let s = 0; s < reel.length; s++) {
                const win = [0, 1, 2, 3].map(r => reel[(s + r) % reel.length]);
                if (isValidWindow(win, isFree)) { window = win; break; }
            }
        }

        grid.push(window || ['A4', 'A4', 'A4', 'A4']);
    }
    return grid;  // grid[col][row]
}

// ── 1024-Ways 評估（同 dw-paylines.js）──────────────────────────────────────

function evaluate(grid, isFree) {
    const payTable = isFree ? FREE_PAY : BASE_PAY;
    let totalWin = 0;

    for (const sym of Object.keys(payTable)) {
        const pay = payTable[sym];
        let ways = 1, len = 0;

        for (let col = 0; col < 5; col++) {
            let cnt = 0;
            for (let row = 0; row < 4; row++) {
                const s = grid[col][row];
                if (s === sym || s === 'WD') cnt++;
            }
            if (cnt === 0) break;
            ways *= cnt;
            len++;
        }

        if (len >= 3 && pay[len]) {
            totalWin += ways * pay[len];
        }
    }

    // Scatter 計數（僅軸 0~2）
    let scatterCount = 0;
    for (let r = 0; r < 3; r++)
        for (let row = 0; row < 4; row++)
            if (grid[r][row] === 'SC') scatterCount++;

    // M1 觸發判定（Free Game）
    let m1Triggered = false;
    if (isFree) {
        let len = 0;
        for (let col = 0; col < 5; col++) {
            let cnt = 0;
            for (let row = 0; row < 4; row++) {
                const s = grid[col][row];
                if (s === 'M1' || s === 'WD') cnt++;
            }
            if (cnt === 0) break;
            len++;
        }
        m1Triggered = len >= 3;
    }

    return { totalWin, scatterCount, m1Triggered };
}

// ── randomWilds（新機率 60/36/3/1，同 dw-features.js）──────────────────────

function applyRandomWilds(grid) {
    let n = 0;
    for (let col = 0; col < 4; col++)
        for (let row = 0; row < 4; row++)
            if (grid[col][row] === 'WD' || grid[col][row] === 'M1') n++;

    const maxCount = Math.max(2, 16 - n);
    const r = Math.random();
    let count;
    if      (r < 0.60) count = 2  + Math.floor(Math.random() * 3);  // 2~4 (60%)
    else if (r < 0.96) count = 5  + Math.floor(Math.random() * 4);  // 5~8 (36%)
    else if (r < 0.99) count = 9  + Math.floor(Math.random() * 4);  // 9~12 (3%)
    else               count = 13 + Math.floor(Math.random() * 4);  // 13~16 (1%)
    count = Math.max(2, Math.min(count, maxCount));

    const available = [];
    for (let col = 1; col < 5; col++)
        for (let row = 0; row < 4; row++)
            if (grid[col][row] !== 'WD' && grid[col][row] !== 'M1' && grid[col][row] !== 'SC')
                available.push([col, row]);

    const placed = Math.min(count, available.length);
    for (let i = 0; i < placed; i++) {
        const j = i + Math.floor(Math.random() * (available.length - i));
        [available[i], available[j]] = [available[j], available[i]];
        grid[available[i][0]][available[i][1]] = 'WD';
    }
}

// ── Monte Carlo Simulation ────────────────────────────────────────────────────

const SIMULATIONS   = 10_000_000;
const FS_COUNT      = 10;   // SCATTER_FREE_SPINS
const FS_RETRIGGER  = 10;   // SCATTER_RETRIGGER
const MAX_FS        = 50;   // MAX_FREE_SPINS

let totalBet       = 0;
let totalReturn    = 0;
let baseReturn     = 0;
let freeReturn     = 0;
let freeGames      = 0;
let m1Triggers     = 0;
let totalFreeSpins = 0;

console.log(`黑白龍狼傳 RTP 驗證 v2`);
console.log(`模擬局數：${SIMULATIONS.toLocaleString()} 局`);
console.log(`---------------------------------------------------`);

const t0 = Date.now();

for (let i = 0; i < SIMULATIONS; i++) {
    totalBet++;

    // Base Game
    const grid   = generateGrid(false);
    const result = evaluate(grid, false);
    baseReturn  += result.totalWin;
    totalReturn += result.totalWin;

    // Free Game 觸發
    if (result.scatterCount >= 3) {
        freeGames++;
        let remaining = FS_COUNT;
        totalFreeSpins += remaining;
        let fsWin = 0;

        while (remaining > 0) {
            remaining--;

            const fGrid   = generateGrid(true);
            let fResult   = evaluate(fGrid, true);
            let thisWin   = fResult.totalWin;

            // M1 觸發：加入隨機百搭後重新評估
            if (fResult.m1Triggered) {
                m1Triggers++;
                const gCopy = fGrid.map(col => col.slice());
                applyRandomWilds(gCopy);
                const after = evaluate(gCopy, true);
                thisWin = after.totalWin;
            }

            fsWin += thisWin;

            // Retrigger
            if (fResult.scatterCount >= 3) {
                const add = Math.min(FS_RETRIGGER, MAX_FS - remaining);
                if (add > 0) {
                    remaining      += add;
                    totalFreeSpins += add;
                }
            }
        }

        freeReturn  += fsWin;
        totalReturn += fsWin;
    }

    if ((i + 1) % 500_000 === 0) {
        const pct = ((i + 1) / SIMULATIONS * 100).toFixed(0);
        const rtp = (totalReturn / totalBet * 100).toFixed(2);
        process.stdout.write(`\r  進度 ${pct}%  |  當前 RTP ${rtp}%   `);
    }
}

const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

// ── 輸出結果 ──────────────────────────────────────────────────────────────────

const overallRtp = (totalReturn / totalBet * 100).toFixed(2);
const baseRtp    = (baseReturn  / totalBet * 100).toFixed(2);
const freeRtp    = (freeReturn  / totalBet * 100).toFixed(2);
const fsTrigRate = (freeGames   / SIMULATIONS * 100).toFixed(2);
const fsPerTrig  = (totalFreeSpins / (freeGames || 1)).toFixed(1);
const m1PerFs    = (m1Triggers / (totalFreeSpins || 1) * 100).toFixed(2);

console.log(`\n\n${'='.repeat(50)}`);
console.log(` 黑白龍狼傳 RTP 驗證結果（v2）`);
console.log('='.repeat(50));
console.log(` 整體 RTP         :  ${overallRtp}%`);
console.log(` ├ Base Game RTP  :  ${baseRtp}%`);
console.log(` └ Free Game RTP  :  ${freeRtp}%`);
console.log(`---------------------------------------------------`);
console.log(` Free Game 觸發率 :  ${fsTrigRate}%  (1/${Math.round(SIMULATIONS / (freeGames || 1))} 局)`);
console.log(` Free Spins 總局  :  ${totalFreeSpins.toLocaleString()}  (平均 ${fsPerTrig} 局/次)`);
console.log(` M1 觸發次數      :  ${m1Triggers.toLocaleString()}  (每局 FS 觸發率 ${m1PerFs}%)`);
console.log(`---------------------------------------------------`);
console.log(` 執行時間         :  ${elapsed}s`);
console.log('='.repeat(50));
