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

        // 郎君綻放完成時播放狂笑（3s）
        setTimeout(function() {
            try { DragonWolf.Audio.play('laugh'); } catch(e) {}
        }, 3000);

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
     * 隕石墜落方式逐格放置 Wild
     * @param {Array}    positions  - [{reel, row}, ...] 位置陣列
     * @param {number}   index      - 目前索引
     * @param {Function} onComplete - 全部放置完後呼叫
     */
    _placeWildsMeteor: function(positions, index, onComplete) {
        var self = this;
        if (index >= positions.length) {
            if (onComplete) onComplete();
            return;
        }
        var pos = positions[index];
        var reelGrid = document.getElementById('dw-reel-grid');

        // 更新符號圖片（updateCell 會加 dw-wild-placed）
        DragonWolf.Reels.updateCell(pos.reel, pos.row, 'WD');

        // 找到 DOM 元素，改用隕石動畫
        var symbols = DragonWolf.Reels.strips[pos.reel].querySelectorAll('.dw-symbol');
        var cell = symbols[pos.row];
        if (cell) {
            cell.classList.remove('dw-wild-placed');
            cell.classList.add('dw-wild-meteor');
        }

        // 350ms 後：隕石著地 → 撞擊音效 + 衝擊波紋 + 強震
        setTimeout(function() {
            if (cell) {
                cell.classList.remove('dw-wild-meteor');
                cell.classList.add('dw-wild-impact');
            }
            // 著地撞擊音效（比飛行中更震撼）
            try { DragonWolf.Audio.play('meteor_impact'); } catch(e) {}
            // 著地強震（120ms）
            if (reelGrid) {
                reelGrid.classList.add('dw-screen-shake');
                setTimeout(function() {
                    reelGrid.classList.remove('dw-screen-shake');
                }, 120);
            }
        }, 350);

        // 間隔 300ms 遞迴下一個位置（稍慢，每顆隕石更有存在感）
        setTimeout(function() {
            self._placeWildsMeteor(positions, index + 1, onComplete);
        }, 300);
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
