/**
 * Dragon Wolf Features Module
 * Free Spins 流程 + M1 隨機百搭邏輯
 */
var DragonWolf = window.DragonWolf || {};

DragonWolf.Features = {
    freeSpins: {
        _remaining: 0,
        _total:     0,
        _winnings:  0,

        isActive: function() {
            return this._remaining > 0;
        },

        start: function(count) {
            this._remaining = count;
            this._total     = count;
            this._winnings  = 0;
        },

        useOne: function() {
            if (this._remaining > 0) this._remaining--;
        },

        /** Retrigger：加局，上限 MAX_FREE_SPINS */
        addSpins: function(count) {
            var cfg = DragonWolf.Config;
            this._remaining = Math.min(this._remaining + count, cfg.MAX_FREE_SPINS);
            this._total     = Math.min(this._total + count, cfg.MAX_FREE_SPINS);
        },

        addWinnings: function(amt) {
            this._winnings += amt;
        },

        getRemaining: function() { return this._remaining; },
        getTotal:     function() { return this._total; },
        getWinnings:  function() { return this._winnings; },

        end: function() {
            var total = this._winnings;
            this._remaining = 0;
            this._total     = 0;
            this._winnings  = 0;
            return total;
        }
    },

    randomWilds: {
        /**
         * 決定百搭數量並放置到 grid（直接修改 grid[reel][row]）。
         * @param {string[][]} grid
         * @returns {{ positions: Array, count: number }}
         *   positions: [{reel, row}] 已放置的位置，供動畫使用
         */
        apply: function(grid) {
            var r = Math.random();
            var count;
            if      (r < 0.60) { count = 2  + Math.floor(Math.random() * 3); }  // 2~4 (60%)
            else if (r < 0.90) { count = 5  + Math.floor(Math.random() * 4); }  // 5~8 (30%)
            else if (r < 0.98) { count = 9  + Math.floor(Math.random() * 4); }  // 9~12 (8%)
            else               { count = 13 + Math.floor(Math.random() * 4); }  // 13~16 (2%)

            // 收集可用位置（軸 2~5 = col 1~4，排除已有 WD）
            var available = [];
            for (var col = 1; col < 5; col++) {
                for (var row = 0; row < 4; row++) {
                    if (grid[col][row] !== 'WD') {
                        available.push({ reel: col, row: row });
                    }
                }
            }

            // Fisher-Yates shuffle，取前 count 個
            var placed = Math.min(count, available.length);
            for (var i = 0; i < placed; i++) {
                var j = i + Math.floor(Math.random() * (available.length - i));
                var tmp   = available[i];
                available[i] = available[j];
                available[j] = tmp;
                grid[available[i].reel][available[i].row] = 'WD';
            }

            return {
                positions: available.slice(0, placed),
                count:     placed
            };
        }
    }
};
