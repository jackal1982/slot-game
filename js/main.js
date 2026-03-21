/**
 * SlotGame Main Module
 * Bootstrap, game loop orchestration, and spin flow control.
 */
SlotGame.Main = {
    // Pending actions after win display
    pendingFreeSpins: 0,
    pendingBonus: false,
    pendingJackpot: false,
    pendingScatterPositions: null, // stored scatter positions for re-applying highlight after stopWinLines
    jackpotAmount: 0,
    _showWinsTimer: null,
    _initialized: false,

    /**
     * Initialize the game.
     */
    init: function() {
        // Init state (loads from localStorage)
        SlotGame.State.init();

        // Init audio (needs to be early but context created on first interaction)
        SlotGame.Audio.init();

        // Init reels (renders initial grid)
        SlotGame.Reels.init();

        // Init animations (canvas setup)
        SlotGame.Animations.init();

        // Init jackpot (starts ticker)
        SlotGame.Jackpot.init();

        // Init UI (binds events, updates display)
        SlotGame.UI.init();

        // Handle zero balance
        if (SlotGame.State.balance <= 0) {
            SlotGame.State.balance = SlotGame.Config.STARTING_BALANCE;
            SlotGame.State.save();
            SlotGame.UI.updateBalance();
        }
    },

    /**
     * Main spin handler - called when SPIN button is pressed.
     */
    onSpin: function() {
        var state = SlotGame.State;

        // Guard: can only spin in IDLE
        if (state.phase !== 'IDLE') return;

        // Check if in free spins
        var isFree = state.inFreeSpins;

        if (!isFree) {
            // Check balance
            if (state.balance < state.totalBet) {
                SlotGame.UI.showMessage('Insufficient Balance!', 2000);
                return;
            }

            // Deduct bet
            state.balance -= state.totalBet;

            // Jackpot contribution
            SlotGame.Jackpot.contribute(state.totalBet);
        } else {
            // Use one free spin
            SlotGame.Features.freeSpins.useOne();
            SlotGame.UI.updateFreeSpinsHud();
        }

        // Clear previous win display (including scatter/crown highlights from prior spin)
        SlotGame.Animations.stopWinLines();
        SlotGame.Reels.clearHighlights();
        SlotGame.UI.updateWin(0);
        SlotGame.UI.updateBalance();

        // Set phase
        state.phase = 'SPINNING';
        SlotGame.UI.updateSpinButton();

        // Generate target grid
        var targetGrid = SlotGame.RNG.generateGrid();

        // Start spinning
        SlotGame.Reels.spin(targetGrid, function() {
            // All reels stopped -> evaluate
            SlotGame.Main.onReelsStopped(targetGrid, isFree);
        });
    },

    /**
     * Called when all reels have stopped.
     * @param {number[][]} grid
     * @param {boolean} isFree - Whether this was a free spin
     */
    onReelsStopped: function(grid, isFree) {
        var state = SlotGame.State;
        state.phase = 'EVALUATING';

        // Evaluate wins
        var result = SlotGame.Paylines.evaluate(grid, state.betPerLine);
        var totalWin = result.totalPayout;

        // Apply free spin multiplier
        if (isFree) {
            totalWin *= SlotGame.Config.FREE_SPIN_MULTIPLIER;
        }

        // Store win details
        state.winDetails = result.wins;
        state.totalWin = totalWin;

        // Reset pending actions
        this.pendingFreeSpins = 0;
        this.pendingBonus = false;
        this.pendingJackpot = false;
        this.pendingScatterPositions = null;

        // Check scatter (free spins trigger)
        if (result.scatterCount >= 3) {
            var fsCount = SlotGame.Config.scatterFreeSpins[Math.min(result.scatterCount, 5)] || 10;
            this.pendingFreeSpins = fsCount;

            // Store scatter positions so we can re-apply highlight after stopWinLines() clears it
            this.pendingScatterPositions = result.scatterPositions;

            // Add cyan frame highlight for scatter positions (free spins trigger)
            SlotGame.Reels.highlightScatters(result.scatterPositions);
            SlotGame.Audio.scatterHit();
        }

        // Check bonus trigger
        if (result.bonusWin && !isFree) {
            this.pendingBonus = true;

            // Highlight Crown symbols that triggered the bonus
            if (result.bonusWin.positions && result.bonusWin.positions.length > 0) {
                SlotGame.Reels.highlightCrowns(result.bonusWin.positions);
            }
        }

        // Check jackpot (only during paid spins)
        if (!isFree && SlotGame.Jackpot.checkWin(grid, state.totalBet)) {
            this.pendingJackpot = true;
        }

        // Add winnings to balance
        state.balance += totalWin;
        if (isFree) {
            SlotGame.Features.freeSpins.addWinnings(totalWin);
            SlotGame.UI.updateFreeSpinsHud();
        }

        SlotGame.UI.updateBalance();
        SlotGame.UI.updateWin(totalWin);
        SlotGame.State.save();

        // Determine next phase
        if (result.wins.length > 0) {
            // Show win animations
            state.phase = 'SHOWING_WINS';
            SlotGame.UI.updateSpinButton();
            SlotGame.Animations.showWinLines(result.wins);

            // Big win celebration
            if (totalWin >= state.totalBet * 20) {
                SlotGame.Animations.bigWinCelebration(totalWin);
                SlotGame.UI.showMessage('BIG WIN! ' + totalWin.toLocaleString(), 3000);
            } else if (totalWin > 0) {
                SlotGame.Audio.smallWin();
            }

            // Auto-advance after showing wins
            var showDuration = Math.max(2000, result.wins.length * SlotGame.Config.WIN_LINE_CYCLE_DELAY);
            if (state.turboMode) showDuration = Math.min(showDuration, 1500);

            this._showWinsTimer = setTimeout(function() {
                SlotGame.Main.onWinsShown();
            }, showDuration);
        } else {
            // No wins - go directly to post-spin logic
            this.onWinsShown();
        }
    },

    /**
     * Called after win animations complete.
     */
    onWinsShown: function() {
        var state = SlotGame.State;

        // Cancel any pending auto-advance timer (prevents stale double-call)
        if (this._showWinsTimer) {
            clearTimeout(this._showWinsTimer);
            this._showWinsTimer = null;
        }

        // Guard: only proceed if in a valid state for this call
        if (state.phase !== 'SHOWING_WINS' && state.phase !== 'EVALUATING') return;

        SlotGame.Animations.stopWinLines();

        // Restore total win display (was showing individual line wins during cycling)
        SlotGame.UI.updateWin(state.totalWin);

        // Re-apply scatter highlight: stopWinLines() calls clearHighlights() which erased it.
        // Keep it visible until the free spins intro fires (the 2000ms timeout below).
        if (this.pendingFreeSpins > 0 && this.pendingScatterPositions) {
            SlotGame.Reels.highlightScatters(this.pendingScatterPositions);
        }

        // Handle pending jackpot first
        if (this.pendingJackpot) {
            this.pendingJackpot = false;
            this.jackpotAmount = SlotGame.Jackpot.award();
            SlotGame.Audio.jackpotWin();
            SlotGame.UI.showJackpotOverlay(this.jackpotAmount);
            SlotGame.UI.updateBalance();
            return; // Wait for collect
        }

        // Handle pending bonus - delay overlay so crown highlights are visible
        if (this.pendingBonus) {
            this.pendingBonus = false;
            state.phase = 'FEATURE_PENDING'; // Block all input during highlight delay
            setTimeout(function() {
                SlotGame.Reels.clearHighlights();
                SlotGame.Main.startBonusGame();
            }, 2000);
            return;
        }

        // Handle pending free spins
        if (this.pendingFreeSpins > 0) {
            var count = this.pendingFreeSpins;
            this.pendingFreeSpins = 0;

            state.phase = 'FEATURE_PENDING'; // Block all input during highlight delay

            if (state.inFreeSpins) {
                // Retrigger: add more spins
                SlotGame.Features.freeSpins.addSpins(count);
                SlotGame.UI.showMessage('+' + count + ' FREE SPINS!', 2000);
                SlotGame.UI.updateFreeSpinsHud();
                // Clear Scatter highlight after brief delay
                setTimeout(function() {
                    SlotGame.Reels.clearHighlights();
                    SlotGame.Main.pendingScatterPositions = null;
                }, 2500);
                // Continue free spins after brief delay
                setTimeout(function() {
                    SlotGame.Main.continueAfterSpin();
                }, 2000);
                return;
            } else {
                // New free spins session - delay overlay so scatter highlights are visible
                this._pendingFsCount = count;
                setTimeout(function() {
                    SlotGame.Reels.clearHighlights();
                    SlotGame.Main.pendingScatterPositions = null;
                    SlotGame.Audio.freeSpinStart();
                    SlotGame.UI.showFreeSpinsIntro(count);
                }, 2000);
                return;
            }
        }

        // Normal flow: continue
        this.continueAfterSpin();
    },

    /**
     * Continue after all post-spin events are handled.
     */
    continueAfterSpin: function() {
        var state = SlotGame.State;
        state.phase = 'IDLE';
        SlotGame.UI.updateSpinButton();

        // Check free spins completion
        if (state.inFreeSpins && state.freeSpinsRemaining <= 0) {
            var totalWin = SlotGame.Features.freeSpins.end();
            SlotGame.UI.hideFreeSpinsHud();
            SlotGame.UI.showFreeSpinsSummary(totalWin);
            return;
        }

        // Auto spin during free spins
        if (state.inFreeSpins && state.freeSpinsRemaining > 0) {
            var delay = state.turboMode ? 300 : 800;
            setTimeout(function() {
                if (state.inFreeSpins) SlotGame.Main.onSpin();
            }, delay);
            return;
        }

        // Auto spin
        if (state.autoSpinActive && state.autoSpinCount > 0) {
            state.autoSpinCount--;
            if (state.autoSpinCount <= 0) {
                state.autoSpinActive = false;
                SlotGame.UI.els.btnAutoSpin.classList.remove('active');
                SlotGame.UI.els.btnAutoSpin.textContent = 'AUTO';
            } else {
                var autoDelay = state.turboMode ? 300 : 500;
                setTimeout(function() {
                    if (state.autoSpinActive) SlotGame.Main.onSpin();
                }, autoDelay);
            }
        }
    },

    // === Free Spins Flow ===

    startFreeSpins: function() {
        var count = this._pendingFsCount || 10;
        SlotGame.Features.freeSpins.start(count);
        SlotGame.UI.hideFreeSpinsIntro();
        SlotGame.UI.showFreeSpinsHud();
        SlotGame.Audio.bgmSetMode('freespin');
        SlotGame.State.phase = 'IDLE';
        SlotGame.UI.updateSpinButton();

        // Auto-start first free spin
        setTimeout(function() {
            SlotGame.Main.onSpin();
        }, 500);
    },

    collectFreeSpins: function() {
        SlotGame.UI.hideFreeSpinsSummary();
        SlotGame.Audio.bgmSetMode('normal');
        SlotGame.State.phase = 'IDLE';
        SlotGame.UI.updateSpinButton();
        SlotGame.UI.updateBalance();

        // Continue auto-spin if active
        if (SlotGame.State.autoSpinActive) {
            setTimeout(function() { SlotGame.Main.onSpin(); }, 500);
        }
    },

    // === Bonus Game Flow ===

    startBonusGame: function() {
        SlotGame.Features.bonusGame.generate(SlotGame.State.totalBet);
        SlotGame.UI.showBonusOverlay();
        SlotGame.Audio.freeSpinStart();
    },

    onBonusPick: function(index) {
        var state = SlotGame.State;
        if (!state.inBonusGame) return;

        var result = SlotGame.Features.bonusGame.pick(index, state.totalBet);
        if (!result) return;

        SlotGame.Audio.bonusReveal();
        SlotGame.UI.revealChest(index, result);

        if (result.jackpotWon) {
            // Jackpot in bonus game!
            var bonusWin = SlotGame.Features.bonusGame.end();
            state.balance += bonusWin;
            SlotGame.UI.hideBonusOverlay();

            this.jackpotAmount = SlotGame.Jackpot.award();
            SlotGame.Audio.jackpotWin();
            SlotGame.UI.showJackpotOverlay(this.jackpotAmount);
            SlotGame.UI.updateBalance();
            return;
        }

        if (result.bonusEnded) {
            // Show collect button after brief delay
            setTimeout(function() {
                SlotGame.UI.showBonusCollect();
                SlotGame.UI.els.btnBonusCollect.onclick = function() {
                    var bonusWin = SlotGame.Features.bonusGame.end();
                    state.balance += bonusWin;
                    SlotGame.UI.hideBonusOverlay();
                    SlotGame.UI.updateBalance();
                    SlotGame.State.save();

                    // Check pending free spins
                    if (SlotGame.Main.pendingFreeSpins > 0) {
                        var count = SlotGame.Main.pendingFreeSpins;
                        SlotGame.Main.pendingFreeSpins = 0;
                        SlotGame.Audio.freeSpinStart();
                        SlotGame.UI.showFreeSpinsIntro(count);
                        SlotGame.Main._pendingFsCount = count;
                        return;
                    }

                    SlotGame.Main.continueAfterSpin();
                };
            }, 800);
        }
    },

    // === Jackpot Flow ===

    collectJackpot: function() {
        SlotGame.UI.hideJackpotOverlay();
        SlotGame.UI.updateBalance();

        // Handle remaining pending events
        if (this.pendingBonus) {
            this.pendingBonus = false;
            this.startBonusGame();
            return;
        }
        if (this.pendingFreeSpins > 0) {
            var count = this.pendingFreeSpins;
            this.pendingFreeSpins = 0;
            SlotGame.Audio.freeSpinStart();
            SlotGame.UI.showFreeSpinsIntro(count);
            this._pendingFsCount = count;
            return;
        }

        this.continueAfterSpin();
    },

    // === Platform Integration ===

    /**
     * Clean up game state before leaving (stop audio, timers, sync balance).
     */
    cleanup: function() {
        // Stop audio
        try { SlotGame.Audio.stopBGM(); } catch (e) {}

        // Stop win animations
        try { SlotGame.Animations.stopWinLines(); } catch (e) {}

        // Clear pending timers
        if (this._showWinsTimer) {
            clearTimeout(this._showWinsTimer);
            this._showWinsTimer = null;
        }

        // Cancel auto-spin
        SlotGame.State.autoSpinActive = false;
        SlotGame.State.autoSpinCount = 0;

        // Reset game phase
        SlotGame.State.phase = 'IDLE';
        SlotGame.State.inFreeSpins = false;
        SlotGame.State.inBonusGame = false;

        // Hide all overlays
        var overlays = ['free-spins-intro', 'free-spins-summary', 'bonus-overlay', 'jackpot-overlay'];
        for (var i = 0; i < overlays.length; i++) {
            var el = document.getElementById(overlays[i]);
            if (el) el.classList.remove('active');
        }
        var hud = document.getElementById('free-spins-hud');
        if (hud) hud.classList.add('hidden');

        // Sync state back to platform
        SlotGame.State.syncToPlatform();
    },

    /**
     * Return to lobby — called by "← LOBBY" button.
     */
    returnToLobby: function() {
        // Only allow return in IDLE state
        if (SlotGame.State.phase !== 'IDLE') return;

        this.cleanup();
        SlotGame.Platform.returnToLobby();
        SlotGame.Router.goToLobby();
    },
};

// === Bootstrap (Platform-aware) ===
document.addEventListener('DOMContentLoaded', function() {
    // Initialize platform first
    SlotGame.Platform.init();

    // Initialize lobby
    SlotGame.Lobby.init();

    // Start router (determines initial view)
    SlotGame.Router.init();
});
