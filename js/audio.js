/**
 * SlotGame Audio Module
 * Programmatic sound effects using Web Audio API.
 */
SlotGame.Audio = {
    ctx: null,

    /**
     * Initialize AudioContext (must be called after user gesture).
     */
    init: function() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            // Web Audio not supported
        }
    },

    /**
     * Ensure AudioContext is running (resume if suspended).
     */
    ensureContext: function() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    /**
     * Play a single tone.
     */
    playTone: function(freq, duration, type, volume) {
        if (!this.ctx || !SlotGame.State.soundEnabled) return;
        this.ensureContext();
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
        if (!this.ctx || !SlotGame.State.soundEnabled) return;
        this.ensureContext();
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
