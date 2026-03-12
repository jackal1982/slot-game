/**
 * SlotGame Audio Module
 * Programmatic sound effects using Web Audio API.
 */
SlotGame.Audio = {
    ctx: null,
    _ready: false,

    /**
     * Set up splash screen as user gesture to unlock AudioContext.
     * Also pre-allocate AudioContext eagerly and add idle-resume listeners.
     */
    init: function() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            return; // Web Audio not supported
        }

        var self = this;

        // Splash screen: user taps "TAP TO PLAY" → resume + warmup → hide splash
        var splash = document.getElementById('splash-screen');
        var splashBtn = document.getElementById('splash-btn');
        if (splash && splashBtn) {
            var startGame = function() {
                if (self.ctx.state === 'suspended') {
                    self.ctx.resume().then(function() {
                        self._warmUp();
                    });
                } else {
                    self._warmUp();
                }
                splash.classList.add('hidden');
                setTimeout(function() {
                    splash.style.display = 'none';
                }, 500); // After fade-out transition
            };
            splashBtn.addEventListener('click', startGame);
            splash.addEventListener('touchend', startGame);
        }

        // If context starts running immediately (e.g. MEI or autoplay allowed)
        if (this.ctx.state === 'running') {
            this._warmUp();
            // Auto-dismiss splash if audio is already unlocked
            if (splash) {
                splash.classList.add('hidden');
                setTimeout(function() { splash.style.display = 'none'; }, 500);
            }
        }

        // Listen for state changes (suspend after idle)
        this.ctx.onstatechange = function() {
            if (self.ctx.state === 'running' && !self._ready) {
                self._warmUp();
            }
            if (self.ctx.state === 'suspended') {
                self._ready = false;
            }
        };

        // On pointerdown, resume if suspended (handles idle suspend)
        var wakeAudio = function() {
            if (self.ctx && self.ctx.state === 'suspended') {
                self.ctx.resume();
            }
        };
        document.addEventListener('pointerdown', wakeAudio, { passive: true });
        document.addEventListener('touchstart', wakeAudio, { passive: true });

        // Resume on tab visibility change
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden && self.ctx && self.ctx.state === 'suspended') {
                self.ctx.resume();
            }
        });
    },

    /**
     * Play a short silent buffer to prime the Web Audio pipeline.
     */
    _warmUp: function() {
        if (!this.ctx) return;
        try {
            var buffer = this.ctx.createBuffer(1, 1, this.ctx.sampleRate);
            var source = this.ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(this.ctx.destination);
            source.start(0);
            this._ready = true;
        } catch (e) { /* ignore */ }
    },

    /**
     * Play a single tone. Silently skips if context is not yet running
     * (avoids stutter; by next interaction it will be ready).
     */
    playTone: function(freq, duration, type, volume) {
        if (!SlotGame.State.soundEnabled) return;
        if (!this.ctx || this.ctx.state !== 'running') return;
        type = type || 'sine';
        volume = volume !== undefined ? volume : 0.3;
        try {
            var osc = this.ctx.createOscillator();
            var gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(volume, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) { /* ignore audio errors */ }
    },

    /**
     * Play noise burst (for percussive sounds).
     */
    playNoise: function(duration, volume) {
        if (!SlotGame.State.soundEnabled) return;
        if (!this.ctx || this.ctx.state !== 'running') return;
        volume = volume || 0.1;
        try {
            var bufferSize = this.ctx.sampleRate * duration;
            var buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            var data = buffer.getChannelData(0);
            for (var i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * volume;
            }
            var source = this.ctx.createBufferSource();
            var gain = this.ctx.createGain();
            source.buffer = buffer;
            gain.gain.setValueAtTime(volume, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
            source.connect(gain);
            gain.connect(this.ctx.destination);
            source.start();
        } catch (e) { /* ignore */ }
    },

    // --- Sound Effects ---

    spinStart: function() {
        var self = this;
        for (var i = 0; i < 5; i++) {
            (function(idx) {
                setTimeout(function() {
                    self.playTone(800 - idx * 80, 0.05, 'square', 0.12);
                }, idx * 30);
            })(i);
        }
    },

    reelStop: function(reelIndex) {
        this.playTone(150 - reelIndex * 10, 0.12, 'triangle', 0.35);
        this.playNoise(0.05, 0.08);
    },

    buttonClick: function() {
        this.playTone(600, 0.05, 'sine', 0.15);
    },

    smallWin: function() {
        var self = this;
        var notes = [523, 659, 784]; // C5, E5, G5
        notes.forEach(function(f, i) {
            setTimeout(function() { self.playTone(f, 0.15, 'sine', 0.25); }, i * 120);
        });
    },

    bigWin: function() {
        var self = this;
        var notes = [523, 659, 784, 1047, 784, 1047]; // C5 E5 G5 C6 G5 C6
        notes.forEach(function(f, i) {
            setTimeout(function() { self.playTone(f, 0.2, 'triangle', 0.35); }, i * 150);
        });
    },

    jackpotWin: function() {
        var self = this;
        for (var i = 0; i < 20; i++) {
            (function(idx) {
                setTimeout(function() {
                    self.playTone(300 + idx * 50, 0.3, 'sine', 0.25);
                    self.playTone(300 + idx * 50 * 1.5, 0.3, 'triangle', 0.12);
                }, idx * 100);
            })(i);
        }
    },

    scatterHit: function() {
        var self = this;
        var freqs = [1200, 1500, 1800, 2200];
        freqs.forEach(function(f, i) {
            setTimeout(function() { self.playTone(f, 0.1, 'sine', 0.2); }, i * 60);
        });
    },

    freeSpinStart: function() {
        var self = this;
        var notes = [392, 494, 587, 659, 784]; // G4 B4 D5 E5 G5
        notes.forEach(function(f, i) {
            setTimeout(function() { self.playTone(f, 0.25, 'triangle', 0.3); }, i * 100);
        });
    },

    bonusReveal: function() {
        this.playTone(800, 0.1, 'sine', 0.2);
        var self = this;
        setTimeout(function() { self.playTone(1200, 0.15, 'sine', 0.25); }, 100);
    },

    coinDrop: function() {
        this.playTone(2000, 0.05, 'square', 0.15);
        var self = this;
        setTimeout(function() { self.playTone(2500, 0.05, 'square', 0.1); }, 30);
    },
};
