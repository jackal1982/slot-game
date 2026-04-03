/**
 * Dragon Wolf Animations Module
 * 勝利展示、FS 轉場動畫（5秒：龍狼融合 → 水墨暈開 → 郎君綻放）、隨機百搭放置動畫（降龍十八掌風格）
 */
var DragonWolf = window.DragonWolf || {};

DragonWolf.Animations = {
    _winCycleTimer:    null,
    _winCycleIndex:    0,
    _winCycleWins:     null,
    _winCycleCallback: null,
    _fsSummaryTimer:   null,

    // ── 勝利循環展示 ──────────────────────────────────────

    /**
     * 開始勝利高亮循環
     * @param {Array} wins  - 評估結果 wins 陣列
     * @param {Function} onComplete - 所有循環結束後呼叫
     */
    startWinCycle: function(wins, onComplete) {
        if (!wins || wins.length === 0) {
            if (onComplete) onComplete();
            return;
        }
        this._winCycleWins     = wins;
        this._winCycleIndex    = 0;
        this._winCycleCallback = onComplete;
        this._showNextWin();
    },

    _showNextWin: function() {
        var self = this;
        var wins = this._winCycleWins;
        if (!wins || wins.length === 0) {
            if (this._winCycleCallback) this._winCycleCallback();
            return;
        }

        var idx = this._winCycleIndex % wins.length;
        var win = wins[idx];

        DragonWolf.Reels.clearWinHighlights();
        DragonWolf.Reels.highlightWins([win]);

        // 更新 HUD 顯示當前 win
        DragonWolf.UI.updateWin(win.payout);

        // 每個 win 展示 1.5s 後切換
        this._winCycleTimer = setTimeout(function() {
            self._winCycleIndex++;
            if (self._winCycleIndex < wins.length) {
                self._showNextWin();
            } else {
                // 全部循環一遍，恢復總贏分顯示
                DragonWolf.UI.updateWin(DragonWolf.State.win);
                DragonWolf.Reels.clearWinHighlights();
                if (self._winCycleCallback) self._winCycleCallback();
            }
        }, DragonWolf.Config.WIN_CYCLE_DELAY);
    },

    stopWinCycle: function() {
        clearTimeout(this._winCycleTimer);
        this._winCycleTimer = null;
        DragonWolf.Reels.clearWinHighlights();
    },

    // ── FS 轉場動畫（龍狼融合 → 水墨暈開 → 郎君綻放） ────

    /**
     * 播放 Free Spins 進場轉場動畫（5秒：龍狼衝刺碰撞 → 水墨暈開 → 黑白郎君綻放 + 狂笑）
     * @param {number}   spinCount  - Free Spins 場次
     * @param {Function} onComplete - 動畫結束後呼叫
     */
    playFSTransition: function(spinCount, onComplete) {
        var el = document.getElementById('dw-fs-transition');
        if (!el) {
            if (onComplete) onComplete();
            return;
        }

        var spinCountEl = document.getElementById('dw-trans-spin-count');
        if (spinCountEl) spinCountEl.textContent = '× ' + spinCount;

        // 將龍/狼圖片 src 複製到殘影 ghost div 的 background-image
        this._setupGhosts(el);

        // 入場音效
        try { DragonWolf.Audio.play('scatter'); } catch(e) {}

        // 先移除 hidden 讓元素進入 layout，再加 playing 觸發動畫
        el.classList.remove('hidden');
        // 強制 reflow 後加動畫 class（比 rAF 更可靠）
        void el.offsetWidth;
        el.classList.add('dw-trans-playing');

        // 郎君綻放完成時播放狂笑（1.8s，與郎君出現同步）
        setTimeout(function() {
            try { DragonWolf.Audio.play('laugh'); } catch(e) {}
        }, 1800);

        // 5 秒後結束
        setTimeout(function() {
            el.classList.remove('dw-trans-playing');
            el.classList.add('hidden');
            setTimeout(function() {
                el.style.opacity = '';
                if (onComplete) onComplete();
            }, 100);
        }, DragonWolf.Config.FS_TRANSITION_DURATION);
    },

    /** 將龍/狼主圖 src 複製到殘影 ghost div 的 background-image */
    _setupGhosts: function(el) {
        var dragonImg = el.querySelector('#dw-trans-dragon');
        var wolfImg   = el.querySelector('#dw-trans-wolf');
        var dragonGhosts = el.querySelectorAll('#dw-trans-dragon-wrap .dw-trans-ghost');
        var wolfGhosts   = el.querySelectorAll('#dw-trans-wolf-wrap .dw-trans-ghost');
        if (dragonImg) {
            for (var i = 0; i < dragonGhosts.length; i++) {
                dragonGhosts[i].style.backgroundImage = 'url(' + dragonImg.src + ')';
            }
        }
        if (wolfImg) {
            for (var j = 0; j < wolfGhosts.length; j++) {
                wolfGhosts[j].style.backgroundImage = 'url(' + wolfImg.src + ')';
            }
        }
    },

    // ── 氣功（降龍十八掌風格）動畫 ─────────────────────────

    /**
     * 播放黑白郎君發氣功動畫，並以隕石墜落方式放置 Wild
     * @param {string[][]} grid      - 直接修改的 grid
     * @param {Function}   onComplete - ({ positions, count }) 動畫結束後呼叫
     */
    playQigong: function(grid, onComplete) {
        var self = this;
        var reelGrid = document.getElementById('dw-reel-grid');

        // 顯示氣功 overlay，觸發 CSS 動畫序列
        var qigongEl = document.getElementById('dw-qigong-overlay');
        if (qigongEl) {
            qigongEl.classList.remove('hidden');
            void qigongEl.offsetWidth; // 強制 reflow
            qigongEl.classList.add('dw-qigong-active');
        }

        // 蓄力階段（0.5s）：螢幕震動 + 笑聲
        setTimeout(function() {
            if (reelGrid) reelGrid.classList.add('dw-screen-shake');
            try { DragonWolf.Audio.play('laugh'); } catch(e) {}
        }, 500);

        // 發射時機（1.5s）：停止震動 + 掌力音效 + 計算 Wild
        var result;
        setTimeout(function() {
            if (reelGrid) reelGrid.classList.remove('dw-screen-shake');
            try { DragonWolf.Audio.play('palm_hit'); } catch(e) {}
            result = DragonWolf.Features.randomWilds.apply(grid);
        }, 1500);

        // 隕石墜落放置 Wild（2.2s 開始）
        setTimeout(function() {
            var fireTime = Date.now();

            self._placeWildsMeteor(result.positions, 0, function() {
                // 確保等到角色淡出完成（發射後 1.8s）再隱藏 overlay
                var elapsed  = Date.now() - fireTime;
                var waitMore = Math.max(0, 1800 - elapsed);
                setTimeout(function() {
                    if (qigongEl) {
                        qigongEl.classList.remove('dw-qigong-active');
                        qigongEl.classList.add('hidden');
                    }
                    if (onComplete) onComplete(result);
                }, waitMore);
            });
        }, 2200);
    },

    /**
     * 隕石墜落方式同時放置所有 Wild（並行 + overlay 疊加，避免原符號瞬間消失）
     * @param {Array}    positions  - [{reel, row}, ...] 位置陣列
     * @param {number}   _index     - 已廢棄，保留僅供 API 相容
     * @param {Function} onComplete - 全部放置完後呼叫
     */
    _placeWildsMeteor: function(positions, _index, onComplete) {
        if (!positions || positions.length === 0) {
            if (onComplete) onComplete();
            return;
        }

        var reelGrid  = document.getElementById('dw-reel-grid');
        var wildSrc   = (DragonWolf.Config.SYMBOL_IMGS  && DragonWolf.Config.SYMBOL_IMGS['WD'])  || '';
        var wildName  = (DragonWolf.Config.SYMBOL_NAMES && DragonWolf.Config.SYMBOL_NAMES['WD']) || 'WD';
        var remaining = positions.length;

        function onOneDone() {
            remaining--;
            if (remaining <= 0 && onComplete) onComplete();
        }

        // 所有位置同時開始
        for (var i = 0; i < positions.length; i++) {
            (function(pos) {
                var strips = DragonWolf.Reels.strips;
                if (!strips || !strips[pos.reel]) { onOneDone(); return; }
                var symbols = strips[pos.reel].querySelectorAll('.dw-symbol');
                var cell    = symbols[pos.row];
                if (!cell) { onOneDone(); return; }

                var originalImg = cell.querySelector('img');

                // 1. 暗化原始符號（保持可見，降低亮度）
                if (originalImg) {
                    originalImg.style.filter = 'brightness(0.35)';
                }

                // 2. 建立 Wild overlay 疊加在原始符號上方
                var overlay = document.createElement('img');
                overlay.className = 'dw-wild-overlay';
                overlay.src       = wildSrc;
                overlay.alt       = wildName;
                cell.appendChild(overlay);

                // 3. 更新 data-symbol（即時反映邏輯狀態）
                cell.setAttribute('data-symbol', 'WD');

                // 4. 隕石飛入動畫
                cell.classList.remove('dw-wild-placed');
                cell.classList.add('dw-wild-meteor');

                // 5. 350ms 後著地：衝擊動畫 + 音效 + 強震（250ms）
                setTimeout(function() {
                    cell.classList.remove('dw-wild-meteor');
                    cell.classList.add('dw-wild-impact');
                    try { DragonWolf.Audio.play('meteor_impact'); } catch(e) {}
                    if (reelGrid) {
                        reelGrid.classList.add('dw-screen-shake');
                        setTimeout(function() {
                            reelGrid.classList.remove('dw-screen-shake');
                        }, 250);
                    }
                }, 350);

                // 6. 800ms 後動畫結束：換底層 img src，移除 overlay
                setTimeout(function() {
                    if (originalImg) {
                        originalImg.src    = wildSrc;
                        originalImg.alt    = wildName;
                        originalImg.style.filter = '';
                    }
                    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                    cell.classList.remove('dw-wild-impact');
                    cell.classList.add('dw-wild-placed');
                    onOneDone();
                }, 800);
            })(positions[i]);
        }
    },

    /** 清除所有殘留的 Wild overlay（防止 DOM 洩漏，在 cleanup 時呼叫） */
    clearWildOverlays: function() {
        var overlays = document.querySelectorAll('#dw-reel-area .dw-wild-overlay');
        for (var i = 0; i < overlays.length; i++) {
            var ov = overlays[i];
            // 還原底層 img filter
            var cell = ov.parentNode;
            if (cell) {
                var originalImg = cell.querySelector('img:not(.dw-wild-overlay)');
                if (originalImg) originalImg.style.filter = '';
            }
            if (ov.parentNode) ov.parentNode.removeChild(ov);
        }
    },

    /** 向後相容別名 */
    _placeWildsSequentially: function(positions, index, onComplete) {
        this._placeWildsMeteor(positions, index, onComplete);
    },

    // ── Retrigger 動畫 ────────────────────────────────────

    playRetrigger: function(addedSpins) {
        var el = document.getElementById('dw-retrigger-overlay');
        if (!el) return;
        var countEl = el.querySelector('.dw-retrigger-count');
        if (countEl) countEl.textContent = '+' + addedSpins;
        el.classList.remove('hidden');
        el.classList.add('dw-retrigger-active');
        try { DragonWolf.Audio.play('scatter'); } catch(e) {}
        setTimeout(function() {
            el.classList.remove('dw-retrigger-active');
            el.classList.add('hidden');
        }, 1500);
    },

    // ── FS 總結動畫 ───────────────────────────────────────

    _clearFSSummaryTimers: function() {
        if (this._fsSummaryTimer !== null) {
            clearTimeout(this._fsSummaryTimer);
            this._fsSummaryTimer = null;
        }
    },

    playFSSummary: function(totalWin, onComplete) {
        // 防洩漏：先清除舊定時器
        this._clearFSSummaryTimers();

        var el = document.getElementById('dw-fs-summary');
        if (!el) { if (onComplete) onComplete(); return; }

        // 立即停止 Free Game BGM
        try { DragonWolf.Audio.bgmStop(); } catch(e) {}

        // 顯示 overlay
        var amtEl = document.getElementById('dw-fs-summary-amount');
        if (amtEl) amtEl.textContent = totalWin.toLocaleString();
        el.classList.remove('hidden');
        el.classList.add('dw-overlay-active');

        // 判斷大贏閾值
        var bet = 0;
        try { bet = DragonWolf.State.getBet(); } catch(e) {}
        var isBigWin = (totalWin >= bet * 50);
        var delay    = isBigWin ? 8000 : 3000;

        console.log('[FS Summary] totalWin:', totalWin, 'bet:', bet, 'threshold:', bet * 50, 'isBigWin:', isBigWin);

        if (isBigWin) {
            try { DragonWolf.Audio.play('free-bigwin'); } catch(e) {}
        }

        var self = this;
        this._fsSummaryTimer = setTimeout(function() {
            self._fsSummaryTimer = null;
            el.classList.remove('dw-overlay-active');
            el.classList.add('hidden');
            if (onComplete) onComplete();
        }, delay);
    }
};
