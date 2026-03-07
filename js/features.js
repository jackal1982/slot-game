/**
 * SlotGame Features Module
 * Free Spins and Bonus Game logic.
 */
SlotGame.Features = {
    // =====================
    // FREE SPINS
    // =====================
    freeSpins: {
        /**
         * Start free spins session.
         * @param {number} count - Number of free spins awarded
         */
        start: function(count) {
            var state = SlotGame.State;
            state.inFreeSpins = true;
            state.freeSpinsRemaining = count;
            state.freeSpinsTotal = count;
            state.freeSpinsWinnings = 0;
        },

        /**
         * Use one free spin. Returns true if spins remaining.
         * @returns {boolean}
         */
        useOne: function() {
            var state = SlotGame.State;
            if (state.freeSpinsRemaining > 0) {
                state.freeSpinsRemaining--;
                return true;
            }
            return false;
        },

        /**
         * Add more free spins (retrigger).
         * @param {number} count
         */
        addSpins: function(count) {
            var state = SlotGame.State;
            state.freeSpinsRemaining += count;
            state.freeSpinsTotal += count;
        },

        /**
         * Add winnings from a free spin.
         * @param {number} amount
         */
        addWinnings: function(amount) {
            SlotGame.State.freeSpinsWinnings += amount;
        },

        /**
         * End free spins session. Returns total winnings.
         * @returns {number}
         */
        end: function() {
            var state = SlotGame.State;
            var total = state.freeSpinsWinnings;
            state.inFreeSpins = false;
            state.freeSpinsRemaining = 0;
            state.freeSpinsTotal = 0;
            state.freeSpinsWinnings = 0;
            return total;
        },

        /**
         * Check if free spins are active.
         * @returns {boolean}
         */
        isActive: function() {
            return SlotGame.State.inFreeSpins;
        },
    },

    // =====================
    // BONUS GAME
    // =====================
    bonusGame: {
        /**
         * Generate bonus game chests.
         * @param {number} totalBet - Current total bet for multiplier calculation
         */
        generate: function(totalBet) {
            var state = SlotGame.State;
            var pool = [
                { type: 'credit', multiplier: 5 },
                { type: 'credit', multiplier: 10 },
                { type: 'credit', multiplier: 10 },
                { type: 'credit', multiplier: 15 },
                { type: 'credit', multiplier: 20 },
                { type: 'credit', multiplier: 30 },
                { type: 'credit', multiplier: 50 },
                { type: 'extra_pick', value: 1 },
                { type: 'extra_pick', value: 1 },
                { type: 'collect', value: 0 },
                { type: 'collect', value: 0 },
                { type: 'jackpot', value: 0 },
            ];

            // Fisher-Yates shuffle
            for (var i = pool.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var temp = pool[i];
                pool[i] = pool[j];
                pool[j] = temp;
            }

            state.bonusChests = pool.map(function(p) {
                return {
                    type: p.type,
                    multiplier: p.multiplier || 0,
                    value: p.value || 0,
                    revealed: false,
                };
            });
            state.bonusPicksRemaining = SlotGame.Config.BONUS_STARTING_PICKS;
            state.bonusTotalWin = 0;
            state.inBonusGame = true;
        },

        /**
         * Pick a chest by index.
         * @param {number} index - Chest index (0-11)
         * @param {number} totalBet - For credit calculation
         * @returns {Object|null} Result of the pick
         */
        pick: function(index, totalBet) {
            var state = SlotGame.State;
            if (!state.inBonusGame) return null;
            if (index < 0 || index >= state.bonusChests.length) return null;

            var chest = state.bonusChests[index];
            if (chest.revealed || state.bonusPicksRemaining <= 0) return null;

            chest.revealed = true;
            state.bonusPicksRemaining--;

            var result = {
                type: chest.type,
                multiplier: chest.multiplier,
                value: chest.value,
                winAmount: 0,
                jackpotWon: false,
                bonusEnded: false,
            };

            switch (chest.type) {
                case 'credit':
                    var win = chest.multiplier * totalBet;
                    state.bonusTotalWin += win;
                    result.winAmount = win;
                    break;
                case 'extra_pick':
                    state.bonusPicksRemaining += chest.value;
                    break;
                case 'collect':
                    state.bonusPicksRemaining = 0;
                    break;
                case 'jackpot':
                    result.jackpotWon = true;
                    break;
            }

            if (state.bonusPicksRemaining <= 0) {
                result.bonusEnded = true;
            }

            return result;
        },

        /**
         * End bonus game. Returns total winnings.
         * @returns {number}
         */
        end: function() {
            var state = SlotGame.State;
            var total = state.bonusTotalWin;
            state.inBonusGame = false;
            state.bonusChests = [];
            state.bonusPicksRemaining = 0;
            state.bonusTotalWin = 0;
            return total;
        },
    },
};
