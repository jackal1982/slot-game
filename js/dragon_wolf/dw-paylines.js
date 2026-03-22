/**
 * Dragon Wolf Paylines Module
 * 1024-Ways 評估引擎 + M1 三連判定
 * grid[reel][row]，reel=0~4，row=0~3
 */
var DragonWolf = window.DragonWolf || {};

DragonWolf.Paylines = {
    /**
     * 評估 1024-Ways 贏分。
     * @param {string[][]} grid   - grid[reel][row]，5×4
     * @param {number}     bet    - 本局下注額（credits）
     * @param {boolean}    isFree - 是否 Free Game
     * @returns {{ wins, totalWin, scatterCount, scatterPositions, m1Triggered }}
     */
    evaluate: function(grid, bet, isFree) {
        var cfg      = DragonWolf.Config;
        var payTable = isFree ? cfg.FREE_PAY : cfg.BASE_PAY;
        var totalWin = 0;
        var wins     = [];

        var paySymbols = Object.keys(payTable);
        for (var i = 0; i < paySymbols.length; i++) {
            var sym         = paySymbols[i];
            var pay         = payTable[sym];
            var ways        = 1;
            var len         = 0;
            var winPositions = [];

            for (var col = 0; col < 5; col++) {
                var cnt  = 0;
                var rows = [];
                for (var row = 0; row < 4; row++) {
                    var s = grid[col][row];
                    if (s === sym || s === cfg.WILD_ID) {
                        cnt++;
                        rows.push(row);
                    }
                }
                if (cnt === 0) break;
                ways *= cnt;
                len++;
                winPositions.push({ reel: col, rows: rows });
            }

            if (len >= 3 && pay[len]) {
                var winAmount = ways * pay[len] * bet;
                // 四捨五入到整數（避免浮點誤差）
                winAmount = Math.round(winAmount);
                wins.push({
                    symbol:    sym,
                    length:    len,
                    ways:      ways,
                    payout:    winAmount,
                    positions: winPositions
                });
                totalWin += winAmount;
            }
        }

        // Scatter 計數（僅軸 1~3，即 col 0~2）
        var scatterCount     = 0;
        var scatterPositions = [];
        for (var r = 0; r < 3; r++) {
            for (var row2 = 0; row2 < 4; row2++) {
                if (grid[r][row2] === cfg.SCATTER_ID) {
                    scatterCount++;
                    scatterPositions.push({ reel: r, row: row2 });
                }
            }
        }

        // M1 觸發判定（Free Game 限定）
        var m1Triggered = isFree ? this._checkM1Ways(grid) : false;

        return {
            wins:             wins,
            totalWin:         totalWin,
            scatterCount:     scatterCount,
            scatterPositions: scatterPositions,
            m1Triggered:      m1Triggered
        };
    },

    /** 判斷 M1 是否有 3+ 軸連線（含 WD 替代） */
    _checkM1Ways: function(grid) {
        var cfg = DragonWolf.Config;
        var len = 0;
        for (var col = 0; col < 5; col++) {
            var cnt = 0;
            for (var row = 0; row < 4; row++) {
                var s = grid[col][row];
                if (s === cfg.M1_ID || s === cfg.WILD_ID) cnt++;
            }
            if (cnt === 0) break;
            len++;
        }
        return len >= 3;
    },

    /** 取得 M1 連線位置（供動畫高亮用） */
    getM1WinPositions: function(grid) {
        var cfg      = DragonWolf.Config;
        var positions = [];
        for (var col = 0; col < 5; col++) {
            var rows = [];
            for (var row = 0; row < 4; row++) {
                var s = grid[col][row];
                if (s === cfg.M1_ID || s === cfg.WILD_ID) rows.push(row);
            }
            if (rows.length === 0) break;
            positions.push({ reel: col, rows: rows });
        }
        return positions;
    }
};
