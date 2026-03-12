/**
 * SlotGame RNG Module
 * Strip-based random number generation and grid creation.
 * Each reel has a fixed circular strip; spins pick a random stop position.
 */
SlotGame.RNG = {
    // Current stop positions per reel (for animation continuity)
    _stopPositions: [0, 0, 0, 0, 0],

    /**
     * Pick a random symbol ID based on weights (used only by RTP simulator for comparison).
     * @returns {number} Symbol ID
     */
    pickSymbol: function() {
        var total = SlotGame.Config.TOTAL_WEIGHT;
        var rand = Math.random() * total;
        var cumulative = 0;
        var symbols = SlotGame.Config.symbols;
        for (var i = 0; i < symbols.length; i++) {
            cumulative += symbols[i].weight;
            if (rand < cumulative) {
                return symbols[i].id;
            }
        }
        return symbols[symbols.length - 1].id;
    },

    /**
     * Read 3 consecutive symbols from a reel strip at a given position (circular).
     * @param {number} reelIndex - Which reel (0-4)
     * @param {number} stopPosition - Starting position on the strip
     * @returns {number[]} Array of 3 symbol IDs
     */
    readStripWindow: function(reelIndex, stopPosition) {
        var strip = SlotGame.Config.REEL_STRIPS[reelIndex];
        var len = strip.length;
        var result = [];
        for (var row = 0; row < SlotGame.Config.ROWS; row++) {
            result.push(strip[(stopPosition + row) % len]);
        }
        return result;
    },

    /**
     * Generate a 5x3 grid by picking random stop positions on each reel strip.
     * grid[reel][row] = symbolId
     * @returns {number[][]} 5x3 grid
     */
    generateGrid: function() {
        var grid = [];
        for (var reel = 0; reel < SlotGame.Config.REELS; reel++) {
            var stripLen = SlotGame.Config.REEL_STRIPS[reel].length;
            var pos = Math.floor(Math.random() * stripLen);
            this._stopPositions[reel] = pos;
            grid.push(this.readStripWindow(reel, pos));
        }
        return grid;
    },

    /**
     * Generate a reel strip segment for animation.
     * Returns symbols from the actual reel strip leading up to the stop position.
     * The last 3 symbols are the target (final visible result).
     * @param {number} reelIndex - Which reel (0-4)
     * @param {number} stopPosition - Where the reel stops
     * @param {number} extraSymbols - Number of symbols to show before the target
     * @returns {number[]} Array of symbol IDs
     */
    generateReelStrip: function(reelIndex, stopPosition, extraSymbols) {
        var strip = SlotGame.Config.REEL_STRIPS[reelIndex];
        var len = strip.length;
        var result = [];
        // Start from extraSymbols before the stop position, read through to target
        var startPos = stopPosition - extraSymbols;
        var totalSymbols = extraSymbols + SlotGame.Config.ROWS;
        for (var i = 0; i < totalSymbols; i++) {
            var pos = ((startPos + i) % len + len) % len;
            result.push(strip[pos]);
        }
        return result;
    },

    /**
     * Monte Carlo RTP Simulator.
     * Run from browser console: SlotGame.RNG.simulateRTP(1000000)
     * @param {number} iterations - Number of spins to simulate
     */
    simulateRTP: function(iterations) {
        iterations = iterations || 1000000;
        var betPerLine = 1;
        var totalLines = SlotGame.Config.ACTIVE_LINES;
        var totalBet = betPerLine * totalLines;

        var totalWagered = 0;
        var baseGameWins = 0;
        var freeSpinsWins = 0;
        var jackpotWins = 0;
        var jackpotPool = SlotGame.Config.JACKPOT_SEED;

        var freeSpinsTriggered = 0;
        var bonusTriggered = 0;

        for (var i = 0; i < iterations; i++) {
            totalWagered += totalBet;

            // Jackpot contribution
            var jackpotContrib = totalBet * SlotGame.Config.JACKPOT_CONTRIBUTION_RATE;
            jackpotPool += jackpotContrib;

            // Generate grid
            var grid = this.generateGrid();

            // Evaluate base game wins
            var result = SlotGame.Paylines.evaluate(grid, betPerLine);
            baseGameWins += result.totalPayout;

            // Count scatters
            var scatterCount = 0;
            for (var r = 0; r < SlotGame.Config.REELS; r++) {
                for (var row = 0; row < SlotGame.Config.ROWS; row++) {
                    if (grid[r][row] === SlotGame.Config.SCATTER_ID) scatterCount++;
                }
            }

            // Free spins
            if (scatterCount >= 3) {
                freeSpinsTriggered++;
                var freeSpinCount = SlotGame.Config.scatterFreeSpins[Math.min(scatterCount, 5)] || 10;
                var mult = SlotGame.Config.FREE_SPIN_MULTIPLIER;

                for (var fs = 0; fs < freeSpinCount; fs++) {
                    var fsGrid = this.generateGrid();
                    var fsResult = SlotGame.Paylines.evaluate(fsGrid, betPerLine);
                    freeSpinsWins += fsResult.totalPayout * mult;

                    // Retrigger check
                    var fsScatters = 0;
                    for (var fr = 0; fr < SlotGame.Config.REELS; fr++) {
                        for (var frow = 0; frow < SlotGame.Config.ROWS; frow++) {
                            if (fsGrid[fr][frow] === SlotGame.Config.SCATTER_ID) fsScatters++;
                        }
                    }
                    if (fsScatters >= 3) {
                        freeSpinCount += SlotGame.Config.scatterFreeSpins[Math.min(fsScatters, 5)] || 10;
                    }
                }
            }

            // Jackpot check: deterministic (5 wilds on middle row) + random trigger
            var middleRow = [grid[0][1], grid[1][1], grid[2][1], grid[3][1], grid[4][1]];
            var allWild = middleRow.every(function(s) { return s === SlotGame.Config.WILD_ID; });
            var randomChance = SlotGame.Config.JACKPOT_RANDOM_BASE_CHANCE *
                Math.min(totalBet / 20, SlotGame.Config.JACKPOT_MAX_BET_MULTIPLIER);
            var randomTrigger = Math.random() < randomChance;
            if (allWild || randomTrigger) {
                jackpotWins += jackpotPool;
                jackpotPool = SlotGame.Config.JACKPOT_SEED;
            }
        }

        var totalReturned = baseGameWins + freeSpinsWins + jackpotWins;
        var overallRTP = (totalReturned / totalWagered * 100).toFixed(2);
        var baseRTP = (baseGameWins / totalWagered * 100).toFixed(2);
        var freeRTP = (freeSpinsWins / totalWagered * 100).toFixed(2);
        var jackpotRTP = (jackpotWins / totalWagered * 100).toFixed(2);

        console.log('=== RTP Simulation Results ===');
        console.log('Iterations: ' + iterations.toLocaleString());
        console.log('Total Wagered: ' + totalWagered.toLocaleString());
        console.log('---');
        console.log('Base Game RTP:  ' + baseRTP + '% (target: 56%)');
        console.log('Free Spins RTP: ' + freeRTP + '% (target: 30%)');
        console.log('Jackpot RTP:    ' + jackpotRTP + '% (target: 10%)');
        console.log('---');
        console.log('Overall RTP:    ' + overallRTP + '% (target: 96%)');
        console.log('---');
        console.log('Free Spins Triggered: ' + freeSpinsTriggered + ' (' + (freeSpinsTriggered / iterations * 100).toFixed(3) + '%)');

        return {
            overall: parseFloat(overallRTP),
            base: parseFloat(baseRTP),
            free: parseFloat(freeRTP),
            jackpot: parseFloat(jackpotRTP),
        };
    },
};
