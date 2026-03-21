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
            // Reuse existing context if pre-created by lobby click
            if (!this.ctx) {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            }
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
                        if (SlotGame.State.musicEnabled) self.bgmStart();
                    });
                } else {
                    self._warmUp();
                    if (SlotGame.State.musicEnabled) self.bgmStart();
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
            if (SlotGame.State.musicEnabled) this.bgmStart();
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
            if (self.ctx.state === 'running' && !self._bgmPlaying && SlotGame.State.musicEnabled) {
                self.bgmStart();
            }
            if (self.ctx.state === 'suspended') {
                self._ready = false;
                self.bgmStop();
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

    // =========================================================
    // BGM Engine — Procedural background music via Web Audio API
    // =========================================================

    _bgmPlaying: false,
    _bgmGain: null,
    _bgmSchedulerId: null,
    _bgmNextBarTime: 0,
    _bgmBarIndex: 0,
    _bgmMode: 'normal',    // 'normal' | 'freespin'
    _bgmActiveNodes: [],

    // Note frequencies (Hz)
    _bgmFreqs: {
        // Octave 3 (bass)
        C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61,
        G3: 196.00, A3: 220.00, B3: 246.94,
        // Octave 4 (pad / arpeggio)
        C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
        G4: 392.00, A4: 440.00, B4: 493.88,
        // Octave 5 (arpeggio upper / freespin pad)
        C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46,
        G5: 783.99, A5: 880.00, B5: 987.77
    },

    // Chord progressions — 8-bar loop
    // Each entry: [bassNote, [padNotes], [arpNotes]]
    _bgmChords: {
        normal: [
            ['C3', ['C4','E4','G4','B4'], ['C4','E4','G4','B4','G4','E4','C4','B4']],   // Cmaj7
            ['A3', ['A4','C4','E4','G4'], ['A4','C4','E4','G4','E4','C4','A4','G4']],   // Am7
            ['D3', ['D4','F4','A4','C5'], ['D4','F4','A4','C5','A4','F4','D4','C5']],   // Dm7
            ['G3', ['G4','B4','D4','F4'], ['G4','B4','D4','F4','D4','B4','G4','F4']],   // G7
            ['E3', ['E4','G4','B4','D4'], ['E4','G4','B4','D4','B4','G4','E4','D4']],   // Em7
            ['A3', ['A4','C4','E4','G4'], ['A4','C4','E4','G4','E4','C4','A4','G4']],   // Am7
            ['F3', ['F4','A4','C5','E5'], ['F4','A4','C5','E5','C5','A4','F4','E5']],   // Fmaj7
            ['G3', ['G4','B4','D4','F4'], ['G4','B4','D4','F4','D4','B4','G4','F4']]    // G7
        ],
        freespin: [
            ['D3', ['D4','F4','A4'],      ['D4','A4','D4','F4','A4','F4','D4','A4']],   // Dm (i)
            ['F3', ['F4','A4','C4'],      ['F4','C4','F4','A4','C4','A4','F4','C4']],   // F  (III)
            ['C3', ['C4','E4','G4'],      ['C4','G4','C4','E4','G4','E4','C4','G4']],   // C  (VII)
            ['G3', ['G4','B4','D4'],      ['G4','D4','G4','B4','D4','B4','G4','D4']],   // G  (IV)
            ['A3', ['A4','C4','E4'],      ['A4','E4','A4','C4','E4','C4','A4','E4']],   // Am (v)
            ['F3', ['F4','A4','C4'],      ['F4','A4','C4','F4','C4','A4','F4','A4']],   // F  (III)
            ['G3', ['G4','B4','D4'],      ['G4','B4','D4','G4','D4','B4','G4','B4']],   // G  (IV)
            ['A3', ['A4','C4','E4'],      ['A4','C4','E4','A4','E4','C4','A4','C4']]    // Am (v)
        ]
    },

    /**
     * Start BGM playback. Creates master gain, begins scheduling loop.
     */
    bgmStart: function() {
        if (!this.ctx || this.ctx.state !== 'running') return;
        if (this._bgmPlaying) return;

        this._bgmGain = this.ctx.createGain();
        this._bgmGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
        this._bgmGain.connect(this.ctx.destination);

        this._bgmBarIndex = 0;
        this._bgmNextBarTime = this.ctx.currentTime + 0.15; // small initial delay
        this._bgmPlaying = true;
        this._bgmActiveNodes = [];

        var self = this;
        this._bgmSchedulerId = setInterval(function() {
            self._bgmSchedule();
        }, 200);
    },

    /**
     * Stop BGM with 0.5s fade-out.
     */
    bgmStop: function() {
        if (!this._bgmPlaying) return;
        this._bgmPlaying = false;

        if (this._bgmSchedulerId) {
            clearInterval(this._bgmSchedulerId);
            this._bgmSchedulerId = null;
        }

        // Fade out master gain
        if (this._bgmGain && this.ctx) {
            try {
                var now = this.ctx.currentTime;
                this._bgmGain.gain.setValueAtTime(this._bgmGain.gain.value, now);
                this._bgmGain.gain.linearRampToValueAtTime(0, now + 0.5);
            } catch (e) { /* ignore */ }
        }

        // Stop all active nodes after fade
        var nodes = this._bgmActiveNodes;
        this._bgmActiveNodes = [];
        setTimeout(function() {
            for (var i = 0; i < nodes.length; i++) {
                try { nodes[i].stop(); } catch (e) { /* already stopped */ }
            }
        }, 600);

        this._bgmGain = null;
    },

    /**
     * Switch BGM mode. Forces next bar to start almost immediately.
     */
    bgmSetMode: function(mode) {
        if (this._bgmMode === mode) return;
        this._bgmMode = mode;
        // Jump to new mode quickly: schedule next bar in 0.15s
        // (current bar's nodes fade out naturally, creating a brief crossfade)
        if (this._bgmPlaying && this.ctx) {
            this._bgmNextBarTime = this.ctx.currentTime + 0.15;
            this._bgmBarIndex = 0;
        }
    },

    /**
     * Get bar duration in seconds based on current mode.
     */
    _bgmBarDuration: function() {
        // Normal: 100 BPM → 4 beats = 2.4s; Freespin: 130 BPM → 4 beats ≈ 1.846s
        return this._bgmMode === 'freespin' ? (240 / 130) : (240 / 100);
    },

    /**
     * Scheduler: called every ~200ms, schedules bars ahead of time.
     */
    _bgmSchedule: function() {
        if (!this._bgmPlaying || !this.ctx) return;
        if (this.ctx.state !== 'running') return;

        // Clean up ended nodes
        this._bgmCleanupNodes();

        // Schedule bars within the look-ahead window (0.4s)
        var lookAhead = 0.4;
        while (this._bgmNextBarTime < this.ctx.currentTime + lookAhead) {
            var barDur = this._bgmBarDuration();
            this._bgmScheduleBar(this._bgmNextBarTime, this._bgmBarIndex, barDur);
            this._bgmNextBarTime += barDur;
            this._bgmBarIndex = (this._bgmBarIndex + 1) % 8;
        }
    },

    /**
     * Schedule one bar of music: pad, bass, arpeggio, rhythm.
     */
    _bgmScheduleBar: function(startTime, barIndex, barDur) {
        if (!this._bgmGain) return;
        var chords = this._bgmChords[this._bgmMode] || this._bgmChords.normal;
        var chord = chords[barIndex];
        var bassNote = chord[0];
        var padNotes = chord[1];
        var arpNotes = chord[2];
        var isFS = this._bgmMode === 'freespin';

        var beatDur = barDur / 4;
        var eighthDur = barDur / 8;
        var sixteenthDur = barDur / 16;

        // --- Pad layer ---
        // Normal: sine, relaxed  |  Free Spins: sine, same octave but different chords
        for (var p = 0; p < padNotes.length; p++) {
            this._bgmCreatePadNote(
                this._bgmFreqs[padNotes[p]], startTime, barDur,
                isFS ? 0.07 : 0.06,
                'sine'
            );
        }

        // --- Bass layer ---
        // Normal: quarter notes  |  Free Spins: octave-jump eighths (root + octave alternating)
        var bassFreq = this._bgmFreqs[bassNote];
        if (isFS) {
            for (var b = 0; b < 8; b++) {
                var bFreq = (b % 2 === 0) ? bassFreq : bassFreq * 2; // octave jump
                this._bgmCreateBassNote(bFreq, startTime + b * eighthDur, eighthDur * 0.5, 0.10);
            }
        } else {
            for (var b = 0; b < 4; b++) {
                this._bgmCreateBassNote(bassFreq, startTime + b * beatDur, beatDur * 0.8, 0.12);
            }
        }

        // --- Arpeggio layer ---
        // Both use 8th notes + sine; Free Spins is faster via 130 BPM
        for (var a = 0; a < arpNotes.length; a++) {
            this._bgmCreateArpNote(
                this._bgmFreqs[arpNotes[a]],
                startTime + a * eighthDur,
                eighthDur * 0.6,
                isFS ? 0.09 : 0.08,
                'sine'
            );
        }

        // --- Rhythm layer ---
        // Normal: subtle 8th hi-hat  |  Free Spins: 8th hi-hat with stronger accents
        for (var r = 0; r < 8; r++) {
            var tickVol;
            if (isFS) {
                tickVol = (r % 2 === 0) ? 0.05 : 0.025; // stronger accents
            } else {
                tickVol = (r % 2 === 0) ? 0.04 : 0.02;
            }
            this._bgmCreateTick(startTime + r * eighthDur, tickVol);
        }
    },

    /**
     * Pad note: sine, slow attack/release for warm sustained tone.
     */
    _bgmCreatePadNote: function(freq, startTime, duration, volume, type) {
        if (!this._bgmGain) return;
        try {
            var osc = this.ctx.createOscillator();
            var gain = this.ctx.createGain();
            osc.type = type || 'sine';
            osc.frequency.value = freq;

            var attackEnd = startTime + Math.min(0.3, duration * 0.15);
            var releaseStart = startTime + duration - Math.min(0.3, duration * 0.15);

            gain.gain.setValueAtTime(0.001, startTime);
            gain.gain.linearRampToValueAtTime(volume, attackEnd);
            gain.gain.setValueAtTime(volume, releaseStart);
            gain.gain.linearRampToValueAtTime(0.001, startTime + duration);

            osc.connect(gain);
            gain.connect(this._bgmGain);
            osc.start(startTime);
            osc.stop(startTime + duration + 0.01);
            osc._endTime = startTime + duration + 0.01;
            this._bgmActiveNodes.push(osc);
        } catch (e) { /* ignore */ }
    },

    /**
     * Bass note: triangle, quick attack, moderate decay.
     */
    _bgmCreateBassNote: function(freq, startTime, duration, volume) {
        if (!this._bgmGain) return;
        try {
            var osc = this.ctx.createOscillator();
            var gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(volume, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc.connect(gain);
            gain.connect(this._bgmGain);
            osc.start(startTime);
            osc.stop(startTime + duration + 0.01);
            osc._endTime = startTime + duration + 0.01;
            this._bgmActiveNodes.push(osc);
        } catch (e) { /* ignore */ }
    },

    /**
     * Arpeggio note: sine, short staccato.
     */
    _bgmCreateArpNote: function(freq, startTime, duration, volume, type) {
        if (!this._bgmGain) return;
        try {
            var osc = this.ctx.createOscillator();
            var gain = this.ctx.createGain();
            osc.type = type || 'sine';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(volume, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc.connect(gain);
            gain.connect(this._bgmGain);
            osc.start(startTime);
            osc.stop(startTime + duration + 0.01);
            osc._endTime = startTime + duration + 0.01;
            this._bgmActiveNodes.push(osc);
        } catch (e) { /* ignore */ }
    },

    /**
     * Rhythm tick: tiny noise buffer for hi-hat feel.
     */
    _bgmCreateTick: function(startTime, volume) {
        if (!this._bgmGain) return;
        try {
            var tickDur = 0.02;
            var bufferSize = Math.max(1, Math.floor(this.ctx.sampleRate * tickDur));
            var buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            var data = buffer.getChannelData(0);
            for (var i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * volume;
            }
            var source = this.ctx.createBufferSource();
            var gain = this.ctx.createGain();
            source.buffer = buffer;
            gain.gain.setValueAtTime(volume, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + tickDur);
            source.connect(gain);
            gain.connect(this._bgmGain);
            source.start(startTime);
            source._endTime = startTime + tickDur + 0.01;
            this._bgmActiveNodes.push(source);
        } catch (e) { /* ignore */ }
    },

    /**
     * Remove ended nodes from active list to prevent memory leak.
     */
    _bgmCleanupNodes: function() {
        var now = this.ctx.currentTime;
        var alive = [];
        for (var i = 0; i < this._bgmActiveNodes.length; i++) {
            var node = this._bgmActiveNodes[i];
            // BufferSource and Oscillator have playbackState in older browsers,
            // but modern browsers just throw on stop() of ended nodes.
            // We check the scheduled stop time if available.
            try {
                // If node hasn't been stopped/ended, keep it
                if (node._endTime && now > node._endTime + 0.1) {
                    // Already ended, skip
                } else {
                    alive.push(node);
                }
            } catch (e) {
                // Node errored, discard
            }
        }
        this._bgmActiveNodes = alive;
    },
};
