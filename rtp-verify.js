/**
 * RTP Verification Script for Fortune Slots
 * Mirrors the actual game logic from paylines.js and rng.js
 * Run: node rtp-verify.js
 */

const Config = {
    REELS: 5,
    ROWS: 3,
    WILD_ID: 0,
    SCATTER_ID: 1,
    CROWN_ID: 2,
    ACTIVE_LINES: 20,
    FREE_SPIN_MULTIPLIER: 3,
    JACKPOT_SEED: 5000,
    JACKPOT_CONTRIBUTION_RATE: 0.10,
    JACKPOT_RANDOM_BASE_CHANCE: 1 / 50000,
    JACKPOT_MAX_BET_MULTIPLIER: 5,

    symbols: [
        { id: 0, name: 'Wild',    weight: 3,  pay: { 3: 40, 4: 100, 5: 300 } },
        { id: 1, name: 'Scatter', weight: 3,  pay: null },
        { id: 2, name: 'Crown',   weight: 5,  pay: { 3: 25, 4: 70, 5: 200 } },
        { id: 3, name: 'Bell',    weight: 6,  pay: { 3: 15, 4: 50, 5: 125 } },
        { id: 4, name: 'Seven',   weight: 8,  pay: { 3: 12, 4: 35, 5: 100 } },
        { id: 5, name: 'Cherry',  weight: 10, pay: { 3: 8,  4: 25, 5: 75 } },
        { id: 6, name: 'Lemon',   weight: 14, pay: { 3: 5,  4: 15, 5: 50 } },
        { id: 7, name: 'Grape',   weight: 14, pay: { 3: 3,  4: 8,  5: 40 } },
    ],

    scatterFreeSpins: { 3: 8, 4: 12, 5: 18 },

    paylines: [
        [1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2],
        [0,0,1,2,2],[2,2,1,0,0],[1,0,0,0,1],[1,2,2,2,1],[0,1,0,1,0],
        [2,1,2,1,2],[1,0,1,0,1],[1,2,1,2,1],[0,1,1,1,0],[2,1,1,1,2],
        [0,0,1,0,0],[2,2,1,2,2],[1,0,1,2,1],[1,2,1,0,1],[0,2,0,2,0],
    ],

    REEL_STRIPS: [
        // Reel 0 (30): W:1 S:1 C:1 B:3 V:4 H:5 L:8 G:7 (original)
        [6,7,5,4,6,7,3,5,6,7,4,6,5,0,7,4,6,3,7,5,6,7,4,1,6,5,7,3,6,2],
        // Reel 1 (34): W:1 S:2 C:2 B:4 V:4 H:5 L:8 G:8 (original)
        [7,4,6,5,7,3,6,7,5,6,4,3,7,6,1,5,7,6,4,7,3,6,5,7,0,6,5,4,2,7,6,3,1,2],
        // Reel 2 (31): W:1 S:1 C:2 B:3 V:5 H:5 L:7 G:7 (original)
        [4,7,5,6,3,7,4,6,5,7,6,4,2,7,5,6,3,4,7,6,0,5,7,6,4,5,1,7,3,6,2],
        // Reel 3 (33): W:1 S:2 C:2 B:3 V:4 H:6 L:8 G:7 (original)
        [5,6,7,4,5,3,6,7,6,5,1,4,7,6,5,3,7,6,4,7,5,2,6,7,0,6,5,4,7,3,2,6,1],
        // Reel 4 (28): W:1 S:1 C:2 B:4 V:3 H:4 L:6 G:7 (original)
        [3,7,6,4,7,5,3,6,7,5,6,7,2,4,6,3,7,5,0,7,6,5,3,7,1,6,4,2],
    ],
};

// Generate a 5x3 grid: grid[reel][row]
function generateGrid() {
    const grid = [];
    for (let reel = 0; reel < Config.REELS; reel++) {
        const strip = Config.REEL_STRIPS[reel];
        const pos = Math.floor(Math.random() * strip.length);
        const col = [];
        for (let row = 0; row < Config.ROWS; row++) {
            col.push(strip[(pos + row) % strip.length]);
        }
        grid.push(col);
    }
    return grid;
}

// Evaluate a single payline (matching game's _evaluateLine logic)
function evaluateLine(lineSymbols) {
    const WILD = Config.WILD_ID;
    const SCATTER = Config.SCATTER_ID;

    // Find the first non-wild symbol
    let matchSymbol = -1;
    for (let i = 0; i < lineSymbols.length; i++) {
        if (lineSymbols[i] !== WILD) {
            matchSymbol = lineSymbols[i];
            break;
        }
    }

    // All wilds
    if (matchSymbol === -1) matchSymbol = WILD;

    // Scatters don't count on paylines
    if (matchSymbol === SCATTER) return null;

    // Count consecutive matching from left
    let count = 0;
    for (let j = 0; j < lineSymbols.length; j++) {
        if (lineSymbols[j] === matchSymbol || lineSymbols[j] === WILD) {
            count++;
        } else {
            break;
        }
    }

    if (count >= 3) return { symbolId: matchSymbol, count };
    return null;
}

// Evaluate all paylines
function evaluate(grid, betPerLine) {
    let totalPayout = 0;

    for (let lineIdx = 0; lineIdx < Config.paylines.length; lineIdx++) {
        const line = Config.paylines[lineIdx];
        const lineSymbols = [];
        for (let reel = 0; reel < Config.REELS; reel++) {
            lineSymbols.push(grid[reel][line[reel]]);
        }

        const result = evaluateLine(lineSymbols);
        if (result && result.count >= 3) {
            const sym = Config.symbols[result.symbolId];
            if (sym.pay && sym.pay[result.count]) {
                totalPayout += sym.pay[result.count] * betPerLine;
            }
        }
    }

    // Count scatters
    let scatterCount = 0;
    for (let r = 0; r < Config.REELS; r++) {
        for (let row = 0; row < Config.ROWS; row++) {
            if (grid[r][row] === Config.SCATTER_ID) scatterCount++;
        }
    }

    return { totalPayout, scatterCount };
}

// Monte Carlo simulation
function simulateRTP(iterations = 1000000) {
    const betPerLine = 1;
    const totalLines = Config.ACTIVE_LINES;
    const totalBet = betPerLine * totalLines;

    let totalWagered = 0;
    let baseGameWins = 0;
    let freeSpinsWins = 0;
    let jackpotWins = 0;
    let jackpotPool = Config.JACKPOT_SEED;
    let freeSpinsTriggered = 0;

    for (let i = 0; i < iterations; i++) {
        totalWagered += totalBet;

        // Jackpot contribution
        jackpotPool += totalBet * Config.JACKPOT_CONTRIBUTION_RATE;

        // Generate grid
        const grid = generateGrid();
        const result = evaluate(grid, betPerLine);
        baseGameWins += result.totalPayout;

        // Free spins check
        if (result.scatterCount >= 3) {
            freeSpinsTriggered++;
            let freeSpinCount = Config.scatterFreeSpins[Math.min(result.scatterCount, 5)] || 10;
            const mult = Config.FREE_SPIN_MULTIPLIER;

            for (let fs = 0; fs < freeSpinCount; fs++) {
                const fsGrid = generateGrid();
                const fsResult = evaluate(fsGrid, betPerLine);
                freeSpinsWins += fsResult.totalPayout * mult;

                // Retrigger
                if (fsResult.scatterCount >= 3) {
                    freeSpinCount += Config.scatterFreeSpins[Math.min(fsResult.scatterCount, 5)] || 10;
                }
            }
        }

        // Jackpot check
        const middleRow = [grid[0][1], grid[1][1], grid[2][1], grid[3][1], grid[4][1]];
        const allWild = middleRow.every(s => s === Config.WILD_ID);
        const randomChance = Config.JACKPOT_RANDOM_BASE_CHANCE *
            Math.min(totalBet / 20, Config.JACKPOT_MAX_BET_MULTIPLIER);
        if (allWild || Math.random() < randomChance) {
            jackpotWins += jackpotPool;
            jackpotPool = Config.JACKPOT_SEED;
        }
    }

    const totalReturned = baseGameWins + freeSpinsWins + jackpotWins;
    const overallRTP = (totalReturned / totalWagered * 100).toFixed(2);
    const baseRTP = (baseGameWins / totalWagered * 100).toFixed(2);
    const freeRTP = (freeSpinsWins / totalWagered * 100).toFixed(2);
    const jackpotRTP = (jackpotWins / totalWagered * 100).toFixed(2);

    console.log('=== Fortune Slots RTP 驗證結果 ===');
    console.log(`模擬次數: ${iterations.toLocaleString()}`);
    console.log(`總下注: ${totalWagered.toLocaleString()}`);
    console.log('---');
    console.log(`Base Game RTP:  ${baseRTP}% (目標: ~56%)`);
    console.log(`Free Spins RTP: ${freeRTP}% (目標: ~30%)`);
    console.log(`Jackpot RTP:    ${jackpotRTP}% (目標: ~10%)`);
    console.log('---');
    console.log(`Overall RTP:    ${overallRTP}% (目標: 96%)`);
    console.log('---');
    console.log(`Free Spins 觸發: ${freeSpinsTriggered} 次 (${(freeSpinsTriggered / iterations * 100).toFixed(3)}%)`);

    const rtp = parseFloat(overallRTP);
    if (rtp >= 95.5 && rtp <= 96.5) {
        console.log('\n✅ RTP 在目標範圍內！');
    } else if (rtp < 95.5) {
        console.log('\n⚠️ RTP 偏低，需要微調');
    } else {
        console.log('\n⚠️ RTP 偏高，需要微調');
    }

    return { overall: rtp, base: parseFloat(baseRTP), free: parseFloat(freeRTP), jackpot: parseFloat(jackpotRTP) };
}

simulateRTP(5000000);
