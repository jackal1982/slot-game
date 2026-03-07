/**
 * SlotGame Jackpot Module
 * Progressive jackpot pool management.
 */
SlotGame.Jackpot = {
    // Display ticker state
    displayedValue: 0,
    tickerRAF: null,

    /**
     * Initialize jackpot display.
     */
    init: function() {
        this.displayedValue = SlotGame.State.jackpotPool;
        this.startTicker();
    },

    /**
     * Add contribution to jackpot pool (called every spin).
     * @param {number} totalBet
     */
    contribute: function(totalBet) {
        var contribution = totalBet * SlotGame.Config.JACKPOT_CONTRIBUTION_RATE;
        SlotGame.State.jackpotPool += contribution;
    },

    /**
     * Check if jackpot is won this spin.
     * @param {number[][]} grid
     * @param {number} totalBet
     * @returns {boolean}
     */
    checkWin: function(grid, totalBet) {
        var WILD = SlotGame.Config.WILD_ID;

        // Trigger 1: Five wilds on the middle row
        var middleRow = [];
        for (var r = 0; r < SlotGame.Config.REELS; r++) {
            middleRow.push(grid[r][1]);
        }
        if (middleRow.every(function(s) { return s === WILD; })) {
            return true;
        }

        // Trigger 2: Random chance, scales with bet size
        var baseChance = SlotGame.Config.JACKPOT_RANDOM_BASE_CHANCE;
        var betMultiplier = totalBet / 20; // normalized
        var adjustedChance = baseChance * Math.min(betMultiplier, SlotGame.Config.JACKPOT_MAX_BET_MULTIPLIER);

        if (Math.random() < adjustedChance) {
            return true;
        }

        return false;
    },

    /**
     * Award jackpot to player. Returns the amount.
     * @returns {number}
     */
    award: function() {
        var amount = Math.floor(SlotGame.State.jackpotPool);
        SlotGame.State.balance += amount;
        SlotGame.State.jackpotPool = SlotGame.Config.JACKPOT_SEED;
        SlotGame.State.save();
        return amount;
    },

    /**
     * Get current jackpot pool value.
     * @returns {number}
     */
    getCurrentValue: function() {
        return Math.floor(SlotGame.State.jackpotPool);
    },

    /**
     * Start the jackpot ticker display animation.
     */
    startTicker: function() {
        var self = this;
        var el = document.getElementById('jackpot-display');

        function tick() {
            var target = SlotGame.State.jackpotPool;
            if (self.displayedValue < target) {
                self.displayedValue += (target - self.displayedValue) * 0.05 + 0.1;
                if (self.displayedValue > target) self.displayedValue = target;
            } else {
                self.displayedValue = target;
            }
            if (el) {
                el.textContent = 'JACKPOT: ' + Math.floor(self.displayedValue).toLocaleString();
            }
            self.tickerRAF = requestAnimationFrame(tick);
        }
        tick();
    },

    /**
     * Stop ticker animation.
     */
    stopTicker: function() {
        if (this.tickerRAF) {
            cancelAnimationFrame(this.tickerRAF);
        }
    },
};
