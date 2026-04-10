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

        // === Debug Panel（僅 ?debug=1 時啟用）===
        var debugEnabled = /[?&]debug=1/.test(window.location.search);
        var debugPanel = debugEnabled ? document.getElementById('dw-debug-panel') : null;
        var debugLog = [];
        var t0 = Date.now();
        function dbg(msg) {
            if (!debugEnabled) return;
            var elapsed = Date.now() - t0;
            var line = elapsed + 'ms: ' + msg;
            debugLog.push(line);
            if (debugPanel) {
                debugPanel.style.display = 'block';
                debugPanel.textContent = debugLog.join('\n');
            }
        }
        dbg('playFSTransition START, spinCount=' + spinCount);

        var spinCountEl = document.getElementById('dw-trans-spin-count');
        if (spinCountEl) spinCountEl.textContent = '× ' + spinCount;

        // 將龍/狼圖片 src 複製到殘影 ghost div 的 background-image
        this._setupGhosts(el);
        dbg('setupGhosts done');

        // 停止 Base Game BGM（轉場動畫期間靜音，結束後才播 Free BGM）
        try { DragonWolf.Audio.bgmStop(); } catch(e) {}

        // 先移除 hidden 讓元素進入 layout，再加 playing 觸發動畫
        dbg('remove hidden');
        el.classList.remove('hidden');
        // 強制 reflow 後加動畫 class（比 rAF 更可靠）
        void el.offsetWidth;
        dbg('add dw-trans-playing');
        el.classList.add('dw-trans-playing');

        // 郎君綻放完成時播放狂笑（1.8s，與郎君出現同步）
        // 音效用 setTimeout OK — 音效不影響視覺，延遲也無大礙
        setTimeout(function() {
            dbg('2000ms: laugh timer fired');
            try { DragonWolf.Audio.play('laugh'); } catch(e) {}
        }, 2000);

        // Cleanup：移除 class、隱藏 overlay
        // CSS 動畫在 5s 完成（4.2s delay + 0.8s），5.5s cleanup
        var cleaned = false;
        function cleanup() {
            if (cleaned) return;
            cleaned = true;
            dbg('cleanup: removing classes');
            el.classList.remove('dw-trans-playing');
            el.classList.add('hidden');
            if (debugPanel) {
                debugPanel.scrollTop = debugPanel.scrollHeight;
                setTimeout(function() { debugPanel.style.display = 'none'; }, 15000);
            }
            // 重置子元素的 animation 狀態（移除 playing 後 animation 自動停止）
            setTimeout(function() {
                if (onComplete) onComplete();
            }, 100);
        }

        // 主 cleanup timer：5.5s（CSS 淡出在 4.2+0.8=5s 完成）
        setTimeout(cleanup, DragonWolf.Config.FS_TRANSITION_DURATION);
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
     * 播放黑白郎君發氣功動畫（分級聚氣），並以隕石墜落方式放置 Wild
     * @param {string[][]} grid      - 直接修改的 grid
     * @param {number}     wildCount - 預先決定的百搭數量（由 randomWilds.previewCount 取得）
     * @param {Function}   onComplete - ({ positions, count }) 動畫結束後呼叫
     */
    playQigong: function(grid, wildCount, onComplete) {
        var self     = this;
        var reelGrid = document.getElementById('dw-reel-grid');
        var qigongEl = document.getElementById('dw-qigong-overlay');
        var ballEl   = document.getElementById('dw-qg-ball');

        // 決定 tier（聚氣時間）
        var tier;
        if      (wildCount <= 4) { tier = 1; }
        else if (wildCount <= 8) { tier = 2; }
        else                     { tier = 3; }

        // tier 對應的聚氣時長（enter 0.5s 之後的純聚氣時間）
        var CHARGE_MS = [0, 1500, 3500, 6500][tier];
        var FIRE_AT   = 500 + CHARGE_MS;   // 發射時間（ms from start）

        // 設定球大小
        var ballSize = ['', 'dw-ball-small', 'dw-ball-medium', 'dw-ball-large'][tier];

        // ── 顯示 overlay，加入 tier class ──
        if (qigongEl) {
            qigongEl.classList.remove('hidden', 'dw-tier1', 'dw-tier2', 'dw-tier3');
            void qigongEl.offsetWidth;
            qigongEl.classList.add('dw-qigong-active', 'dw-tier' + tier);
        }
        if (ballEl) {
            ballEl.classList.remove('dw-ball-small', 'dw-ball-medium', 'dw-ball-large', 'dw-ball-fire');
            ballEl.classList.add(ballSize);
        }

        // ── Phase 1（500ms）：小震動 + 聚氣音效（依 tier 選對應音檔）──
        var _tier = tier; // closure capture
        setTimeout(function() {
            if (reelGrid) reelGrid.classList.add('dw-screen-shake-small');
            try { DragonWolf.Audio.play('qigong_' + _tier); } catch(e) {}
        }, 500);

        // ── Phase 2 切換（2500ms，tier 2/3）：中震動 ──
        if (tier >= 2) {
            setTimeout(function() {
                if (reelGrid) {
                    reelGrid.classList.remove('dw-screen-shake-small');
                    reelGrid.classList.add('dw-screen-shake-medium');
                }
            }, 2500);
        }

        // ── Phase 3 切換（4500ms，tier 3）：大震動 ──
        if (tier >= 3) {
            setTimeout(function() {
                if (reelGrid) {
                    reelGrid.classList.remove('dw-screen-shake-medium');
                    reelGrid.classList.add('dw-screen-shake-large');
                }
            }, 4500);
        }

        // ── 發射（FIRE_AT）：停震 + 音效 + 計算 Wild + 發球 ──
        var result;
        setTimeout(function() {
            if (reelGrid) reelGrid.classList.remove('dw-screen-shake-small', 'dw-screen-shake-medium', 'dw-screen-shake-large');
            try { DragonWolf.Audio.play('palm_hit'); } catch(e) {}
            result = DragonWolf.Features.randomWilds.apply(grid);

            if (ballEl) {
                void ballEl.offsetWidth;
                ballEl.classList.add('dw-ball-fire');
            }
        }, FIRE_AT);

        // ── 隕石墜落放置 Wild（發射後 700ms）──
        setTimeout(function() {
            var fireTime = Date.now();
            self._placeWildsMeteor(result.positions, 0, function() {
                var elapsed  = Date.now() - fireTime;
                var waitMore = Math.max(0, 1800 - elapsed);
                setTimeout(function() {
                    if (qigongEl) {
                        qigongEl.classList.remove('dw-qigong-active', 'dw-tier1', 'dw-tier2', 'dw-tier3');
                        qigongEl.classList.add('hidden');
                    }
                    if (ballEl) {
                        ballEl.classList.remove('dw-ball-small', 'dw-ball-medium', 'dw-ball-large', 'dw-ball-fire');
                    }
                    if (onComplete) onComplete(result);
                }, waitMore);
            });
        }, FIRE_AT + 700);
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

    playRetrigger: function(addedSpins, onComplete) {
        var el = document.getElementById('dw-retrigger-overlay');
        if (!el) { if (onComplete) onComplete(); return; }
        var countEl = el.querySelector('.dw-retrigger-count');
        if (countEl) countEl.textContent = '+' + addedSpins;
        el.classList.remove('hidden');
        el.classList.add('dw-retrigger-active');
        try { DragonWolf.Audio.play('scatter'); } catch(e) {}
        var duration = (typeof DragonWolf !== 'undefined' && DragonWolf.Audio && DragonWolf.Audio.getScatterDuration)
            ? Math.round(DragonWolf.Audio.getScatterDuration() * 1000)
            : 3000;
        setTimeout(function() {
            el.classList.remove('dw-retrigger-active');
            el.classList.add('hidden');
            if (onComplete) onComplete();
        }, duration);
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
