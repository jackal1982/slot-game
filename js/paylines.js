/**
 * SlotGame Paylines Module
 * Win evaluation engine with wild substitution and scatter counting.
 */
SlotGame.Paylines = {
    /**
     * Evaluate all paylines and return win details.
     * @param {number[][]} grid - grid[reel][row] = symbolId
     * @param {number} betPerLine - bet per line
     * @returns {{ wins: Array, totalPayout: number, scatterCount: number, scatterPositions: Array, bonusWin: Object|null }}
     */
    evaluate: function(grid, betPerLine) {
        var wins = [];
        var totalPayout = 0;
        var WILD = SlotGame.Config.WILD_ID;
        var SCATTER = SlotGame.Config.SCATTER_ID;
        var CROWN = SlotGame.Config.CROWN_ID;
        var paylines = SlotGame.Config.paylines;
        var symbols = SlotGame.Config.symbols;

        // Evaluate each payline
        for (var lineIdx = 0; lineIdx < paylines.length; lineIdx++) {
            var line = paylines[lineIdx];
            var lineSymbols = [];
            for (var reel = 0; reel < SlotGame.Config.REELS; reel++) {
                lineSymbols.push(grid[reel][line[reel]]);
            }

            var result = this._evaluateLine(lineSymbols, WILD, SCATTER);
            if (result && result.count >= 3) {
                var sym = symbols[result.symbolId];
                if (sym.pay && sym.pay[result.count]) {
                    var payout = sym.pay[result.count] * betPerLine;
                    var positions = [];
                    for (var r = 0; r < result.count; r++) {
                        positions.push({ reel: r, row: line[r] });
                    }
                    wins.push({
                        paylineIndex: lineIdx,
                        symbolId: result.symbolId,
                        count: result.count,
                        payout: payout,
                        positions: positions,
                    });
                    totalPayout += payout;
                }
            }
        }

        // Count scatters (position-independent)
        var scatterCount = 0;
        var scatterPositions = [];
        for (var r2 = 0; r2 < SlotGame.Config.REELS; r2++) {
            for (var row = 0; row < SlotGame.Config.ROWS; row++) {
                if (grid[r2][row] === SCATTER) {
                    scatterCount++;
                    scatterPositions.push({ reel: r2, row: row });
                }
            }
        }

        // Check for bonus trigger (3+ Crowns on any winning payline)
        var bonusWin = null;
        for (var w = 0; w < wins.length; w++) {
            if (wins[w].symbolId === CROWN && wins[w].count >= SlotGame.Config.BONUS_TRIGGER_COUNT) {
                bonusWin = wins[w];
                break;
            }
        }

        return {
            wins: wins,
            totalPayout: totalPayout,
            scatterCount: scatterCount,
            scatterPositions: scatterPositions,
            bonusWin: bonusWin,
        };
    },

    /**
     * Evaluate a single line of 5 symbols.
     * Returns the best matching symbol and count (left-to-right).
     * Wild substitutes for everything except Scatter.
     * @param {number[]} lineSymbols - 5 symbol IDs
     * @param {number} WILD - wild symbol ID
     * @param {number} SCATTER - scatter symbol ID
     * @returns {{ symbolId: number, count: number }|null}
     */
    _evaluateLine: function(lineSymbols, WILD, SCATTER) {
        // Find the first non-wild symbol to determine the matching symbol
        var matchSymbol = -1;
        for (var i = 0; i < lineSymbols.length; i++) {
            if (lineSymbols[i] !== WILD) {
                matchSymbol = lineSymbols[i];
                break;
            }
        }

        // If all wilds, treat as wild combo
        if (matchSymbol === -1) {
            matchSymbol = WILD;
        }

        // Scatters don't count on paylines (they're position-independent)
        if (matchSymbol === SCATTER) {
            return null;
        }

        // Count consecutive matching symbols from left
        var count = 0;
        for (var j = 0; j < lineSymbols.length; j++) {
            if (lineSymbols[j] === matchSymbol || lineSymbols[j] === WILD) {
                count++;
            } else {
                break;
            }
        }

        if (count >= 3) {
            return { symbolId: matchSymbol, count: count };
        }

        return null;
    },
};
