/**
 * Dragon Wolf UI Module
 * UI 事件綁定、Paytable、HUD 更新、返回大廳按鈕
 */
var DragonWolf = window.DragonWolf || {};

DragonWolf.UI = {

    init: function() {
        this._bindButtons();
        this.updateAll();
    },

    // ── 按鈕綁定 ──────────────────────────────────────────

    _bindButtons: function() {
        var self = this;

        // SPIN
        var spinBtn = document.getElementById('dw-btn-spin');
        if (spinBtn) {
            spinBtn.addEventListener('click', function() {
                DragonWolf.Main.onSpin();
            });
        }

        // MAX BET
        var maxBetBtn = document.getElementById('dw-btn-max-bet');
        if (maxBetBtn) {
            maxBetBtn.addEventListener('click', function() {
                if (DragonWolf.State.phase !== 'IDLE') return;
                DragonWolf.State.setMaxBet();
                self.updateBet();
            });
        }

        // BET -
        var betDown = document.getElementById('dw-btn-bet-down');
        if (betDown) {
            betDown.addEventListener('click', function() {
                if (DragonWolf.State.phase !== 'IDLE') return;
                DragonWolf.State.decreaseBet();
                self.updateBet();
            });
        }

        // BET +
        var betUp = document.getElementById('dw-btn-bet-up');
        if (betUp) {
            betUp.addEventListener('click', function() {
                if (DragonWolf.State.phase !== 'IDLE') return;
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

        // 點擊 reel area = slam stop
        var reelArea = document.getElementById('dw-reel-area');
        if (reelArea) {
            reelArea.addEventListener('click', function() {
                var state = DragonWolf.State;
                if (state.phase === 'SPINNING') {
                    DragonWolf.Main.onSlamStop();
                }
            });
        }
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

        var betMultEl  = document.getElementById('dw-bet-multiplier');
        var totalBetEl = document.getElementById('dw-total-bet');
        if (betMultEl)  betMultEl.textContent  = mult + 'x';
        if (totalBetEl) totalBetEl.textContent = bet.toLocaleString();
    },

    updateSpinButton: function() {
        var btn   = document.getElementById('dw-btn-spin');
        var state = DragonWolf.State;
        if (!btn) return;

        var canSpin = (state.phase === 'IDLE');
        var inFS    = state.inFreeSpins;

        btn.disabled = !canSpin;

        if (state.phase === 'SPINNING') {
            btn.textContent = 'STOP';
            btn.classList.add('dw-btn-stop');
        } else if (inFS && canSpin) {
            btn.textContent = 'FREE SPIN';
            btn.classList.remove('dw-btn-stop');
        } else {
            btn.textContent = 'SPIN';
            btn.classList.remove('dw-btn-stop');
        }
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
        html += '<p class="dw-pt-note">1024 Ways｜1注 = ' + cfg.BASE_BET + ' 分</p>';
        html += '<table class="dw-pt-table">';
        html += '<tr><th>符號</th><th>3 連</th><th>4 連</th><th>5 連</th></tr>';

        var baseSymbols = ['M2', 'M3', 'M4', 'A1', 'A2', 'A3', 'A4'];
        for (var i = 0; i < baseSymbols.length; i++) {
            var sym = baseSymbols[i];
            var pay = cfg.BASE_PAY[sym];
            html += '<tr>';
            html += '<td><img class="dw-pt-icon" src="' + cfg.SYMBOL_IMGS[sym] + '" alt="' + sym + '"> ' + cfg.SYMBOL_NAMES[sym] + '</td>';
            html += '<td>' + (pay[3] * 100).toFixed(0) + '×ways</td>';
            html += '<td>' + (pay[4] * 100).toFixed(0) + '×ways</td>';
            html += '<td>' + (pay[5] * 100).toFixed(0) + '×ways</td>';
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
            html += '<td>' + (fpay[3] * 100).toFixed(0) + '×ways</td>';
            html += '<td>' + (fpay[4] * 100).toFixed(0) + '×ways</td>';
            html += '<td>' + (fpay[5] * 100).toFixed(0) + '×ways</td>';
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
