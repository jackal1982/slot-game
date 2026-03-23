/**
 * Dragon Wolf Reels Module
 * 5×4 滾輪渲染與動畫（Two-Phase Bounce + Slam Stop）
 * grid[reel][row]，reel=0~4，row=0~3
 */
var DragonWolf = window.DragonWolf || {};

DragonWolf.Reels = {
    strips:    [],  // reel-strip 元素
    viewports: [],  // reel-viewport 元素
    symbolSize: 80, // 從 CSS 偵測

    spinning:      false,
    reelTimers:    [],
    spinAnimFrames: [],
    _spinGeneration: 0,
    _reelStopped:  [],

    init: function() {
        for (var i = 0; i < DragonWolf.Config.REELS; i++) {
            this.strips[i]    = document.getElementById('dw-reel-strip-' + i);
            this.viewports[i] = this.strips[i].parentElement;
        }
        this.detectSymbolSize();
        var grid = DragonWolf.RNG.generateGrid(false);
        this.renderStaticGrid(grid);
    },

    detectSymbolSize: function() {
        var vp = this.viewports[0];
        if (vp) {
            this.symbolSize = vp.clientHeight / DragonWolf.Config.ROWS;
        }
    },

    /** 建立符號 DOM 元素 */
    createSymbolEl: function(symbolId) {
        var div = document.createElement('div');
        div.className = 'dw-symbol';
        div.setAttribute('data-symbol', symbolId);
        var img = document.createElement('img');
        img.src = DragonWolf.Config.SYMBOL_IMGS[symbolId] || '';
        img.alt = DragonWolf.Config.SYMBOL_NAMES[symbolId] || symbolId;
        img.draggable = false;
        div.appendChild(img);
        return div;
    },

    /** 渲染靜態 5×4 grid */
    renderStaticGrid: function(grid) {
        DragonWolf.State.grid = grid;
        for (var reel = 0; reel < DragonWolf.Config.REELS; reel++) {
            var strip = this.strips[reel];
            strip.innerHTML = '';
            strip.style.transition = 'none';
            strip.style.transform  = 'translateY(0)';
            for (var row = 0; row < DragonWolf.Config.ROWS; row++) {
                strip.appendChild(this.createSymbolEl(grid[reel][row]));
            }
        }
    },

    /** 取得可見符號元素陣列 [reel][row] */
    getVisibleSymbols: function() {
        var result = [];
        for (var reel = 0; reel < DragonWolf.Config.REELS; reel++) {
            var reelSymbols = [];
            var symbols = this.strips[reel].querySelectorAll('.dw-symbol');
            for (var row = 0; row < DragonWolf.Config.ROWS; row++) {
                reelSymbols.push(symbols[row] || null);
            }
            result.push(reelSymbols);
        }
        return result;
    },

    // ── Spinning ─────────────────────────────────────────

    /**
     * 開始旋轉，所有軸同時啟動，依序停止
     * @param {string[][]} targetGrid
     * @param {Function} onAllStopped
     */
    spin: function(targetGrid, onAllStopped) {
        this.spinning = true;
        this._spinGeneration++;
        var gen = this._spinGeneration;

        this.detectSymbolSize();
        this._reelStopped = [false, false, false, false, false];

        var cfg      = DragonWolf.Config;
        var state    = DragonWolf.State;
        var duration = state.turboMode
            ? cfg.REEL_SPIN_DURATION * cfg.TURBO_SPEED_FACTOR
            : cfg.REEL_SPIN_DURATION;
        var stagger  = state.turboMode
            ? cfg.REEL_STOP_STAGGER * cfg.TURBO_SPEED_FACTOR
            : cfg.REEL_STOP_STAGGER;

        // 播放 spin 啟動音效
        try { DragonWolf.Audio.play('spin_start'); } catch(e) {}

        var self = this;
        for (var i = 0; i < cfg.REELS; i++) {
            this._spinReel(i, targetGrid, gen, duration, stagger, onAllStopped);
        }
    },

    _spinReel: function(reelIndex, targetGrid, gen, duration, stagger, onAllStopped) {
        var self     = this;
        var cfg      = DragonWolf.Config;
        var strip    = this.strips[reelIndex];
        var isFree   = DragonWolf.State.inFreeSpins;
        var reel     = DragonWolf.RNG.getReel(isFree, reelIndex);
        var symSize  = this.symbolSize;
        var ROWS     = cfg.ROWS;

        var targetColumn = targetGrid[reelIndex];

        // 計算 extra 符號數量（動畫滾動距離）
        var minSymbols = Math.ceil((duration / 16)) + ROWS + 10;
        var extraCount = Math.max(minSymbols, 30);

        // 建立 strip：[目標符號][extra 滾動符號...] — 符號從上往下滾動
        strip.style.transition = 'none';
        strip.style.transform  = 'translateY(0)';
        strip.innerHTML        = '';

        var stopIndex = (DragonWolf.RNG._lastStops && DragonWolf.RNG._lastStops[reelIndex] !== undefined)
            ? DragonWolf.RNG._lastStops[reelIndex]
            : Math.floor(Math.random() * reel.length);
        var startPos = ((stopIndex - extraCount) % reel.length + reel.length) % reel.length;

        // 目標符號放最前（translateY=0 時可見）
        for (var r = 0; r < ROWS; r++) {
            strip.appendChild(this.createSymbolEl(targetColumn[r]));
        }
        // extra 符號放後面（初始時位於可視區下方，往上移動進入視窗）
        for (var p = 0; p < extraCount; p++) {
            strip.appendChild(this.createSymbolEl(reel[(startPos + p) % reel.length]));
        }

        // 從上往下滾：初始 Y = -(extraCount*symSize)（extras 在視窗底部）→ 動畫到 Y = 0（targets 可見）
        var startY     = -(extraCount * symSize);  // 初始位置：strip 上移，extras 進入視窗
        var overshootY = symSize * 0.15;            // 輕微向下超射
        var targetY    = 0;                         // 最終位置：targets 在視窗頂部
        var stopDelay  = duration + reelIndex * stagger;
        var BOUNCE_DUR = 180;

        // 設定初始位置
        strip.style.transform = 'translateY(' + startY + 'px)';

        // double-rAF 確保初始位置已繪製才啟動 transition
        self.spinAnimFrames[reelIndex] = requestAnimationFrame(function() {
            self.spinAnimFrames[reelIndex] = requestAnimationFrame(function() {
                if (gen !== self._spinGeneration) return;

                // Phase 1：主要向下滾動動畫（從 startY 到 overshootY）
                strip.style.transition = 'transform ' + (stopDelay / 1000).toFixed(3) + 's cubic-bezier(0.2, 0.0, 0.3, 1.0)';
                strip.style.transform  = 'translateY(' + overshootY + 'px)';

                var phase1Fired = false;
                var onPhase1End = function() {
                    if (phase1Fired || gen !== self._spinGeneration) return;
                    phase1Fired = true;
                    strip.removeEventListener('transitionend', onPhase1End);
                    clearTimeout(self.reelTimers[reelIndex]);

                    try { DragonWolf.Audio.play('reel_stop'); } catch(e) {}

                    // Phase 2：彈跳回零（targets 在頂部）
                    strip.style.transition = 'transform ' + BOUNCE_DUR + 'ms cubic-bezier(0.34, 1.56, 0.64, 1)';
                    strip.style.transform  = 'translateY(' + targetY + 'px)';  // targetY = 0

                    var phase2Fired = false;
                    var onPhase2End = function() {
                        if (phase2Fired || gen !== self._spinGeneration) return;
                        phase2Fired = true;
                        strip.removeEventListener('transitionend', onPhase2End);
                        clearTimeout(self.reelTimers[reelIndex]);

                        // 清理並渲染最終靜態畫面
                        strip.style.transition = 'none';
                        strip.style.transform  = 'translateY(0)';
                        strip.innerHTML        = '';
                        for (var row = 0; row < ROWS; row++) {
                            strip.appendChild(self.createSymbolEl(targetColumn[row]));
                        }

                        self._reelStopped[reelIndex] = true;
                        self._checkAllStopped(gen, targetGrid, onAllStopped);
                    };
                    strip.addEventListener('transitionend', onPhase2End);
                    // Phase 2 安全備援
                    self.reelTimers[reelIndex] = setTimeout(onPhase2End, BOUNCE_DUR + 100);
                };
                strip.addEventListener('transitionend', onPhase1End);
                // Phase 1 安全備援
                self.reelTimers[reelIndex] = setTimeout(onPhase1End, stopDelay + 150);
            });
        });
    },

    _checkAllStopped: function(gen, targetGrid, callback) {
        if (gen !== this._spinGeneration) return;
        for (var i = 0; i < DragonWolf.Config.REELS; i++) {
            if (!this._reelStopped[i]) return;
        }
        this.spinning = false;
        DragonWolf.State.grid = targetGrid;
        if (callback) callback();
    },

    /** Slam Stop 快停 */
    slamStop: function(targetGrid, onAllStopped) {
        this._spinGeneration++; // 使進行中的 callback 失效
        var gen  = this._spinGeneration;
        var self = this;
        var cfg  = DragonWolf.Config;

        for (var i = 0; i < cfg.REELS; i++) {
            clearTimeout(this.reelTimers[i]);
            cancelAnimationFrame(this.spinAnimFrames[i]);
        }

        // 各軸依序快速彈跳停止
        for (var ii = 0; ii < cfg.REELS; ii++) {
            this._slamStopReel(ii, targetGrid, gen, onAllStopped);
        }
    },

    _slamStopReel: function(reelIndex, targetGrid, gen, onAllStopped) {
        var self    = this;
        var cfg     = DragonWolf.Config;
        var strip   = this.strips[reelIndex];
        var symSize = this.symbolSize;
        var delay   = reelIndex * 80;

        setTimeout(function() {
            if (gen !== self._spinGeneration) return;

            var targetColumn = targetGrid[reelIndex];
            strip.style.transition = 'none';
            strip.style.transform  = 'translateY(0)';
            strip.innerHTML        = '';
            for (var row = 0; row < cfg.ROWS; row++) {
                strip.appendChild(self.createSymbolEl(targetColumn[row]));
            }

            // 彈跳效果
            setTimeout(function() {
                if (gen !== self._spinGeneration) return;
                    strip.style.transition = 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)';
                    strip.style.transform  = 'translateY(' + symSize * 0.08 + 'px)';

                    try { DragonWolf.Audio.play('reel_stop'); } catch(e) {}

                    setTimeout(function() {
                        if (gen !== self._spinGeneration) return;
                        strip.style.transition = 'transform 0.1s ease-out';
                        strip.style.transform  = 'translateY(0)';

                        self._reelStopped[reelIndex] = true;
                        self._checkAllStopped(gen, targetGrid, onAllStopped);
                    }, 160);
            }, 20);
        }, delay);
    },

    // ── Highlight ─────────────────────────────────────────

    /** 清除所有高亮（含 scatter/m1 特殊高亮） */
    clearHighlights: function() {
        var strips = document.querySelectorAll('#dw-reel-area .dw-symbol');
        for (var i = 0; i < strips.length; i++) {
            strips[i].classList.remove(
                'dw-winning', 'dw-dimmed', 'dw-scatter-pulse',
                'dw-m1-pulse', 'dw-wild-placed'
            );
        }
    },

    /** 清除勝利/暗淡高亮，保留 scatter/m1 特殊高亮 */
    clearWinHighlights: function() {
        var strips = document.querySelectorAll('#dw-reel-area .dw-symbol');
        for (var i = 0; i < strips.length; i++) {
            strips[i].classList.remove('dw-winning', 'dw-dimmed');
        }
    },

    /** 高亮中獎位置（wins 陣列）*/
    highlightWins: function(wins) {
        if (!wins || wins.length === 0) return;

        // 先將全部暗淡
        var allSymbols = document.querySelectorAll('#dw-reel-area .dw-symbol');
        for (var j = 0; j < allSymbols.length; j++) {
            allSymbols[j].classList.add('dw-dimmed');
        }

        var visibles = this.getVisibleSymbols();

        for (var i = 0; i < wins.length; i++) {
            var win = wins[i];
            for (var p = 0; p < win.positions.length; p++) {
                var pos  = win.positions[p];
                var reel = pos.reel;
                for (var r = 0; r < pos.rows.length; r++) {
                    var row = pos.rows[r];
                    if (visibles[reel] && visibles[reel][row]) {
                        visibles[reel][row].classList.remove('dw-dimmed');
                        visibles[reel][row].classList.add('dw-winning');
                    }
                }
            }
        }
    },

    /** 高亮 Scatter 位置（紫金色脈衝） */
    highlightScatters: function(scatterPositions) {
        var visibles = this.getVisibleSymbols();
        for (var i = 0; i < scatterPositions.length; i++) {
            var pos = scatterPositions[i];
            if (visibles[pos.reel] && visibles[pos.reel][pos.row]) {
                visibles[pos.reel][pos.row].classList.add('dw-scatter-pulse');
            }
        }
    },

    /** 高亮 M1 連線位置（紅金色脈衝） */
    highlightM1Wins: function(wins) {
        var visibles = this.getVisibleSymbols();
        for (var i = 0; i < wins.length; i++) {
            var win = wins[i];
            if (win.symbol !== 'M1') continue;
            for (var p = 0; p < win.positions.length; p++) {
                var pos = win.positions[p];
                for (var r = 0; r < pos.rows.length; r++) {
                    if (visibles[pos.reel] && visibles[pos.reel][pos.rows[r]]) {
                        visibles[pos.reel][pos.rows[r]].classList.add('dw-m1-pulse');
                    }
                }
            }
        }
    },

    /** 更新指定格位的符號（隨機百搭放置動畫用） */
    updateCell: function(reel, row, symbolId) {
        var symbols = this.strips[reel].querySelectorAll('.dw-symbol');
        if (symbols[row]) {
            var img = symbols[row].querySelector('img');
            if (img) {
                img.src = DragonWolf.Config.SYMBOL_IMGS[symbolId] || '';
                img.alt = DragonWolf.Config.SYMBOL_NAMES[symbolId] || symbolId;
            }
            symbols[row].setAttribute('data-symbol', symbolId);
            symbols[row].classList.add('dw-wild-placed');
        }
    }
};
