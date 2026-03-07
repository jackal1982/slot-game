/**
 * SlotGame RNG Module
 * Weighted random number generation and grid creation.
 */
SlotGame.RNG = {
    /**
     * Pick a random symbol ID based on weights.
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
     * Generate a 5x3 grid of symbol IDs.
     * grid[reel][row] = symbolId
     * @returns {number[][]} 5x3 grid
     */
    generateGrid: function() {
        // Symbols limited to max 1 per reel
        var LIMITED = [SlotGame.Config.WILD_ID, SlotGame.Config.SCATTER_ID, SlotGame.Config.CROWN_ID];

        var grid = [];
        for (var reel = 0; reel < SlotGame.Config.REELS; reel++) {
            var column = [];
            var usedLimited = {}; // track which limited symbols already appeared
            for (var row = 0; row < SlotGame.Config.ROWS; row++) {
                var sym;
                var attempts = 0;
                do {
                    sym = this.pickSymbol();
                    attempts++;
                } while (attempts < 50 && usedLimited[sym]);
                // Mark limited symbols as used
                if (LIMITED.indexOf(sym) !== -1) {
                    usedLimited[sym] = true;
                }
                column.push(sym);
            }
            grid.push(column);
        }
        return grid;
    },

    /**
     * Generate a reel strip of N symbols (for animation).
     * The last 3 symbols are the target (final result).
     * @param {number[]} targetColumn - Array of 3 symbol IDs for final position
     * @param {number} extraSymbols - Number of random symbols above the target
     * @returns {number[]} Array of symbol IDs
     */
    generateReelStrip: function(targetColumn, extraSymbols) {
        var strip = [];
        for (var i = 0; i < extraSymbols; i++) {
            strip.push(this.pickSymbol());
        }
        // Append target symbols at the end
        for (var j = 0; j < targetColumn.length; j++) {
            strip.push(targetColumn[j]);
        }
        return strip;
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

            // Jackpot check (simplified: 5 wilds on middle row)
            var middleRow = [grid[0][1], grid[1][1], grid[2][1], grid[3][1], grid[4][1]];
            var allWild = middleRow.every(function(s) { return s === SlotGame.Config.WILD_ID; });
            if (allWild) {
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
