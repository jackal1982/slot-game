/**
 * Router Module
 * SPA hash-based routing between lobby and game views.
 */
SlotGame.Router = {
    ROUTES: { LOBBY: 'lobby', GAME_SLOT: 'game/slot' },

    _currentRoute: null,
    _isTransitioning: false,

    init: function() {
        var self = this;
        window.addEventListener('hashchange', function() { self._onHashChange(); });

        // If user left mid-game last session, reset to lobby
        if (SlotGame.Platform.getCurrentGame() !== null) {
            SlotGame.Platform.returnToLobby();
        }

        // Initial route
        this._onHashChange();
    },

    _onHashChange: function() {
        if (this._isTransitioning) return;

        var hash = window.location.hash.replace(/^#\/?/, '') || this.ROUTES.LOBBY;
        var route = (hash.indexOf('game/') === 0) ? this.ROUTES.GAME_SLOT : this.ROUTES.LOBBY;

        if (route === this._currentRoute) return;

        this._isTransitioning = true;
        var prevRoute = this._currentRoute;
        this._currentRoute = route;

        if (route === this.ROUTES.LOBBY) {
            this._showLobby(prevRoute);
        } else {
            this._showGame();
        }

        this._isTransitioning = false;
    },

    // ── Transitions ──────────────────────────────────────

    _showLobby: function(prevRoute) {
        var lobby = document.getElementById('lobby-container');
        var game  = document.getElementById('game-container');
        var splash = document.getElementById('splash-screen');

        // Clean up game if coming from it
        if (prevRoute === this.ROUTES.GAME_SLOT && SlotGame.Main._initialized) {
            SlotGame.Main.cleanup();
        }

        if (splash) splash.style.display = 'none';
        game.classList.add('view-hidden');
        game.classList.remove('view-active');

        lobby.classList.remove('view-hidden');
        // Trigger reflow then animate in
        void lobby.offsetHeight;
        lobby.classList.add('view-active');

        // Update lobby balance
        SlotGame.Lobby.updateBalance();
    },

    _showGame: function() {
        var lobby = document.getElementById('lobby-container');
        var game  = document.getElementById('game-container');
        var splash = document.getElementById('splash-screen');

        lobby.classList.add('view-hidden');
        lobby.classList.remove('view-active');

        // Sync platform state into game
        SlotGame.State.syncFromPlatform();

        // Initialize game (only once; re-entry re-syncs state)
        if (!SlotGame.Main._initialized) {
            // First entry: show splash for AudioContext unlock
            if (splash) {
                splash.style.display = '';
                splash.classList.remove('hidden');
            }
            // Show game container behind splash
            game.classList.remove('view-hidden');
            void game.offsetHeight;
            game.classList.add('view-active');

            SlotGame.Main.init();
            SlotGame.Main._initialized = true;
        } else {
            // Re-entering: just show game and update UI
            game.classList.remove('view-hidden');
            void game.offsetHeight;
            game.classList.add('view-active');

            SlotGame.UI.updateAll();
            SlotGame.Reels.renderStaticGrid(SlotGame.RNG.generateGrid());

            // Re-sync audio settings
            if (SlotGame.State.musicEnabled && SlotGame.Audio && SlotGame.Audio.ctx) {
                try { SlotGame.Audio.bgmStart(); } catch(e) {}
            }
        }
    },

    // ── Navigation API ───────────────────────────────────

    goToLobby: function() {
        window.location.hash = '#' + this.ROUTES.LOBBY;
    },

    goToGame: function(gameId) {
        if (gameId === 'slot_game') {
            window.location.hash = '#' + this.ROUTES.GAME_SLOT;
        }
    },

    getCurrentRoute: function() {
        return this._currentRoute;
    }
};
