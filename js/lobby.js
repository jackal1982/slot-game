/**
 * Lobby Module
 * Renders game selection grid and handles lobby interactions.
 */
SlotGame.Lobby = {
    // Game catalog — add new games here
    _games: [
        {
            id: 'slot_game',
            name: 'Fortune Slots',
            subtitle: '幸運老虎機',
            description: '5 軸 20 線經典老虎機，Wild、Scatter、Free Spins、Bonus Game、累積 Jackpot',
            rtp: '96.29%',
            icon: 'images/fortune_slots/slot-icon.svg',
            viewPath: 'games/fortune_slots/view.html'
        },
        {
            id: 'dragon_wolf',
            name: '黑白龍狼傳',
            subtitle: 'Legend of Dragon &amp; Wolf',
            description: '5軸4行 1024-Ways，M1黑白郎君隨機百搭特色，Free Game高爆發',
            rtp: '96.0%',
            icon: 'images/dragon_wolf/dw-icon.png',
            viewPath: 'games/dragon_wolf/view.html'
        }
    ],

    /**
     * Initialize lobby — render cards, bind events, update balance.
     */
    init: function() {
        this.renderGameCards();
        this.bindEvents();
        this.updateBalance();
        this.updateSettingsDisplay();
    },

    // ── Balance ──────────────────────────────────────────

    updateBalance: function() {
        var el = document.getElementById('lobby-balance-amount');
        if (el) {
            el.textContent = SlotGame.Platform.getBalance().toLocaleString();
        }
    },

    // ── Game Cards ───────────────────────────────────────

    renderGameCards: function() {
        var grid = document.getElementById('games-grid');
        if (!grid) return;
        grid.innerHTML = '';

        for (var i = 0; i < this._games.length; i++) {
            var game = this._games[i];
            var card = document.createElement('div');
            card.className = 'game-card';
            card.setAttribute('data-game-id', game.id);

            card.innerHTML =
                '<div class="game-card-icon">' +
                    '<img src="' + game.icon + '" alt="' + game.name + '" draggable="false">' +
                '</div>' +
                '<div class="game-card-body">' +
                    '<h3>' + game.name + '</h3>' +
                    '<p class="game-card-subtitle">' + game.subtitle + '</p>' +
                    '<p class="game-card-desc">' + game.description + '</p>' +
                    '<span class="rtp-badge">RTP ' + game.rtp + '</span>' +
                '</div>' +
                '<button class="btn-play" data-game-id="' + game.id + '">PLAY NOW</button>';

            grid.appendChild(card);
        }
    },

    // ── Events ───────────────────────────────────────────

    bindEvents: function() {
        var self = this;

        // Play buttons (event delegation on grid)
        var grid = document.getElementById('games-grid');
        if (grid) {
            grid.addEventListener('click', function(e) {
                var btn = e.target.closest('.btn-play');
                if (!btn) return;
                var gameId = btn.getAttribute('data-game-id');
                if (gameId) self.launchGame(gameId);
            });
        }

        // Lobby sound/music toggles
        var btnSound = document.getElementById('lobby-btn-sound');
        if (btnSound) {
            btnSound.addEventListener('click', function() {
                var on = !SlotGame.Platform.getSettings().soundEnabled;
                SlotGame.Platform.updateSetting('soundEnabled', on);
                self.updateSettingsDisplay();
            });
        }

        var btnMusic = document.getElementById('lobby-btn-music');
        if (btnMusic) {
            btnMusic.addEventListener('click', function() {
                var on = !SlotGame.Platform.getSettings().musicEnabled;
                SlotGame.Platform.updateSetting('musicEnabled', on);
                // Immediately stop any BGM that may still be playing
                if (!on) {
                    try { SlotGame.Audio.bgmStop(); } catch(e) {}
                    try { if (window.DragonWolf) DragonWolf.Audio.bgmStop(); } catch(e) {}
                }
                self.updateSettingsDisplay();
            });
        }
    },

    _launchedFromLobby: false,

    launchGame: function(gameId) {
        if (!SlotGame.Platform.startGame(gameId)) return;

        // Pre-unlock AudioContext while still inside the user-gesture (click).
        // This avoids needing the extra "TAP TO PLAY" splash screen.
        try {
            if (!SlotGame.Audio.ctx) {
                SlotGame.Audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (SlotGame.Audio.ctx.state === 'suspended') {
                SlotGame.Audio.ctx.resume();
            }
        } catch (e) { /* Web Audio not supported — splash will handle it */ }

        this._launchedFromLobby = true;
        SlotGame.Router.goToGame(gameId);
    },

    updateSettingsDisplay: function() {
        var s = SlotGame.Platform.getSettings();
        var btnSound = document.getElementById('lobby-btn-sound');
        var btnMusic = document.getElementById('lobby-btn-music');
        if (btnSound) btnSound.textContent = s.soundEnabled ? 'SOUND: ON' : 'SOUND: OFF';
        if (btnMusic) btnMusic.textContent = s.musicEnabled ? 'MUSIC: ON' : 'MUSIC: OFF';
    }
};
