/**
 * Dragon Wolf State Module
 * 遊戲狀態管理，與 SlotGame.Platform 同步
 */
var DragonWolf = window.DragonWolf || {};

DragonWolf.State = {
    // 遊戲狀態機
    phase:      'IDLE', // IDLE | SPINNING | EVALUATING | SHOWING_WINS | FEATURE_PENDING | RANDOM_WILDS | FREE_SPINS_INTRO

    // 餘額（從 Platform 同步）
    balance:    0,

    // 下注
    betIndex:   0,  // 對應 Config.BET_MULTIPLIERS

    // 當前局贏分
    win:        0,

    // Free Spins 狀態
    inFreeSpins: false,

    // 設定
    soundEnabled: true,
    musicEnabled: true,
    turboMode:    false,

    // 當前 grid（供動畫/評估用）
    grid: null,

    // ── 計算屬性 ──────────────────────────────────────────

    get bet() {
        return DragonWolf.Config.BASE_BET * DragonWolf.Config.BET_MULTIPLIERS[this.betIndex];
    },

    // ── 初始化 ────────────────────────────────────────────

    init: function() {
        this.syncFromPlatform();
    },

    // ── Platform 同步 ─────────────────────────────────────

    syncFromPlatform: function() {
        var platform = SlotGame.Platform;
        this.balance = platform.getBalance();

        var gs = platform.getGameState('dragon_wolf');
        if (gs) {
            if (typeof gs.betIndex === 'number') {
                this.betIndex = gs.betIndex;
            }
        }

        var settings = platform.getSettings();
        if (settings) {
            this.soundEnabled = settings.soundEnabled;
            this.musicEnabled = settings.musicEnabled;
            this.turboMode    = settings.turboMode;
        }
    },

    syncToPlatform: function() {
        var platform = SlotGame.Platform;
        platform.setBalance(this.balance);
        platform.updateGameState('dragon_wolf', { betIndex: this.betIndex });
    },

    // ── 餘額操作 ──────────────────────────────────────────

    deductBet: function() {
        var betAmount = this.getBet();
        this.balance -= betAmount;
        this.syncToPlatform();
    },

    addWin: function(amount) {
        this.balance += amount;
        this.win      = amount;
        this.syncToPlatform();
    },

    // ── 下注管理 ──────────────────────────────────────────

    getBet: function() {
        var cfg = DragonWolf.Config;
        return cfg.BASE_BET * cfg.BET_MULTIPLIERS[this.betIndex];
    },

    increaseBet: function() {
        var maxIndex = DragonWolf.Config.BET_MULTIPLIERS.length - 1;
        if (this.betIndex < maxIndex) {
            this.betIndex++;
            this.syncToPlatform();
        }
    },

    decreaseBet: function() {
        if (this.betIndex > 0) {
            this.betIndex--;
            this.syncToPlatform();
        }
    },

    setMaxBet: function() {
        this.betIndex = DragonWolf.Config.BET_MULTIPLIERS.length - 1;
        this.syncToPlatform();
    },

    // ── 設定 ──────────────────────────────────────────────

    toggleSound: function() {
        this.soundEnabled = !this.soundEnabled;
        SlotGame.Platform.updateSetting('soundEnabled', this.soundEnabled);
    },

    toggleMusic: function() {
        this.musicEnabled = !this.musicEnabled;
        SlotGame.Platform.updateSetting('musicEnabled', this.musicEnabled);
        if (this.musicEnabled) {
            try { DragonWolf.Audio.bgmStart(); } catch(e) {}
        } else {
            try { DragonWolf.Audio.bgmStop(); } catch(e) {}
        }
    },

    toggleTurbo: function() {
        this.turboMode = !this.turboMode;
        SlotGame.Platform.updateSetting('turboMode', this.turboMode);
    }
};
