/**
 * Dragon Wolf Animations Module
 * 勝利展示、FS 轉場動畫（4秒：黑龍白狼 → 黑白郎君）、隨機百搭放置動畫
 */
var DragonWolf = window.DragonWolf || {};

DragonWolf.Animations = {
    _winCycleTimer:    null,
    _winCycleIndex:    0,
    _winCycleWins:     null,
    _winCycleCallback: null,

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

    // ── FS 轉場動畫 ───────────────────────────────────────

    /**
     * 播放 Free Spins 進場轉場動畫（4秒：黑龍白狼靠近 → 霧氣 → 黑白郎君現身）
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

        // 播放音效
        try { DragonWolf.Audio.play('scatter'); } catch(e) {}
        try { DragonWolf.Audio.play('laugh'); } catch(e) {}

        el.classList.remove('hidden');
        el.classList.add('dw-trans-playing');

        // 4 秒後結束
        setTimeout(function() {
            el.classList.remove('dw-trans-playing');
            el.classList.add('hidden');
            // 短暫等待 CSS 結束動畫
            setTimeout(function() {
                el.style.opacity = '';
                if (onComplete) onComplete();
            }, 100);
        }, DragonWolf.Config.FS_TRANSITION_DURATION);
    },

    // ── 氣功（隨機百搭放置）動畫 ─────────────────────────

    /**
     * 播放黑白郎君發氣功動畫，並逐格放置 Wild
     * @param {string[][]} grid      - 直接修改的 grid
     * @param {Function}   onComplete - ({ positions, count }) 動畫結束後呼叫
     */
    playQigong: function(grid, onComplete) {
        var self = this;

        // 顯示氣功特效（double-rAF：先移除 display:none，再下一幀才加 opacity，確保 CSS transition 能執行）
        var qigongEl = document.getElementById('dw-qigong-overlay');
        if (qigongEl) {
            qigongEl.classList.remove('hidden');
            requestAnimationFrame(function() {
                requestAnimationFrame(function() {
                    qigongEl.classList.add('dw-qigong-active');
                });
            });
        }

        // 音效：笑聲
        try { DragonWolf.Audio.play('laugh'); } catch(e) {}

        // 0.5s 後開始放置 Wild
        setTimeout(function() {
            var result = DragonWolf.Features.randomWilds.apply(grid);

            // 逐格放置動畫：每個 Wild 間隔 150ms
            self._placeWildsSequentially(result.positions, 0, function() {
                // 隱藏氣功特效
                if (qigongEl) {
                    qigongEl.classList.remove('dw-qigong-active');
                    qigongEl.classList.add('hidden');
                }
                if (onComplete) onComplete(result);
            });
        }, 500);
    },

    _placeWildsSequentially: function(positions, index, onComplete) {
        var self = this;
        if (index >= positions.length) {
            if (onComplete) onComplete();
            return;
        }
        var pos = positions[index];
        // 更新畫面
        DragonWolf.Reels.updateCell(pos.reel, pos.row, 'WD');
        // 掌力打牆音效
        try { DragonWolf.Audio.play('palm_hit'); } catch(e) {}

        setTimeout(function() {
            self._placeWildsSequentially(positions, index + 1, onComplete);
        }, 150);
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

    playFSSummary: function(totalWin, onComplete) {
        // 顯示 FS 總結 overlay
        var el = document.getElementById('dw-fs-summary');
        if (!el) { if (onComplete) onComplete(); return; }
        var amtEl = document.getElementById('dw-fs-summary-amount');
        if (amtEl) amtEl.textContent = totalWin.toLocaleString();
        el.classList.remove('hidden');
        el.classList.add('dw-overlay-active');
        try { DragonWolf.Audio.play('win_big'); } catch(e) {}

        var btn = document.getElementById('dw-btn-fs-collect');
        if (btn) {
            btn.onclick = function() {
                el.classList.remove('dw-overlay-active');
                el.classList.add('hidden');
                if (onComplete) onComplete();
            };
        }
    }
};
