/**
 * SlotGame UI Module
 * DOM manipulation, event listeners, display updates.
 */
SlotGame.UI = {
    // DOM element references
    els: {},

    /**
     * Initialize UI - cache DOM references and bind events.
     */
    init: function() {
        var self = this;

        // Cache elements
        this.els = {
            balance: document.getElementById('balance'),
            winAmount: document.getElementById('win-amount'),
            betPerLine: document.getElementById('bet-per-line'),
            activeLines: document.getElementById('active-lines'),
            totalBet: document.getElementById('total-bet'),
            btnSpin: document.getElementById('btn-spin'),
            btnBetUp: document.getElementById('btn-bet-up'),
            btnBetDown: document.getElementById('btn-bet-down'),
            btnMaxBet: document.getElementById('btn-max-bet'),
            btnAutoSpin: document.getElementById('btn-auto-spin'),
            btnTurbo: document.getElementById('btn-turbo'),
            btnPaytable: document.getElementById('btn-paytable'),
            btnSound: document.getElementById('btn-sound'),
            messageDisplay: document.getElementById('message-display'),
            // Free spins
            freeSpinsIntro: document.getElementById('free-spins-intro'),
            fsAwarded: document.getElementById('fs-awarded'),
            fsMultiplier: document.getElementById('fs-multiplier'),
            btnFsStart: document.getElementById('btn-fs-start'),
            freeSpinsHud: document.getElementById('free-spins-hud'),
            fsRemaining: document.getElementById('fs-remaining'),
            fsTotal: document.getElementById('fs-total'),
            fsWinAmount: document.getElementById('fs-win-amount'),
            freeSpinsSummary: document.getElementById('free-spins-summary'),
            fsSummaryAmount: document.getElementById('fs-summary-amount'),
            btnFsCollect: document.getElementById('btn-fs-collect'),
            // Bonus
            bonusOverlay: document.getElementById('bonus-overlay'),
            bonusPicks: document.getElementById('bonus-picks'),
            bonusGrid: document.getElementById('bonus-grid'),
            bonusWinAmount: document.getElementById('bonus-win-amount'),
            btnBonusCollect: document.getElementById('btn-bonus-collect'),
            // Jackpot
            jackpotOverlay: document.getElementById('jackpot-overlay'),
            jackpotWinAmount: document.getElementById('jackpot-win-amount'),
            btnJackpotCollect: document.getElementById('btn-jackpot-collect'),
            // Paytable
            paytableOverlay: document.getElementById('paytable-overlay'),
            paytableContent: document.getElementById('paytable-content'),
            paytableClose: document.getElementById('paytable-close'),
        };

        // Bind events
        this.els.btnSpin.addEventListener('click', function() { handleReelAreaAction(); });
        this.els.btnBetUp.addEventListener('click', function() { self.changeBet(1); });
        this.els.btnBetDown.addEventListener('click', function() { self.changeBet(-1); });
        this.els.btnMaxBet.addEventListener('click', function() { self.setMaxBet(); });
        this.els.btnAutoSpin.addEventListener('click', function() { self.toggleAutoSpin(); });
        this.els.btnTurbo.addEventListener('click', function() { self.toggleTurbo(); });
        this.els.btnSound.addEventListener('click', function() { self.toggleSound(); });
        this.els.btnPaytable.addEventListener('click', function() { self.showPaytable(); });
        this.els.paytableClose.addEventListener('click', function() { self.hidePaytable(); });
        this.els.paytableOverlay.addEventListener('click', function(e) {
            if (e.target === self.els.paytableOverlay) self.hidePaytable();
        });

        // Free spins events
        this.els.btnFsStart.addEventListener('click', function() { SlotGame.Main.startFreeSpins(); });
        this.els.btnFsCollect.addEventListener('click', function() { SlotGame.Main.collectFreeSpins(); });

        // Jackpot collect
        this.els.btnJackpotCollect.addEventListener('click', function() { SlotGame.Main.collectJackpot(); });

        // Cooldown to prevent accidental double-spin from rapid taps
        var lastActionTime = 0;
        var ACTION_COOLDOWN = 500; // ms

        function handleReelAreaAction() {
            var now = Date.now();
            var phase = SlotGame.State.phase;
            if (phase === 'IDLE') {
                if (now - lastActionTime < ACTION_COOLDOWN) return;
                lastActionTime = now;
                SlotGame.Main.onSpin();
            } else if (phase === 'SPINNING') {
                lastActionTime = now;
                SlotGame.Reels.slamStop();
            } else if (phase === 'SHOWING_WINS') {
                SlotGame.Main.onWinsShown();
            }
        }

        // Tap reel area to spin, slam stop, or skip win display
        document.getElementById('reel-area').addEventListener('click', function(e) {
            if (e.target.closest('#free-spins-hud')) return;
            handleReelAreaAction();
        });

        // Keyboard: Space = spin, slam stop, or skip wins
        document.addEventListener('keydown', function(e) {
            if (e.code === 'Space') {
                e.preventDefault();
                handleReelAreaAction();
            }
        });

        // Initial display update
        this.updateAll();
        this.buildPaytable();
    },

    /**
     * Update all display elements.
     */
    updateAll: function() {
        this.updateBalance();
        this.updateBet();
        this.updateWin(0);
        this.updateSpinButton();
        this.updateSoundButton();
        this.updateTurboButton();
    },

    updateBalance: function() {
        this.els.balance.textContent = SlotGame.State.balance.toLocaleString();
    },

    updateBet: function() {
        this.els.betPerLine.textContent = SlotGame.State.betPerLine;
        this.els.totalBet.textContent = SlotGame.State.totalBet;
        this.els.activeLines.textContent = SlotGame.Config.ACTIVE_LINES;
    },

    updateWin: function(amount) {
        this.els.winAmount.textContent = amount > 0 ? amount.toLocaleString() : '0';
    },

    updateSpinButton: function() {
        var state = SlotGame.State;
        var btn = this.els.btnSpin;

        // Remove previous state classes
        btn.classList.remove('spin-btn--stop', 'spin-btn--skip');

        if (state.phase === 'SPINNING') {
            btn.disabled = false;
            btn.textContent = 'STOP';
            btn.classList.add('spin-btn--stop');
        } else if (state.phase === 'EVALUATING' || state.phase === 'SHOWING_WINS') {
            btn.disabled = false;
            btn.textContent = 'SKIP';
            btn.classList.add('spin-btn--skip');
        } else if (state.phase === 'IDLE' && state.balance < state.totalBet) {
            btn.disabled = true;
            btn.textContent = 'SPIN';
        } else {
            btn.disabled = false;
            btn.textContent = state.inFreeSpins ? 'FREE' : 'SPIN';
        }

        // Disable bet controls during spin
        var canChangeBet = state.phase === 'IDLE' && !state.inFreeSpins;
        this.els.btnBetUp.disabled = !canChangeBet;
        this.els.btnBetDown.disabled = !canChangeBet;
        this.els.btnMaxBet.disabled = !canChangeBet;
    },

    updateSoundButton: function() {
        this.els.btnSound.textContent = SlotGame.State.soundEnabled ? 'SOUND: ON' : 'SOUND: OFF';
    },

    updateTurboButton: function() {
        if (SlotGame.State.turboMode) {
            this.els.btnTurbo.classList.add('active');
        } else {
            this.els.btnTurbo.classList.remove('active');
        }
    },

    /**
     * Change bet level.
     * @param {number} direction - +1 or -1
     */
    changeBet: function(direction) {
        var state = SlotGame.State;
        var newIndex = state.betIndex + direction;
        if (newIndex >= 0 && newIndex < SlotGame.Config.BET_LEVELS.length) {
            state.betIndex = newIndex;
            this.updateBet();
            this.updateSpinButton();
            if (SlotGame.Audio) SlotGame.Audio.buttonClick();
        }
    },

    setMaxBet: function() {
        SlotGame.State.betIndex = SlotGame.Config.BET_LEVELS.length - 1;
        this.updateBet();
        this.updateSpinButton();
        if (SlotGame.Audio) SlotGame.Audio.buttonClick();
    },

    toggleAutoSpin: function() {
        var state = SlotGame.State;
        if (state.autoSpinActive) {
            state.autoSpinActive = false;
            state.autoSpinCount = 0;
            this.els.btnAutoSpin.classList.remove('active');
            this.els.btnAutoSpin.textContent = 'AUTO';
        } else {
            state.autoSpinActive = true;
            state.autoSpinCount = 100; // 100 auto spins
            this.els.btnAutoSpin.classList.add('active');
            this.els.btnAutoSpin.textContent = 'STOP';
            // Trigger first spin if idle
            if (state.phase === 'IDLE') {
                SlotGame.Main.onSpin();
            }
        }
        if (SlotGame.Audio) SlotGame.Audio.buttonClick();
    },

    toggleTurbo: function() {
        SlotGame.State.turboMode = !SlotGame.State.turboMode;
        this.updateTurboButton();
        SlotGame.State.save();
        if (SlotGame.Audio) SlotGame.Audio.buttonClick();
    },

    toggleSound: function() {
        SlotGame.State.soundEnabled = !SlotGame.State.soundEnabled;
        this.updateSoundButton();
        SlotGame.State.save();
    },

    /**
     * Show a temporary message on the reel area.
     * @param {string} text
     * @param {number} duration - ms
     */
    showMessage: function(text, duration) {
        var el = this.els.messageDisplay;
        el.textContent = text;
        el.classList.add('show');
        setTimeout(function() {
            el.classList.remove('show');
        }, duration || 2000);
    },

    /**
     * Show line win info during win cycling.
     */
    showLineWin: function(amount, lineNumber) {
        this.els.winAmount.textContent = 'LINE ' + lineNumber + ': ' + amount.toLocaleString();
    },

    // === Free Spins UI ===

    showFreeSpinsIntro: function(count) {
        this.els.fsAwarded.textContent = count;
        this.els.fsMultiplier.textContent = SlotGame.Config.FREE_SPIN_MULTIPLIER;
        this.els.freeSpinsIntro.classList.add('active');
    },

    hideFreeSpinsIntro: function() {
        this.els.freeSpinsIntro.classList.remove('active');
    },

    showFreeSpinsHud: function() {
        this.els.freeSpinsHud.classList.remove('hidden');
        this.updateFreeSpinsHud();
    },

    hideFreeSpinsHud: function() {
        this.els.freeSpinsHud.classList.add('hidden');
    },

    updateFreeSpinsHud: function() {
        var state = SlotGame.State;
        this.els.fsRemaining.textContent = state.freeSpinsRemaining;
        this.els.fsTotal.textContent = state.freeSpinsTotal;
        this.els.fsWinAmount.textContent = state.freeSpinsWinnings.toLocaleString();
    },

    showFreeSpinsSummary: function(totalWin) {
        this.els.fsSummaryAmount.textContent = totalWin.toLocaleString();
        this.els.freeSpinsSummary.classList.add('active');
    },

    hideFreeSpinsSummary: function() {
        this.els.freeSpinsSummary.classList.remove('active');
    },

    // === Bonus Game UI ===

    showBonusOverlay: function() {
        var self = this;
        this.els.bonusOverlay.classList.add('active');
        this.els.btnBonusCollect.classList.add('hidden');
        this.els.bonusWinAmount.textContent = '0';
        this.updateBonusPicks();

        // Generate chest grid
        this.els.bonusGrid.innerHTML = '';
        for (var i = 0; i < SlotGame.Config.BONUS_CHEST_COUNT; i++) {
            (function(idx) {
                var chest = document.createElement('div');
                chest.className = 'bonus-chest';
                chest.setAttribute('data-index', idx);
                chest.innerHTML =
                    '<div class="bonus-chest-inner">' +
                    '<div class="bonus-chest-front">🎁</div>' +
                    '<div class="bonus-chest-back"></div>' +
                    '</div>';
                chest.addEventListener('click', function() {
                    SlotGame.Main.onBonusPick(idx);
                });
                self.els.bonusGrid.appendChild(chest);
            })(i);
        }
    },

    updateBonusPicks: function() {
        this.els.bonusPicks.textContent = SlotGame.State.bonusPicksRemaining;
    },

    revealChest: function(index, result) {
        var chests = this.els.bonusGrid.children;
        if (index >= chests.length) return;

        var chest = chests[index];
        var back = chest.querySelector('.bonus-chest-back');

        var label = '';
        switch (result.type) {
            case 'credit':
                label = result.winAmount.toLocaleString();
                back.style.color = '#00cc44';
                break;
            case 'extra_pick':
                label = '+1 PICK';
                back.style.color = '#00ccff';
                break;
            case 'collect':
                label = 'COLLECT';
                back.style.color = '#ff4444';
                break;
            case 'jackpot':
                label = 'JACKPOT!';
                back.style.color = '#ffd700';
                break;
        }
        back.textContent = label;
        chest.classList.add('revealed');

        this.els.bonusWinAmount.textContent = SlotGame.State.bonusTotalWin.toLocaleString();
        this.updateBonusPicks();
    },

    showBonusCollect: function() {
        this.els.btnBonusCollect.classList.remove('hidden');
    },

    hideBonusOverlay: function() {
        this.els.bonusOverlay.classList.remove('active');
    },

    // === Jackpot UI ===

    showJackpotOverlay: function(amount) {
        this.els.jackpotOverlay.classList.add('active');
        // Count up animation
        var el = this.els.jackpotWinAmount;
        var current = 0;
        var target = amount;
        var step = Math.max(1, Math.floor(target / 100));
        var interval = setInterval(function() {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(interval);
            }
            el.textContent = current.toLocaleString();
        }, 20);
    },

    hideJackpotOverlay: function() {
        this.els.jackpotOverlay.classList.remove('active');
    },

    // === Paytable ===

    buildPaytable: function() {
        var content = this.els.paytableContent;
        content.innerHTML = '';

        // Symbol payouts
        SlotGame.Config.symbols.forEach(function(sym) {
            var row = document.createElement('div');
            row.className = 'paytable-row';

            var symEl = document.createElement('div');
            symEl.className = 'paytable-symbol';
            var symImg = document.createElement('img');
            symImg.src = sym.img;
            symImg.alt = sym.name;
            symImg.draggable = false;
            symEl.appendChild(symImg);

            var nameEl = document.createElement('div');
            nameEl.className = 'paytable-name';
            nameEl.textContent = sym.name;

            var paysEl = document.createElement('div');
            paysEl.className = 'paytable-pays';

            if (sym.pay) {
                paysEl.innerHTML =
                    '<span>x3: ' + sym.pay[3] + '</span>' +
                    '<span>x4: ' + sym.pay[4] + '</span>' +
                    '<span>x5: ' + sym.pay[5] + '</span>';
            } else if (sym.id === SlotGame.Config.SCATTER_ID) {
                var fs = SlotGame.Config.scatterFreeSpins;
                paysEl.innerHTML =
                    '<span>x3: ' + fs[3] + ' FS</span>' +
                    '<span>x4: ' + fs[4] + ' FS</span>' +
                    '<span>x5: ' + fs[5] + ' FS</span>';
            }

            row.appendChild(symEl);
            row.appendChild(nameEl);
            row.appendChild(paysEl);
            content.appendChild(row);
        });

        // Feature descriptions
        var features = [
            { title: 'Wild', desc: 'Wild substitutes for all symbols except Scatter. 5 Wilds on middle row wins the JACKPOT!' },
            { title: 'Scatter', desc: '3+ Scatter symbols anywhere trigger Free Spins with ' + SlotGame.Config.FREE_SPIN_MULTIPLIER + 'x multiplier. Can retrigger during free spins.' },
            { title: 'Bonus Game', desc: '3+ Crown symbols on a payline trigger the Treasure Chest bonus game. Pick chests to reveal prizes!' },
            { title: 'Jackpot', desc: 'Progressive jackpot grows with ' + (SlotGame.Config.JACKPOT_CONTRIBUTION_RATE * 100) + '% of every bet. Win by getting 5 Wilds on the middle row.' },
        ];

        features.forEach(function(feat) {
            var section = document.createElement('div');
            section.className = 'paytable-section';
            section.innerHTML = '<h3>' + feat.title + '</h3><p>' + feat.desc + '</p>';
            content.appendChild(section);
        });
    },

    showPaytable: function() {
        this.els.paytableOverlay.classList.add('active');
    },

    hidePaytable: function() {
        this.els.paytableOverlay.classList.remove('active');
    },
};
