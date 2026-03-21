/**
 * SlotGame State Manager
 * Manages game state with localStorage persistence.
 */
SlotGame.State = {
    // --- Core State ---
    balance: SlotGame.Config.STARTING_BALANCE,
    betIndex: SlotGame.Config.DEFAULT_BET_INDEX,
    jackpotPool: SlotGame.Config.JACKPOT_SEED,

    // --- Current Spin ---
    phase: 'IDLE', // IDLE, SPINNING, EVALUATING, SHOWING_WINS
    grid: null,    // 5x3 array of symbol IDs after spin
    winDetails: [],
    totalWin: 0,

    // --- Free Spins ---
    freeSpinsRemaining: 0,
    freeSpinsTotal: 0,
    freeSpinsWinnings: 0,
    inFreeSpins: false,

    // --- Bonus Game ---
    inBonusGame: false,
    bonusChests: [],
    bonusPicksRemaining: 0,
    bonusTotalWin: 0,

    // --- Auto Spin ---
    autoSpinCount: 0,
    autoSpinActive: false,

    // --- Settings ---
    turboMode: false,
    soundEnabled: true,
    musicEnabled: true,

    // --- Computed Properties ---
    get betPerLine() {
        return SlotGame.Config.BET_LEVELS[this.betIndex];
    },

    get totalBet() {
        return this.betPerLine * SlotGame.Config.ACTIVE_LINES;
    },

    get canSpin() {
        return this.phase === 'IDLE' && this.balance >= this.totalBet;
    },

    // --- State Methods ---
    init: function() {
        // If platform module exists, sync from it; else legacy load
        if (SlotGame.Platform && localStorage.getItem(SlotGame.Platform.STORAGE_KEY)) {
            this.syncFromPlatform();
        } else {
            this.load();
        }
    },

    /**
     * Pull balance + settings from Platform into game state.
     * Called when entering game from lobby.
     */
    syncFromPlatform: function() {
        var p = SlotGame.Platform;
        this.balance = p.getBalance();

        var gs = p.getGameState('slot_game');
        if (gs) {
            if (typeof gs.betIndex === 'number') {
                this.betIndex = Math.max(0, Math.min(gs.betIndex, SlotGame.Config.BET_LEVELS.length - 1));
            }
            if (typeof gs.jackpotPool === 'number') {
                this.jackpotPool = gs.jackpotPool;
            }
        }

        var s = p.getSettings();
        this.soundEnabled = s.soundEnabled;
        this.musicEnabled = s.musicEnabled;
        this.turboMode = s.turboMode;
    },

    /**
     * Push current game state back to Platform.
     * Called when returning to lobby.
     */
    syncToPlatform: function() {
        var p = SlotGame.Platform;
        p.setBalance(this.balance);
        p.updateGameState('slot_game', {
            betIndex: this.betIndex,
            jackpotPool: this.jackpotPool
        });
        p.updateSetting('soundEnabled', this.soundEnabled);
        p.updateSetting('musicEnabled', this.musicEnabled);
        p.updateSetting('turboMode', this.turboMode);
    },

    reset: function() {
        this.balance = SlotGame.Config.STARTING_BALANCE;
        this.betIndex = SlotGame.Config.DEFAULT_BET_INDEX;
        this.jackpotPool = SlotGame.Config.JACKPOT_SEED;
        this.phase = 'IDLE';
        this.grid = null;
        this.winDetails = [];
        this.totalWin = 0;
        this.freeSpinsRemaining = 0;
        this.freeSpinsTotal = 0;
        this.freeSpinsWinnings = 0;
        this.inFreeSpins = false;
        this.inBonusGame = false;
        this.autoSpinCount = 0;
        this.autoSpinActive = false;
        this.save();
    },

    save: function() {
        try {
            var data = {
                balance: this.balance,
                betIndex: this.betIndex,
                jackpotPool: this.jackpotPool,
                soundEnabled: this.soundEnabled,
                musicEnabled: this.musicEnabled,
                turboMode: this.turboMode,
            };
            localStorage.setItem('slotGame_state', JSON.stringify(data));
        } catch (e) {
            // localStorage unavailable, silently fail
        }
    },

    load: function() {
        try {
            var raw = localStorage.getItem('slotGame_state');
            if (raw) {
                var data = JSON.parse(raw);
                if (typeof data.balance === 'number' && data.balance >= 0) {
                    this.balance = data.balance;
                }
                if (typeof data.betIndex === 'number') {
                    this.betIndex = Math.max(0, Math.min(data.betIndex, SlotGame.Config.BET_LEVELS.length - 1));
                }
                if (typeof data.jackpotPool === 'number' && data.jackpotPool >= SlotGame.Config.JACKPOT_SEED) {
                    this.jackpotPool = data.jackpotPool;
                }
                if (typeof data.soundEnabled === 'boolean') {
                    this.soundEnabled = data.soundEnabled;
                }
                if (typeof data.musicEnabled === 'boolean') {
                    this.musicEnabled = data.musicEnabled;
                }
                if (typeof data.turboMode === 'boolean') {
                    this.turboMode = data.turboMode;
                }
            }
        } catch (e) {
            // localStorage unavailable or corrupted, use defaults
        }
    },
};
