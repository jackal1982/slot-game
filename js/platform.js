/**
 * Platform Module
 * Manages platform-level state, balance, and game lifecycle.
 * Balance lives here; games borrow it on entry, return it on exit.
 */
SlotGame.Platform = {
    _state: {
        totalBalance: 50000,
        currentGame: null,
        games: {
            slot_game: {
                betIndex: 2,
                jackpotPool: 5000
            },
            dragon_wolf: {
                betIndex: 0
            }
        },
        settings: {
            soundEnabled: true,
            musicEnabled: true,
            turboMode: false
        }
    },

    STORAGE_KEY: 'platform_state',
    LEGACY_KEY: 'slotGame_state',

    /**
     * Initialize platform — load from localStorage (with migration).
     */
    init: function() {
        this.load();
        this._applyOrientationLock();
        var self = this;
        window.addEventListener('orientationchange', function() {
            // 等待旋轉動畫完成（約 300ms）後套用鎖定並強制 reflow
            setTimeout(function() {
                self._applyOrientationLock();
                window.scrollTo(0, 0);
                document.documentElement.style.height = 'auto';
                requestAnimationFrame(function() {
                    document.documentElement.style.height = '';
                });
            }, 300);
        });
    },

    /**
     * Detect phone orientation angle and apply CSS class to body for portrait lock.
     * landscape-ccw: rotated left (angle=90) → rotate body -90°
     * landscape-cw:  rotated right (angle=-90/270) → rotate body +90°
     */
    _applyOrientationLock: function() {
        var angle = 0;
        if (screen.orientation && typeof screen.orientation.angle !== 'undefined') {
            angle = screen.orientation.angle;
        } else if (typeof window.orientation !== 'undefined') {
            angle = window.orientation;
        }
        if (angle === 270) angle = -90; // normalize
        document.body.classList.remove('landscape-ccw', 'landscape-cw');
        if (angle === 90)  document.body.classList.add('landscape-ccw');
        if (angle === -90) document.body.classList.add('landscape-cw');
    },

    // ── Balance API ──────────────────────────────────────

    getBalance: function() {
        return this._state.totalBalance;
    },

    setBalance: function(amount) {
        if (typeof amount === 'number' && amount >= 0) {
            this._state.totalBalance = Math.round(amount);
            this.save();
        }
    },

    // ── Game Lifecycle ───────────────────────────────────

    startGame: function(gameId) {
        if (!this._state.games[gameId]) {
            console.warn('[Platform] Unknown game:', gameId);
            return false;
        }
        this._state.currentGame = gameId;
        this.save();
        return true;
    },

    getCurrentGame: function() {
        return this._state.currentGame;
    },

    returnToLobby: function() {
        this._state.currentGame = null;
        this.save();
    },

    // ── Game State ───────────────────────────────────────

    getGameState: function(gameId) {
        return this._state.games[gameId] || null;
    },

    updateGameState: function(gameId, updates) {
        if (!this._state.games[gameId]) return;
        var gs = this._state.games[gameId];
        for (var key in updates) {
            if (updates.hasOwnProperty(key)) {
                gs[key] = updates[key];
            }
        }
        this.save();
    },

    // ── Settings ─────────────────────────────────────────

    getSettings: function() {
        return this._state.settings;
    },

    updateSetting: function(key, value) {
        if (key in this._state.settings) {
            this._state.settings[key] = value;
            this.save();
        }
    },

    // ── Persistence ──────────────────────────────────────

    save: function() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._state));
        } catch (e) {
            console.error('[Platform] save failed:', e);
        }
    },

    load: function() {
        try {
            // 1. Try new format
            var raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                var data = JSON.parse(raw);
                this._applyLoaded(data);
                return;
            }

            // 2. Migrate from legacy slotGame_state
            var legacyRaw = localStorage.getItem(this.LEGACY_KEY);
            if (legacyRaw) {
                var legacy = JSON.parse(legacyRaw);
                this._state.totalBalance = (typeof legacy.balance === 'number' && legacy.balance >= 0)
                    ? legacy.balance : 50000;
                if (typeof legacy.betIndex === 'number') {
                    this._state.games.slot_game.betIndex = legacy.betIndex;
                }
                if (typeof legacy.jackpotPool === 'number' && legacy.jackpotPool >= 5000) {
                    this._state.games.slot_game.jackpotPool = legacy.jackpotPool;
                }
                if (typeof legacy.soundEnabled === 'boolean') {
                    this._state.settings.soundEnabled = legacy.soundEnabled;
                }
                if (typeof legacy.musicEnabled === 'boolean') {
                    this._state.settings.musicEnabled = legacy.musicEnabled;
                }
                if (typeof legacy.turboMode === 'boolean') {
                    this._state.settings.turboMode = legacy.turboMode;
                }
                this.save(); // persist in new format
                console.log('[Platform] Migrated from legacy slotGame_state');
                return;
            }

            // 3. Brand-new user — defaults are already set
        } catch (e) {
            console.error('[Platform] load failed:', e);
        }
    },

    _applyLoaded: function(data) {
        if (typeof data.totalBalance === 'number' && data.totalBalance >= 0) {
            this._state.totalBalance = data.totalBalance;
        }
        this._state.currentGame = data.currentGame || null;

        if (data.games && data.games.slot_game) {
            var sg = data.games.slot_game;
            if (typeof sg.betIndex === 'number') {
                this._state.games.slot_game.betIndex = sg.betIndex;
            }
            if (typeof sg.jackpotPool === 'number') {
                this._state.games.slot_game.jackpotPool = sg.jackpotPool;
            }
        }

        if (data.games && data.games.dragon_wolf) {
            var dw = data.games.dragon_wolf;
            if (typeof dw.betIndex === 'number') {
                this._state.games.dragon_wolf.betIndex = dw.betIndex;
            }
        }

        if (data.settings) {
            var s = data.settings;
            if (typeof s.soundEnabled === 'boolean') this._state.settings.soundEnabled = s.soundEnabled;
            if (typeof s.musicEnabled === 'boolean') this._state.settings.musicEnabled = s.musicEnabled;
            if (typeof s.turboMode === 'boolean') this._state.settings.turboMode = s.turboMode;
        }
    },

    /**
     * Factory reset (for debugging).
     */
    reset: function() {
        this._state = {
            totalBalance: 50000,
            currentGame: null,
            games: { slot_game: { betIndex: 2, jackpotPool: 5000 }, dragon_wolf: { betIndex: 0 } },
            settings: { soundEnabled: true, musicEnabled: true, turboMode: false }
        };
        this.save();
    }
};
