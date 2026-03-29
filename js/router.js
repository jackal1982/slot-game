/**
 * Router Module
 * SPA hash-based routing between lobby and game views.
 * Game HTML views are fetched on first visit and injected into #game-views.
 */
SlotGame.Router = {
    ROUTES: { LOBBY: 'lobby', GAME_SLOT: 'game/slot', GAME_DW: 'game/dragon_wolf' },

    _currentRoute: null,
    _isTransitioning: false,
    _viewCache: {},  // tracks which game views have been injected

    init: function() {
        var self = this;
        window.addEventListener('hashchange', function() { self._onHashChange(); });

        // If user left mid-game last session, reset to lobby
        if (SlotGame.Platform.getCurrentGame() !== null) {
            SlotGame.Platform.returnToLobby();
            window.location.hash = '#' + this.ROUTES.LOBBY;  // 同步修正 URL，讓 hashchange 導向大廳
            return;
        }

        // Initial route
        this._onHashChange();
    },

    _onHashChange: function() {
        if (this._isTransitioning) return;

        var hash = window.location.hash.replace(/^#\/?/, '') || this.ROUTES.LOBBY;
        var route;
        if (hash === this.ROUTES.GAME_SLOT)    route = this.ROUTES.GAME_SLOT;
        else if (hash === this.ROUTES.GAME_DW) route = this.ROUTES.GAME_DW;
        else                                   route = this.ROUTES.LOBBY;

        if (route === this._currentRoute) return;

        this._isTransitioning = true;
        var self = this;
        var prevRoute = this._currentRoute;
        this._currentRoute = route;

        var done = function() { self._isTransitioning = false; };

        if (route === this.ROUTES.LOBBY) {
            this._showLobby(prevRoute);
            done();
        } else if (route === this.ROUTES.GAME_SLOT) {
            this._showGame('slot', done);
        } else if (route === this.ROUTES.GAME_DW) {
            this._showGame('dragon_wolf', done);
        }
    },

    // ── View Loading ─────────────────────────────────────

    /**
     * Look up a game descriptor from the lobby registry by internal type name.
     * @param {string} gameType  'slot' | 'dragon_wolf'
     */
    _getDescriptor: function(gameType) {
        var idMap = { 'slot': 'slot_game', 'dragon_wolf': 'dragon_wolf' };
        var id = idMap[gameType];
        var games = SlotGame.Lobby._games;
        for (var i = 0; i < games.length; i++) {
            if (games[i].id === id) return games[i];
        }
        return null;
    },

    /**
     * Fetch a game's view HTML and inject it into #game-views (once only).
     * Calls callback() when the view is ready (whether fetched or cached).
     */
    _loadGameView: function(gameType, viewPath, callback) {
        if (this._viewCache[gameType]) {
            callback();
            return;
        }

        var self = this;
        fetch(viewPath)
            .then(function(res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.text();
            })
            .then(function(html) {
                var container = document.getElementById('game-views');
                container.insertAdjacentHTML('beforeend', html);
                self._viewCache[gameType] = true;
                callback();
            })
            .catch(function(e) {
                console.error('[Router] Failed to load game view:', viewPath, e);
                // Proceed anyway — game container may already exist (fallback)
                self._viewCache[gameType] = true;
                callback();
            });
    },

    // ── Transitions ──────────────────────────────────────

    _showLobby: function(prevRoute) {
        var lobby = document.getElementById('lobby-container');
        var splash = document.getElementById('splash-screen');

        // Clean up game if coming from it
        if (prevRoute === this.ROUTES.GAME_SLOT && SlotGame.Main._initialized) {
            SlotGame.Main.cleanup();
        } else if (prevRoute === this.ROUTES.GAME_DW && window.DragonWolf && DragonWolf.Main._initialized) {
            DragonWolf.Main.cleanup();
        }

        if (splash) splash.style.display = 'none';

        var game = document.getElementById('game-container');
        if (game) { game.classList.add('view-hidden'); game.classList.remove('view-active'); }

        var dwGame = document.getElementById('dw-game-container');
        if (dwGame) { dwGame.classList.add('view-hidden'); dwGame.classList.remove('view-active'); }

        lobby.classList.remove('view-hidden');
        // Trigger reflow then animate in
        void lobby.offsetHeight;
        lobby.classList.add('view-active');

        // Update lobby balance
        SlotGame.Lobby.updateBalance();
    },

    _showGame: function(gameType, done) {
        var self = this;
        var descriptor = this._getDescriptor(gameType);
        var lobby  = document.getElementById('lobby-container');
        var splash = document.getElementById('splash-screen');

        lobby.classList.add('view-hidden');
        lobby.classList.remove('view-active');

        if (!descriptor || !descriptor.viewPath) {
            // No dynamic loading configured — fall back to direct show
            self._showGameView(gameType, splash);
            done();
            return;
        }

        this._loadGameView(gameType, descriptor.viewPath, function() {
            self._showGameView(gameType, splash);
            done();
        });
    },

    _showGameView: function(gameType, splash) {
        if (gameType === 'slot') {
            this._showSlotGame(splash);
        } else if (gameType === 'dragon_wolf') {
            this._showDWGame(splash);
        }
    },

    _showSlotGame: function(splash) {
        var game = document.getElementById('game-container');

        // Sync platform state into game
        SlotGame.State.syncFromPlatform();

        // Initialize game (only once; re-entry re-syncs state)
        if (!SlotGame.Main._initialized) {
            var fromLobby = SlotGame.Lobby._launchedFromLobby;
            SlotGame.Lobby._launchedFromLobby = false;

            if (!fromLobby) {
                if (splash) {
                    splash.style.display = '';
                    splash.classList.remove('hidden');
                }
            }

            game.classList.remove('view-hidden');
            void game.offsetHeight;
            game.classList.add('view-active');

            SlotGame.Main.init();
            SlotGame.Main._initialized = true;

            if (fromLobby && splash) {
                splash.style.display = 'none';
            }
        } else {
            game.classList.remove('view-hidden');
            void game.offsetHeight;
            game.classList.add('view-active');

            SlotGame.UI.updateAll();
            SlotGame.Reels.renderStaticGrid(SlotGame.RNG.generateGrid());

            if (SlotGame.State.musicEnabled && SlotGame.Audio && SlotGame.Audio.ctx) {
                try { SlotGame.Audio.bgmStart(); } catch(e) {}
            }
        }
    },

    _showDWGame: function(splash) {
        var game = document.getElementById('dw-game-container');
        if (!game || !window.DragonWolf) return;

        DragonWolf.State.syncFromPlatform();

        var fromLobby = SlotGame.Lobby._launchedFromLobby;
        SlotGame.Lobby._launchedFromLobby = false;

        if (!DragonWolf.Main._initialized) {
            if (!fromLobby) {
                if (splash) {
                    splash.style.display = '';
                    splash.classList.remove('hidden');
                }
            }

            game.classList.remove('view-hidden');
            void game.offsetHeight;
            game.classList.add('view-active');

            DragonWolf.Main.init();
            DragonWolf.Main._initialized = true;

            if (fromLobby && splash) {
                splash.style.display = 'none';
            }
        } else {
            game.classList.remove('view-hidden');
            void game.offsetHeight;
            game.classList.add('view-active');

            DragonWolf.State.syncFromPlatform();
            DragonWolf.UI.updateAll();
            DragonWolf.Reels.renderStaticGrid(DragonWolf.RNG.generateGrid(false));

            if (DragonWolf.State.musicEnabled && DragonWolf.Audio && DragonWolf.Audio.ctx) {
                try { DragonWolf.Audio.bgmStart('base'); } catch(e) {}
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
        } else if (gameId === 'dragon_wolf') {
            window.location.hash = '#' + this.ROUTES.GAME_DW;
        }
    },

    getCurrentRoute: function() {
        return this._currentRoute;
    }
};
