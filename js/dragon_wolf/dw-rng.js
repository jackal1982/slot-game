/**
 * Dragon Wolf RNG Module
 * buildReel 演算法（移植自 rtp_verify_dw_v3.js）+ generateGrid（grid[reel][row]）
 */
var DragonWolf = window.DragonWolf || {};

DragonWolf.RNG = {
    _baseReels:  null,
    _freeReels:  null,
    _lastStops:  [],   // 最近一次 generateGrid 各軸的 stop index（供動畫計算連續性用）

    init: function() {
        this._baseReels = this._buildAllReels(DragonWolf.Config.BASE_REEL_CONFIGS);
        this._freeReels  = this._buildAllReels(DragonWolf.Config.FREE_REEL_CONFIGS);
    },

    /** 從設定陣列建立所有輪帶 */
    _buildAllReels: function(configs) {
        var reels = [];
        for (var i = 0; i < configs.length; i++) {
            reels.push(this._buildReel(configs[i]));
        }
        return reels;
    },

    /**
     * buildReel：等距插入 SC/WD，確定性亂數排列普通符號。
     * 移植自 rtp_verify_dw_v3.js buildReel()，確保與 RTP 驗證一致。
     * @param {Object} counts - { SC:n, WD:n, M2:n, ... }
     * @returns {string[]}
     */
    _buildReel: function(counts) {
        var specials = [];
        var normals  = [];

        var keys = Object.keys(counts);
        for (var i = 0; i < keys.length; i++) {
            var sym = keys[i];
            var n   = counts[sym];
            if (sym === 'SC' || sym === 'WD') {
                specials.push({ sym: sym, count: n });
            } else {
                for (var j = 0; j < n; j++) {
                    normals.push(sym);
                }
            }
        }

        // 確定性洗牌（seed 由輪帶長度決定，確保每次結果一致）
        var seed = normals.length * 31;
        for (var k = 0; k < specials.length; k++) {
            seed += specials[k].count * 7;
        }

        function seededRand() {
            seed = (seed * 1103515245 + 12345) & 0x7fffffff;
            return seed / 0x7fffffff;
        }

        // Fisher-Yates shuffle（確定性）
        for (var ii = normals.length - 1; ii > 0; ii--) {
            var jj = Math.floor(seededRand() * (ii + 1));
            var tmp = normals[ii];
            normals[ii] = normals[jj];
            normals[jj] = tmp;
        }

        var reel = normals.slice();

        // 等距插入每種特殊符號（間距 >= 5，確保 4 格視窗最多 1 個）
        for (var si = 0; si < specials.length; si++) {
            var s       = specials[si];
            var spacing = Math.floor(reel.length / s.count);
            var offset  = Math.floor(seededRand() * Math.floor(spacing / 2));
            for (var ci = s.count - 1; ci >= 0; ci--) {
                var pos = Math.min(offset + ci * spacing, reel.length);
                reel.splice(pos, 0, s.sym);
            }
        }

        return reel;
    },

    /**
     * 生成 grid[reel][row]，5 軸 × 4 行。
     * 同時將各軸 stop index 存入 _lastStops（供動畫確保 extra 符號連續性）。
     * Plan B 防護：若同軸 4 格出現 >1 個 SC 或 WD，重新取位（理論上不應發生，防萬一）。
     * @param {boolean} isFree - true 使用 Free Reels
     * @returns {string[][]}
     */
    generateGrid: function(isFree) {
        var reels = isFree ? this._freeReels : this._baseReels;
        var grid  = [];
        this._lastStops = [];
        for (var col = 0; col < 5; col++) {
            var reel   = reels[col];
            var start  = 0;
            var colArr = [];
            var ok     = false;
            for (var tries = 0; tries < 1000; tries++) {
                start = Math.floor(Math.random() * reel.length);
                var tmp     = [];
                var scCount = 0;
                var wdCount = 0;
                var m1Count = 0;
                var a1Count = 0, a2Count = 0, a3Count = 0, a4Count = 0;
                for (var row = 0; row < 4; row++) {
                    var sym = reel[(start + row) % reel.length];
                    tmp.push(sym);
                    if (sym === 'SC') scCount++;
                    if (sym === 'WD') wdCount++;
                    if (sym === 'M1') m1Count++;
                    if (sym === 'A1') a1Count++;
                    if (sym === 'A2') a2Count++;
                    if (sym === 'A3') a3Count++;
                    if (sym === 'A4') a4Count++;
                }
                // Free Game：同視窗 M1 最多 2 個（保留高密度但防止 3~4 個暴力堆疊）
                var m1Ok = !isFree || m1Count <= 2;
                // 所有模式：任一 A 符號在同視窗最多 2 個（防止 Ways 大量堆疊）
                var aOk  = a1Count <= 2 && a2Count <= 2 && a3Count <= 2 && a4Count <= 2;
                if (scCount <= 1 && wdCount <= 1 && m1Ok && aOk) {
                    colArr = tmp;
                    ok     = true;
                    break;
                }
            }
            if (!ok) {
                // 1000 次後仍無法找到合法位置，強制掃描所有位置
                for (var s2 = 0; s2 < reel.length; s2++) {
                    var tmp2 = [];
                    var sc2  = 0, wd2  = 0, m1C2 = 0;
                    var a1C2 = 0, a2C2 = 0, a3C2 = 0, a4C2 = 0;
                    for (var r2 = 0; r2 < 4; r2++) {
                        var sym2 = reel[(s2 + r2) % reel.length];
                        tmp2.push(sym2);
                        if (sym2 === 'SC') sc2++;
                        if (sym2 === 'WD') wd2++;
                        if (sym2 === 'M1') m1C2++;
                        if (sym2 === 'A1') a1C2++;
                        if (sym2 === 'A2') a2C2++;
                        if (sym2 === 'A3') a3C2++;
                        if (sym2 === 'A4') a4C2++;
                    }
                    var m1Ok2 = !isFree || m1C2 <= 2;
                    var aOk2  = a1C2 <= 2 && a2C2 <= 2 && a3C2 <= 2 && a4C2 <= 2;
                    if (sc2 <= 1 && wd2 <= 1 && m1Ok2 && aOk2) {
                        start  = s2;
                        colArr = tmp2;
                        ok     = true;
                        break;
                    }
                }
                if (!ok) {
                    console.warn('[DW-RNG] col ' + col + ': no valid start found, using last attempt');
                }
            }
            this._lastStops.push(start);
            grid.push(colArr);
        }
        return grid;
    },

    /**
     * 取得指定軸的 stop index（用於動畫：需要從當前位置滾到目標位置）
     * @param {boolean} isFree
     * @returns {number[]} 每軸的起始 stop index
     */
    generateStops: function(isFree) {
        var reels = isFree ? this._freeReels : this._baseReels;
        var stops = [];
        for (var col = 0; col < 5; col++) {
            stops.push(Math.floor(Math.random() * reels[col].length));
        }
        return stops;
    },

    /**
     * 從 stop index 取出 grid[reel] 的 4 個符號
     */
    getColumnFromStop: function(isFree, col, stopIndex) {
        var reels = isFree ? this._freeReels : this._baseReels;
        var reel  = reels[col];
        var arr   = [];
        for (var row = 0; row < 4; row++) {
            arr.push(reel[(stopIndex + row) % reel.length]);
        }
        return arr;
    },

    /** 取得輪帶長度（供動畫計算用） */
    getReelLength: function(isFree, col) {
        var reels = isFree ? this._freeReels : this._baseReels;
        return reels[col].length;
    },

    /** 取得輪帶（供動畫使用） */
    getReel: function(isFree, col) {
        var reels = isFree ? this._freeReels : this._baseReels;
        return reels[col];
    }
};
