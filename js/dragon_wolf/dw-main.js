/**
 * Dragon Wolf Main Module
 * 遊戲主流程、狀態機、與 Platform 生命週期整合
 *
 * 狀態機：
 *   IDLE → SPINNING → EVALUATING
 *     → RANDOM_WILDS（M1 觸發隨機百搭）
 *     → FEATURE_PENDING（Scatter 高亮 2s）
 *     → FREE_SPINS_INTRO（FS 轉場動畫）
 *     → SHOWING_WINS → IDLE
 */
var DragonWolf = window.DragonWolf || {};

DragonWolf.Main = {
    _initialized:    false,
    _showWinsTimer:  null,

    // ── 初始化 ────────────────────────────────────────────

    init: function() {
        // 預載符號圖片（PNG 比 SVG 大，避免首次顯示閃爍）
        var imgs = DragonWolf.Config.SYMBOL_IMGS;
        for (var key in imgs) {
            if (imgs.hasOwnProperty(key)) {
                var preload = new Image();
                preload.src = imgs[key];
            }
        }

        DragonWolf.State.init();
        DragonWolf.Audio.init();
        DragonWolf.RNG.init();
        DragonWolf.Reels.init();
        DragonWolf.UI.init();

        // 啟動 BGM
        if (DragonWolf.State.musicEnabled) {
            try { DragonWolf.Audio.bgmStart('base'); } catch(e) {}
        }

        // 餘額不足時補充
        if (DragonWolf.State.balance <= 0) {
            SlotGame.Platform.setBalance(10000);
            DragonWolf.State.syncFromPlatform();
            DragonWolf.UI.updateBalance();
        }
    },

    // ── 清理 ──────────────────────────────────────────────

    cleanup: function() {
        DragonWolf.State.phase = 'IDLE';
        DragonWolf.State.inFreeSpins = false;
        DragonWolf.Features.freeSpins.end();
        clearTimeout(this._showWinsTimer);
        try { DragonWolf.Audio.bgmStop(); } catch(e) {}
        DragonWolf.Reels.clearHighlights();
        DragonWolf.Animations.stopWinCycle();
        DragonWolf.State.syncToPlatform();
        // 注意：不重設 _initialized，避免重新進入時重複綁定 button 事件監聽器
        // router.js 的 else branch 已處理重入時的狀態同步
    },

    // ── Spin 主流程 ───────────────────────────────────────

    onSpin: function() {
        var state = DragonWolf.State;
        if (state.phase !== 'IDLE') return;
        DragonWolf.UI.resetSlamStop();  // 確保 AUTO/Free Spins 自動發局時急停旗標正確重置

        var isFree = state.inFreeSpins;

        if (!isFree) {
            // 檢查餘額
            if (state.balance < state.getBet()) {
                DragonWolf.UI.showMessage('餘額不足！', 2000);
                return;
            }
            // 扣注
            state.deductBet();
        } else {
            // 使用一次 Free Spin
            DragonWolf.Features.freeSpins.useOne();
            DragonWolf.UI.updateFreeSpinsHud();
        }

        // 清除上一局高亮
        DragonWolf.Animations.stopWinCycle();
        DragonWolf.Reels.clearHighlights();
        DragonWolf.UI.updateWin(0);
        DragonWolf.UI.updateBalance();

        state.phase = 'SPINNING';
        state.win   = 0;
        DragonWolf.UI.updateSpinButton();
        DragonWolf.UI.updateReturnButton();

        // 產生目標 grid，並立即存入 State，確保 slamStop 拿到的是本局新 grid
        // （而非上一局被 M1 randomWilds.apply 修改過的舊 grid）
        var targetGrid = DragonWolf.RNG.generateGrid(isFree);
        DragonWolf.State.grid = targetGrid;

        // 啟動滾輪
        DragonWolf.Reels.spin(targetGrid, function() {
            DragonWolf.Main.onReelsStopped(targetGrid, isFree);
        });
    },

    // ── Slam Stop ─────────────────────────────────────────

    onSlamStop: function() {
        if (DragonWolf.State.phase !== 'SPINNING') return;
        var isFree     = DragonWolf.State.inFreeSpins;
        var targetGrid = DragonWolf.State.grid || DragonWolf.RNG.generateGrid(isFree);

        DragonWolf.Reels.slamStop(targetGrid, function() {
            DragonWolf.Main.onReelsStopped(targetGrid, isFree);
        });
    },

    // ── 滾輪停止後評估 ────────────────────────────────────

    onReelsStopped: function(grid, isFree) {
        var state  = DragonWolf.State;
        state.phase = 'EVALUATING';

        var result = DragonWolf.Paylines.evaluate(grid, state.getBet(), isFree);

        // M1 隨機百搭（Free Game 限定）
        if (result.m1Triggered) {
            this._handleM1Feature(grid, result, isFree);
            return;
        }

        this._continueAfterEval(grid, result, isFree);
    },

    // ── M1 隨機百搭流程 ───────────────────────────────────

    _handleM1Feature: function(grid, result, isFree) {
        var state = DragonWolf.State;
        state.phase = 'RANDOM_WILDS';
        DragonWolf.UI.updateSpinButton();
        DragonWolf.UI.updateReturnButton();

        // 高亮 M1 連線
        DragonWolf.Reels.highlightM1Wins(result.wins);

        DragonWolf.Animations.playQigong(grid, function(wildResult) {
            // 重新評估（grid 已被修改）
            var newResult = DragonWolf.Paylines.evaluate(grid, state.getBet(), isFree);
            DragonWolf.Main._continueAfterEval(grid, newResult, isFree);
        });
    },

    // ── 評估完成後的流程分派 ──────────────────────────────

    _continueAfterEval: function(grid, result, isFree) {
        var state = DragonWolf.State;

        // 累積贏分
        state.win = result.totalWin;
        if (result.totalWin > 0) {
            if (isFree) {
                DragonWolf.Features.freeSpins.addWinnings(result.totalWin);
            }
            state.addWin(result.totalWin);
            DragonWolf.UI.updateBalance();
            DragonWolf.UI.updateWin(result.totalWin);
            // 贏分音效
            var betAmt = state.getBet();
            if (result.totalWin >= betAmt * 5) {
                try { DragonWolf.Audio.play('win_big'); } catch(e) {}
            } else {
                try { DragonWolf.Audio.play('win_small'); } catch(e) {}
            }
        }

        // Scatter 觸發 Free Spins
        if (!isFree && result.scatterCount >= 3) {
            state.phase = 'FEATURE_PENDING';
            DragonWolf.UI.updateSpinButton();
            DragonWolf.UI.updateReturnButton();

            // 先播 win cycle 結算 Base Game 贏分，再播 Scatter 高亮 + 轉場動畫
            var proceedToScatter = function() {
                DragonWolf.Reels.highlightScatters(result.scatterPositions);
                try { DragonWolf.Audio.play('scatter'); } catch(e) {}

                setTimeout(function() {
                    DragonWolf.Main._startFreeSpins(
                        DragonWolf.Config.SCATTER_FREE_SPINS
                    );
                }, 2000);
            };

            if (result.wins.length > 0) {
                DragonWolf.Reels.highlightWins(result.wins);
                DragonWolf.Animations.startWinCycle(result.wins, function() {
                    DragonWolf.Reels.clearWinHighlights();
                    proceedToScatter();
                });
            } else {
                proceedToScatter();
            }
            return;
        }

        // Free Spins Retrigger
        if (isFree && result.scatterCount >= 3) {
            var addSpins = DragonWolf.Config.SCATTER_RETRIGGER;
            DragonWolf.Features.freeSpins.addSpins(addSpins);
            DragonWolf.UI.updateFreeSpinsHud();
            DragonWolf.Animations.playRetrigger(addSpins);
        }

        // 顯示勝利
        if (result.wins.length > 0) {
            state.phase = 'SHOWING_WINS';
            DragonWolf.UI.updateSpinButton();
            DragonWolf.UI.updateReturnButton();

            DragonWolf.Reels.highlightWins(result.wins);

            DragonWolf.Animations.startWinCycle(result.wins, function() {
                DragonWolf.Main.onWinsShown(isFree);
            });
        } else {
            if (isFree && !DragonWolf.Features.freeSpins.isActive()) {
                this._endFreeSpins();
            } else {
                this._toIdle(isFree);
            }
        }
    },

    // ── 勝利展示完畢 ──────────────────────────────────────

    onWinsShown: function(isFree) {
        DragonWolf.Reels.clearWinHighlights();

        // 繼續 Free Spins 或回 IDLE
        if (isFree && DragonWolf.Features.freeSpins.isActive()) {
            this._toIdle(true);
        } else if (isFree) {
            // Free Spins 結束
            this._endFreeSpins();
        } else {
            this._toIdle(false);
        }
    },

    // ── Free Spins 開始 ───────────────────────────────────

    _startFreeSpins: function(count) {
        var state = DragonWolf.State;
        state.phase = 'FREE_SPINS_INTRO';

        // 播放轉場動畫
        DragonWolf.Animations.playFSTransition(count, function() {
            DragonWolf.Features.freeSpins.start(count);
            state.inFreeSpins = true;

            // 切換為 Free Game BGM
            try { DragonWolf.Audio.bgmSetMode('free'); } catch(e) {}

            // 更新 HUD
            DragonWolf.UI.updateFreeSpinsHud();
            DragonWolf.UI.updateSpinButton();
            DragonWolf.UI.updateReturnButton();

            DragonWolf.Main._toIdle(true);
        });
    },

    // ── Free Spins 結束 ───────────────────────────────────

    _endFreeSpins: function() {
        var state    = DragonWolf.State;
        var totalWin = DragonWolf.Features.freeSpins.end();
        state.inFreeSpins = false;

        // 更新 HUD
        DragonWolf.UI.updateFreeSpinsHud();

        // 播放 FS 總結，玩家按「收取」後才切回 Base Game BGM
        DragonWolf.Animations.playFSSummary(totalWin, function() {
            try { DragonWolf.Audio.bgmSetMode('base'); } catch(e) {}
            DragonWolf.Main._toIdle(false);
        });
    },

    // ── 回到 IDLE ────────────────────────────────────────

    _toIdle: function(isFreeContext) {
        var state = DragonWolf.State;
        state.phase = 'IDLE';

        DragonWolf.UI.updateSpinButton();
        DragonWolf.UI.updateReturnButton();
        DragonWolf.UI.updateBalance();

        // 如果 Free Spins 中還有局數，自動開始下一局
        if (isFreeContext && DragonWolf.Features.freeSpins.isActive()) {
            DragonWolf.UI.updateFreeSpinsHud();
            setTimeout(function() { DragonWolf.Main.onSpin(); }, 500);
            return;
        }

        // AUTO 模式：非 Free Spins 情境下自動觸發下一把
        if (!isFreeContext && DragonWolf.UI._autoMode) {
            if (state.balance >= state.getBet()) {
                setTimeout(function() { DragonWolf.Main.onSpin(); }, 300);
            } else {
                // 餘額不足，取消 AUTO
                DragonWolf.UI._autoMode = false;
                DragonWolf.UI.updateAutoButton();
            }
        }
    },

    // ── 返回大廳 ──────────────────────────────────────────

    returnToLobby: function() {
        var state = DragonWolf.State;
        if (state.phase !== 'IDLE') return;
        if (state.inFreeSpins) return;

        // 取消 AUTO 模式
        DragonWolf.UI._autoMode = false;
        DragonWolf.UI.updateAutoButton();

        state.syncToPlatform();
        try { DragonWolf.Audio.bgmStop(); } catch(e) {}
        SlotGame.Router.goToLobby();
    }
};
