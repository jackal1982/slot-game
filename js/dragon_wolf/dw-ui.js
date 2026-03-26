/**
 * Dragon Wolf UI Module
 * UI 事件綁定、Paytable、HUD 更新、返回大廳按鈕
 */
var DragonWolf = window.DragonWolf || {};

DragonWolf.UI = {

    _autoMode: false,       // AUTO 自動旋轉模式
    _slamStopFired: false,  // 防止 SPINNING 期間多次觸發 slamStop（模組層級，供 onSpin 重置）
    _buttonsBound: false,   // 防止重複綁定事件監聽器

    init: function() {
        if (!this._buttonsBound) {
            this._bindButtons();
            this._buttonsBound = true;
        }
        this.updateAll();
    },

    // ── 按鈕綁定 ──────────────────────────────────────────

    _bindButtons: function() {
        var self = this;

        // SPIN / STOP / SKIP
        var _btnSpinStartTime = 0;
        var spinBtn = document.getElementById('dw-btn-spin');
        if (spinBtn) {
            spinBtn.addEventListener('click', function() {
                var phase = DragonWolf.State.phase;
                if (phase === 'IDLE') {
                    _btnSpinStartTime = Date.now();
                    DragonWolf.Main.onSpin();
                } else if (phase === 'SPINNING') {
                    if (Date.now() - _btnSpinStartTime < 800) return;  // 最低旋轉時間保護
                    DragonWolf.Main.onSlamStop();
                } else if (phase === 'SHOWING_WINS') {
                    var isFree = DragonWolf.State.inFreeSpins;
                    DragonWolf.Animations.stopWinCycle();
                    DragonWolf.Main.onWinsShown(isFree);
                }
            });
        }

        // MAX BET / BET -/+ 共用 debounce
        var _lastBetClickTime = 0;
        var BET_DEBOUNCE = 150;  // 150ms 防止快速連點值亂跳

        // MAX BET
        var maxBetBtn = document.getElementById('dw-btn-max-bet');
        if (maxBetBtn) {
            maxBetBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (DragonWolf.State.phase !== 'IDLE') return;
                var now = Date.now();
                if (now - _lastBetClickTime < BET_DEBOUNCE) return;
                _lastBetClickTime = now;
                DragonWolf.State.setMaxBet();
                self.updateBet();
            });
        }

        // BET -
        var betDown = document.getElementById('dw-btn-bet-down');
        if (betDown) {
            betDown.addEventListener('click', function(e) {
                e.stopPropagation();
                if (DragonWolf.State.phase !== 'IDLE') return;
                var now = Date.now();
                if (now - _lastBetClickTime < BET_DEBOUNCE) return;
                _lastBetClickTime = now;
                DragonWolf.State.decreaseBet();
                self.updateBet();
            });
        }

        // BET +
        var betUp = document.getElementById('dw-btn-bet-up');
        if (betUp) {
            betUp.addEventListener('click', function(e) {
                e.stopPropagation();
                if (DragonWolf.State.phase !== 'IDLE') return;
                var now = Date.now();
                if (now - _lastBetClickTime < BET_DEBOUNCE) return;
                _lastBetClickTime = now;
                DragonWolf.State.increaseBet();
                self.updateBet();
            });
        }

        // SOUND
        var soundBtn = document.getElementById('dw-btn-sound');
        if (soundBtn) {
            soundBtn.addEventListener('click', function() {
                DragonWolf.State.toggleSound();
                var enabled = DragonWolf.State.soundEnabled;
                soundBtn.textContent = 'SOUND: ' + (enabled ? 'ON' : 'OFF');
                DragonWolf.Audio.setSoundEnabled(enabled);
            });
        }

        // MUSIC
        var musicBtn = document.getElementById('dw-btn-music');
        if (musicBtn) {
            musicBtn.addEventListener('click', function() {
                DragonWolf.State.toggleMusic();
                musicBtn.textContent = 'MUSIC: ' + (DragonWolf.State.musicEnabled ? 'ON' : 'OFF');
            });
        }

        // TURBO
        var turboBtn = document.getElementById('dw-btn-turbo');
        if (turboBtn) {
            turboBtn.addEventListener('click', function() {
                DragonWolf.State.toggleTurbo();
                turboBtn.classList.toggle('active', DragonWolf.State.turboMode);
            });
        }

        // AUTO
        var autoBtn = document.getElementById('dw-btn-auto');
        if (autoBtn) {
            autoBtn.addEventListener('click', function() {
                self.toggleAuto();
            });
        }

        // PAYTABLE
        var paytableBtn = document.getElementById('dw-btn-paytable');
        if (paytableBtn) {
            paytableBtn.addEventListener('click', function() {
                self._showPaytable();
            });
        }

        // PAYTABLE CLOSE
        var paytableClose = document.getElementById('dw-paytable-close');
        if (paytableClose) {
            paytableClose.addEventListener('click', function() {
                self._hidePaytable();
            });
        }

        // 返回大廳
        var returnBtn = document.getElementById('dw-btn-return-lobby');
        if (returnBtn) {
            returnBtn.addEventListener('click', function() {
                DragonWolf.Main.returnToLobby();
            });
        }

        // 點擊 reel area = spin / slam stop / skip wins
        var lastReelActionTime = 0;
        var _spinStartTime     = 0;       // spin 開始的時間戳
        var REEL_COOLDOWN      = 500;
        var MIN_SPIN_TIME      = 800;     // 最低旋轉時間，防止急拍急停
        var reelArea = document.getElementById('dw-reel-area');
        if (reelArea) {
            reelArea.addEventListener('click', function(e) {
                if (e.target.closest && e.target.closest('#dw-fs-hud')) return;
                var now   = Date.now();
                var state = DragonWolf.State;
                if (state.phase === 'IDLE') {
                    if (now - lastReelActionTime < REEL_COOLDOWN) return;
                    lastReelActionTime = now;
                    _spinStartTime     = now;  // 記錄 spin 開始時間
                    DragonWolf.Main.onSpin();
                } else if (state.phase === 'SPINNING') {
                    if (self._slamStopFired) return;  // 已觸發過，忽略後續點擊
                    if (now - _spinStartTime < MIN_SPIN_TIME) return;  // 最低旋轉時間保護
                    self._slamStopFired = true;
                    lastReelActionTime = now;
                    DragonWolf.Main.onSlamStop();
                } else if (state.phase === 'SHOWING_WINS') {
                    var isFreeSkip = state.inFreeSpins;
                    DragonWolf.Animations.stopWinCycle();
                    DragonWolf.Main.onWinsShown(isFreeSkip);
                }
            });
        }
    },

    // 重置急停旗標（由 onSpin 呼叫，確保 AUTO/Free Spins 自動發局時旗標正確重置）
    resetSlamStop: function() {
        this._slamStopFired = false;
    },

    // ── HUD 更新 ──────────────────────────────────────────

    updateAll: function() {
        this.updateBalance();
        this.updateBet();
        this.updateWin(0);
        this.updateSpinButton();
        this.updateFreeSpinsHud();
        this._updateSettings();
    },

    updateBalance: function() {
        var el = document.getElementById('dw-balance');
        if (el) el.textContent = DragonWolf.State.balance.toLocaleString();
    },

    updateWin: function(amount) {
        var el = document.getElementById('dw-win-amount');
        if (el) el.textContent = amount ? amount.toLocaleString() : '0';
    },

    updateBet: function() {
        var cfg  = DragonWolf.Config;
        var idx  = DragonWolf.State.betIndex;
        var mult = cfg.BET_MULTIPLIERS[idx];
        var bet  = cfg.BASE_BET * mult;

        var betMultEl     = document.getElementById('dw-bet-multiplier');
        var totalBetEl    = document.getElementById('dw-total-bet');
        var baseBetLblEl  = document.getElementById('dw-base-bet-label');
        if (betMultEl)    betMultEl.textContent  = mult + 'x';
        if (totalBetEl)   totalBetEl.textContent = bet.toLocaleString();
        if (baseBetLblEl) baseBetLblEl.textContent = bet.toLocaleString();
    },

    updateSpinButton: function() {
        var btn   = document.getElementById('dw-btn-spin');
        var state = DragonWolf.State;
        if (!btn) return;

        btn.classList.remove('dw-btn-stop');

        if (state.phase === 'SPINNING') {
            btn.disabled    = false;
            btn.textContent = 'STOP';
            btn.classList.add('dw-btn-stop');
        } else if (state.phase === 'SHOWING_WINS') {
            btn.disabled    = false;
            btn.textContent = 'SKIP';
        } else if (state.phase === 'IDLE') {
            var inFS = state.inFreeSpins;
            var noBalance = !inFS && (state.balance < state.getBet());
            btn.disabled    = noBalance;
            btn.textContent = inFS ? 'FREE SPIN' : 'SPIN';
            // 餘額不足時自動取消 AUTO 模式
            if (noBalance && this._autoMode) {
                this._autoMode = false;
                this.updateAutoButton();
            }
        } else {
            // EVALUATING / FEATURE_PENDING / FREE_SPINS_INTRO / RANDOM_WILDS
            btn.disabled    = true;
            btn.textContent = 'SPIN';
        }
    },

    toggleAuto: function() {
        var state = DragonWolf.State;
        this._autoMode = !this._autoMode;
        this.updateAutoButton();
        // 若目前在 IDLE 且不在 Free Spins 中，立即開始
        if (this._autoMode && state.phase === 'IDLE' && !state.inFreeSpins) {
            DragonWolf.Main.onSpin();
        }
    },

    updateAutoButton: function() {
        var btn = document.getElementById('dw-btn-auto');
        if (!btn) return;
        btn.classList.toggle('active', this._autoMode);
        btn.textContent = this._autoMode ? 'STOP' : 'AUTO';
    },

    updateFreeSpinsHud: function() {
        var hud       = document.getElementById('dw-fs-hud');
        var remaining = document.getElementById('dw-fs-remaining');
        var total     = document.getElementById('dw-fs-total');
        var winEl     = document.getElementById('dw-fs-win-amount');
        var fs        = DragonWolf.Features.freeSpins;

        if (!hud) return;

        if (DragonWolf.State.inFreeSpins && fs.isActive()) {
            hud.classList.remove('hidden');
            if (remaining) remaining.textContent = fs.getRemaining();
            if (total)     total.textContent     = fs.getTotal();
            if (winEl)     winEl.textContent      = fs.getWinnings().toLocaleString();
        } else {
            hud.classList.add('hidden');
        }
    },

    updateReturnButton: function() {
        var btn   = document.getElementById('dw-btn-return-lobby');
        var state = DragonWolf.State;
        if (!btn) return;
        var canReturn = (state.phase === 'IDLE' && !state.inFreeSpins);
        btn.disabled = !canReturn;
        btn.classList.toggle('disabled', !canReturn);
    },

    showMessage: function(msg, duration) {
        var el = document.getElementById('dw-message-display');
        if (!el) return;
        el.textContent = msg;
        el.classList.add('visible');
        clearTimeout(this._msgTimer);
        this._msgTimer = setTimeout(function() {
            el.classList.remove('visible');
        }, duration || 2000);
    },

    _updateSettings: function() {
        var state = DragonWolf.State;
        var sBtn  = document.getElementById('dw-btn-sound');
        var mBtn  = document.getElementById('dw-btn-music');
        var tBtn  = document.getElementById('dw-btn-turbo');
        if (sBtn) sBtn.textContent = 'SOUND: ' + (state.soundEnabled ? 'ON' : 'OFF');
        if (mBtn) mBtn.textContent = 'MUSIC: ' + (state.musicEnabled ? 'ON' : 'OFF');
        if (tBtn) tBtn.classList.toggle('active', state.turboMode);
        if (DragonWolf.Audio) {
            DragonWolf.Audio.setSoundEnabled(state.soundEnabled);
        }
    },

    // ── Paytable ──────────────────────────────────────────

    _showPaytable: function() {
        var overlay = document.getElementById('dw-paytable-overlay');
        if (!overlay) return;
        this._renderPaytable();
        overlay.classList.add('dw-overlay-active');
        overlay.classList.remove('hidden');
    },

    _hidePaytable: function() {
        var overlay = document.getElementById('dw-paytable-overlay');
        if (!overlay) return;
        overlay.classList.remove('dw-overlay-active');
        overlay.classList.add('hidden');
    },

    _renderPaytable: function() {
        var content = document.getElementById('dw-paytable-content');
        if (!content) return;
        var cfg = DragonWolf.Config;
        var html = '';

        html += '<div class="dw-pt-section">';
        html += '<h3 class="dw-pt-title">Base Game 賠率</h3>';
        html += '<p class="dw-pt-note">1024 Ways｜最小押注(' + cfg.BASE_BET + '分)每路贏分</p>';
        html += '<table class="dw-pt-table">';
        html += '<tr><th>符號</th><th>3 連</th><th>4 連</th><th>5 連</th></tr>';

        var baseSymbols = ['M2', 'M3', 'M4', 'A1', 'A2', 'A3', 'A4'];
        for (var i = 0; i < baseSymbols.length; i++) {
            var sym = baseSymbols[i];
            var pay = cfg.BASE_PAY[sym];
            html += '<tr>';
            html += '<td><img class="dw-pt-icon" src="' + cfg.SYMBOL_IMGS[sym] + '" alt="' + sym + '"> ' + cfg.SYMBOL_NAMES[sym] + '</td>';
            html += '<td>' + (pay[3] * cfg.BASE_BET).toFixed(0) + '</td>';
            html += '<td>' + (pay[4] * cfg.BASE_BET).toFixed(0) + '</td>';
            html += '<td>' + (pay[5] * cfg.BASE_BET).toFixed(0) + '</td>';
            html += '</tr>';
        }
        html += '</table>';
        html += '</div>';

        html += '<div class="dw-pt-section">';
        html += '<h3 class="dw-pt-title dw-pt-free">Free Game 賠率</h3>';
        html += '<p class="dw-pt-note dw-pt-free">M1 黑白郎君觸發隨機百搭特色</p>';
        html += '<table class="dw-pt-table">';
        html += '<tr><th>符號</th><th>3 連</th><th>4 連</th><th>5 連</th></tr>';

        var freeSymbols = ['M1', 'M4', 'A1', 'A2', 'A3', 'A4'];
        for (var j = 0; j < freeSymbols.length; j++) {
            var fsym = freeSymbols[j];
            var fpay = cfg.FREE_PAY[fsym];
            html += '<tr' + (fsym === 'M1' ? ' class="dw-pt-highlight"' : '') + '>';
            html += '<td><img class="dw-pt-icon" src="' + cfg.SYMBOL_IMGS[fsym] + '" alt="' + fsym + '"> ' + cfg.SYMBOL_NAMES[fsym] + '</td>';
            html += '<td>' + (fpay[3] * cfg.BASE_BET).toFixed(0) + '</td>';
            html += '<td>' + (fpay[4] * cfg.BASE_BET).toFixed(0) + '</td>';
            html += '<td>' + (fpay[5] * cfg.BASE_BET).toFixed(0) + '</td>';
            html += '</tr>';
        }
        html += '</table>';
        html += '</div>';

        html += '<div class="dw-pt-section">';
        html += '<h3 class="dw-pt-title">特殊符號</h3>';
        html += '<div class="dw-pt-special">';
        html += '<div class="dw-pt-special-item">';
        html += '<img class="dw-pt-icon-lg" src="' + cfg.SYMBOL_IMGS['SC'] + '" alt="SC">';
        html += '<div><b>幽靈馬車（Scatter）</b><br>軸 1~3 出現 3 個 → 觸發 Free Spins × 10<br>Free Spins 中再觸發 → +10 局（上限 50）</div>';
        html += '</div>';
        html += '<div class="dw-pt-special-item">';
        html += '<img class="dw-pt-icon-lg" src="' + cfg.SYMBOL_IMGS['WD'] + '" alt="WD">';
        html += '<div><b>太極（Wild）</b><br>可替代所有非 Scatter 符號<br>僅出現於軸 2~5</div>';
        html += '</div>';
        html += '<div class="dw-pt-special-item">';
        html += '<img class="dw-pt-icon-lg" src="' + cfg.SYMBOL_IMGS['M1'] + '" alt="M1">';
        html += '<div><b>黑白郎君（M1）</b><br>Free Game 限定最高價符號<br>3+ 連線 → 觸發隨機百搭特色<br>在軸 2~5 隨機放置 2~16 個 Wild</div>';
        html += '</div>';
        html += '</div>';
        html += '</div>';

        content.innerHTML = html;
    }
};
