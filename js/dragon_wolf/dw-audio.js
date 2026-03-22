/**
 * Dragon Wolf Audio Module
 * 程序化 BGM（琵琶古箏 D大調 五聲音階 Base / A小調 懸疑 Free）
 * 重用 SlotGame.Audio.ctx，0.15s crossfade 切換
 */
var DragonWolf = window.DragonWolf || {};

DragonWolf.Audio = {
    ctx:         null,
    masterGain:  null,
    soundGain:   null,

    _bgmNodes:       [],
    _bgmScheduled:   false,
    _bgmNextBarTime: 0,
    _bgmMode:        'base',  // 'base' | 'free'
    _bgmBpm:         96,
    _bgmRunning:     false,

    init: function() {
        // 重用 Fortune Slots 的 AudioContext（如果存在）
        if (window.SlotGame && SlotGame.Audio && SlotGame.Audio.ctx) {
            this.ctx = SlotGame.Audio.ctx;
        } else {
            try {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            } catch(e) {
                this.ctx = null;
                return;
            }
        }

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.55;
        this.masterGain.connect(this.ctx.destination);

        this.soundGain = this.ctx.createGain();
        this.soundGain.gain.value = 1.0;
        this.soundGain.connect(this.masterGain);
    },

    // ── 主音量控制 ────────────────────────────────────────

    setSoundEnabled: function(enabled) {
        if (!this.soundGain) return;
        this.soundGain.gain.value = enabled ? 1.0 : 0.0;
    },

    // ── BGM ────────────────────────────────────────────

    bgmStart: function(mode) {
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') {
            try { this.ctx.resume(); } catch(e) {}
        }
        if (!DragonWolf.State.musicEnabled) return;

        var newMode = mode || 'base';
        if (this._bgmRunning && this._bgmMode === newMode) return;

        this._bgmMode    = newMode;
        this._bgmRunning = true;
        this._bgmNextBarTime = this.ctx.currentTime + 0.05;
        this._scheduleBgm();
    },

    bgmStop: function() {
        this._bgmRunning = false;
        this._stopAllBgmNodes();
    },

    bgmSetMode: function(mode) {
        if (!this._bgmRunning) return;
        if (this._bgmMode === mode) return;
        this._bgmMode        = mode;
        this._bgmNextBarTime = this.ctx.currentTime + 0.05; // 立即切換
    },

    _stopAllBgmNodes: function() {
        for (var i = 0; i < this._bgmNodes.length; i++) {
            try { this._bgmNodes[i].stop(); } catch(e) {}
            try { this._bgmNodes[i].disconnect(); } catch(e) {}
        }
        this._bgmNodes = [];
    },

    _scheduleBgm: function() {
        if (!this._bgmRunning || !this.ctx) return;

        var self = this;
        var now  = this.ctx.currentTime;

        // 提前 0.3s 排程下一個小節
        while (this._bgmNextBarTime < now + 0.3) {
            this._scheduleBar(this._bgmNextBarTime, this._bgmMode);
            var bpm     = this._bgmMode === 'base' ? 96 : 126;
            var barLen  = (60 / bpm) * 4; // 4拍一小節
            this._bgmNextBarTime += barLen;
        }

        var delay = Math.max(50, (this._bgmNextBarTime - now - 0.2) * 1000);
        if (this._bgmRunning) {
            setTimeout(function() { self._scheduleBgm(); }, delay);
        }
    },

    /**
     * 排程一個小節的 BGM
     * Base：D大調五聲音階，90-100 BPM，4層（pad/bass/arpeggio/rhythm）
     * Free：A小調，120-130 BPM，懸疑緊湊
     */
    _scheduleBar: function(startTime, mode) {
        if (!this.ctx) return;
        if (mode === 'base') {
            this._scheduleBaseBar(startTime);
        } else {
            this._scheduleFreeBar(startTime);
        }
    },

    // D大調五聲音階：D(293.66) E(329.63) F#(369.99) A(440) B(493.88) D5(587.33)
    _scheduleBaseBar: function(t0) {
        var bpm    = 96;
        var beat   = 60 / bpm;
        var bar    = beat * 4;

        // Chord progression: D - A - Bm - G (each 1 bar in 4-bar loop)
        // We pick a chord per call based on bar index
        // Use 和聲 pad
        var padFreqs = [293.66, 369.99, 440, 587.33]; // D maj chord (D F# A D5)
        this._playPad(t0, bar * 0.9, padFreqs, 0.08);

        // Bass line：D 根音
        this._playNote(t0,          0.05, 0.45, 146.83, 'triangle', 0.18); // D2
        this._playNote(t0 + beat,   0.05, 0.3,  220.00, 'triangle', 0.12); // A2
        this._playNote(t0 + beat*2, 0.05, 0.3,  146.83, 'triangle', 0.18);
        this._playNote(t0 + beat*3, 0.05, 0.2,  174.61, 'triangle', 0.12); // F3

        // Arpeggio 琵琶風：五聲音階快速撥奏
        var pentatonic = [293.66, 329.63, 369.99, 440, 493.88, 587.33, 659.26, 880];
        var arpPat     = [0, 2, 4, 5, 4, 2, 0, 1, 2, 4, 5, 7, 5, 4, 2, 0];
        for (var i = 0; i < arpPat.length; i++) {
            var arpTime = t0 + i * (beat / 4);
            var freq    = pentatonic[arpPat[i] % pentatonic.length];
            this._playNote(arpTime, 0.01, beat * 0.22, freq, 'sine', 0.07);
        }

        // 打擊節奏
        this._playDrum(t0,          0.12, 120, 0.18); // 強拍
        this._playDrum(t0 + beat,   0.08, 200, 0.10);
        this._playDrum(t0 + beat*2, 0.12, 120, 0.18);
        this._playDrum(t0 + beat*3, 0.08, 200, 0.10);
    },

    // A小調：A(220) C(261.63) D(293.66) E(329.63) G(392) A5(440) C5(523.25)
    _scheduleFreeBar: function(t0) {
        var bpm  = 126;
        var beat = 60 / bpm;
        var bar  = beat * 4;

        // 暗黑 pad：Am 和弦
        var padFreqs = [220, 261.63, 329.63, 440];
        this._playPad(t0, bar * 0.9, padFreqs, 0.06);

        // Bass：A 根音，八度跳躍
        this._playNote(t0,              0.04, 0.3,  110.00, 'sawtooth', 0.14); // A1
        this._playNote(t0 + beat * 0.5, 0.04, 0.2,  220.00, 'sawtooth', 0.08); // A2 八度跳
        this._playNote(t0 + beat,       0.04, 0.3,  110.00, 'sawtooth', 0.14);
        this._playNote(t0 + beat * 1.5, 0.04, 0.15, 123.47, 'sawtooth', 0.10); // B1
        this._playNote(t0 + beat*2,     0.04, 0.3,  110.00, 'sawtooth', 0.14);
        this._playNote(t0 + beat*3,     0.04, 0.3,  98.00,  'sawtooth', 0.12);  // G1

        // 懸疑旋律：A小調音階快速下行
        var minorScale = [440, 392, 349.23, 329.63, 293.66, 261.63, 220, 196];
        var melPat     = [0, 2, 3, 4, 3, 2, 0, 1, 3, 5, 7, 5, 3, 1, 0, 2];
        for (var i = 0; i < melPat.length; i++) {
            var mTime = t0 + i * (beat / 4);
            var mFreq = minorScale[melPat[i] % minorScale.length];
            this._playNote(mTime, 0.01, beat * 0.18, mFreq, 'square', 0.04);
        }

        // 緊湊打擊
        for (var b = 0; b < 8; b++) {
            this._playDrum(t0 + b * (beat / 2), 0.06, b % 2 === 0 ? 100 : 180, b % 2 === 0 ? 0.20 : 0.12);
        }
    },

    /** Pad 和弦音（多音同時） */
    _playPad: function(startTime, duration, freqs, gainVal) {
        if (!this.ctx) return;
        for (var i = 0; i < freqs.length; i++) {
            var osc  = this.ctx.createOscillator();
            var gain = this.ctx.createGain();
            osc.type      = 'sine';
            osc.frequency.value = freqs[i];
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(gainVal, startTime + 0.04);
            gain.gain.setValueAtTime(gainVal, startTime + duration - 0.1);
            gain.gain.linearRampToValueAtTime(0, startTime + duration);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(startTime);
            osc.stop(startTime + duration + 0.05);
            this._bgmNodes.push(osc);
        }
    },

    /** 單音符 */
    _playNote: function(startTime, attack, duration, freq, type, gainVal) {
        if (!this.ctx) return;
        var osc  = this.ctx.createOscillator();
        var gain = this.ctx.createGain();
        osc.type            = type || 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(gainVal, startTime + attack);
        gain.gain.setValueAtTime(gainVal, startTime + duration * 0.7);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);
        this._bgmNodes.push(osc);
    },

    /** 簡易打擊音（低頻噪音） */
    _playDrum: function(startTime, duration, freq, gainVal) {
        if (!this.ctx) return;
        var osc  = this.ctx.createOscillator();
        var gain = this.ctx.createGain();
        osc.type            = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.3, startTime + duration);
        gain.gain.setValueAtTime(gainVal, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.02);
        this._bgmNodes.push(osc);
    },

    // ── SFX ──────────────────────────────────────────────

    play: function(name) {
        if (!this.ctx) return;
        if (!DragonWolf.State.soundEnabled) return;
        if (this.ctx.state === 'suspended') {
            try { this.ctx.resume(); } catch(e) {}
        }
        switch (name) {
            case 'spin_start':  this._sfxSpinStart();  break;
            case 'reel_stop':   this._sfxReelStop();   break;
            case 'win_small':   this._sfxWinSmall();   break;
            case 'win_big':     this._sfxWinBig();     break;
            case 'scatter':     this._sfxScatter();    break;
            case 'palm_hit':    this._sfxPalmHit();    break;
            case 'fs_intro':    this._sfxFsIntro();    break;
            case 'laugh':       this._sfxLaugh();      break;
        }
    },

    _sfxSpinStart: function() {
        if (!this.ctx) return;
        var osc  = this.ctx.createOscillator();
        var gain = this.ctx.createGain();
        var t    = this.ctx.currentTime;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.linearRampToValueAtTime(200, t + 0.1);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.1);
        osc.connect(gain); gain.connect(this.soundGain);
        osc.start(t); osc.stop(t + 0.12);
    },

    _sfxReelStop: function() {
        if (!this.ctx) return;
        var osc  = this.ctx.createOscillator();
        var gain = this.ctx.createGain();
        var t    = this.ctx.currentTime;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(450, t);
        osc.frequency.exponentialRampToValueAtTime(150, t + 0.08);
        gain.gain.setValueAtTime(0.20, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.connect(gain); gain.connect(this.soundGain);
        osc.start(t); osc.stop(t + 0.1);
    },

    _sfxWinSmall: function() {
        if (!this.ctx) return;
        var t = this.ctx.currentTime;
        var notes = [523.25, 659.26, 783.99];
        for (var i = 0; i < notes.length; i++) {
            var osc  = this.ctx.createOscillator();
            var gain = this.ctx.createGain();
            var dt   = t + i * 0.1;
            osc.type = 'sine';
            osc.frequency.value = notes[i];
            gain.gain.setValueAtTime(0, dt);
            gain.gain.linearRampToValueAtTime(0.18, dt + 0.02);
            gain.gain.linearRampToValueAtTime(0, dt + 0.18);
            osc.connect(gain); gain.connect(this.soundGain);
            osc.start(dt); osc.stop(dt + 0.2);
        }
    },

    _sfxWinBig: function() {
        if (!this.ctx) return;
        var t     = this.ctx.currentTime;
        var notes = [261.63, 329.63, 392, 523.25, 659.26, 783.99, 1046.5];
        for (var i = 0; i < notes.length; i++) {
            var osc  = this.ctx.createOscillator();
            var gain = this.ctx.createGain();
            var dt   = t + i * 0.08;
            osc.type = 'sine';
            osc.frequency.value = notes[i];
            gain.gain.setValueAtTime(0, dt);
            gain.gain.linearRampToValueAtTime(0.22, dt + 0.03);
            gain.gain.linearRampToValueAtTime(0, dt + 0.25);
            osc.connect(gain); gain.connect(this.soundGain);
            osc.start(dt); osc.stop(dt + 0.3);
        }
    },

    /** 散彩（Scatter 觸發） */
    _sfxScatter: function() {
        if (!this.ctx) return;
        var t = this.ctx.currentTime;
        // 神秘的三音和弦
        var freqs = [293.66, 440, 659.26];
        for (var i = 0; i < freqs.length; i++) {
            var osc  = this.ctx.createOscillator();
            var gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freqs[i];
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.15, t + 0.08);
            gain.gain.setValueAtTime(0.15, t + 0.4);
            gain.gain.linearRampToValueAtTime(0, t + 0.8);
            osc.connect(gain); gain.connect(this.soundGain);
            osc.start(t); osc.stop(t + 0.85);
        }
    },

    /** 掌力打牆（隨機百搭放置） */
    _sfxPalmHit: function() {
        if (!this.ctx) return;
        var t    = this.ctx.currentTime;
        // 衝擊音（噪音爆炸）
        var buf  = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.08, this.ctx.sampleRate);
        var data = buf.getChannelData(0);
        for (var i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
        }
        var src  = this.ctx.createBufferSource();
        var gain = this.ctx.createGain();
        var filt = this.ctx.createBiquadFilter();
        src.buffer   = buf;
        filt.type    = 'bandpass';
        filt.frequency.value = 400;
        filt.Q.value = 0.5;
        gain.gain.setValueAtTime(0.6, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        src.connect(filt); filt.connect(gain); gain.connect(this.soundGain);
        src.start(t); src.stop(t + 0.1);

        // 加一個低頻衝擊 tone
        var osc  = this.ctx.createOscillator();
        var og   = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.08);
        og.gain.setValueAtTime(0.35, t);
        og.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.connect(og); og.connect(this.soundGain);
        osc.start(t); osc.stop(t + 0.12);
    },

    /** Free Spins 進場音效 */
    _sfxFsIntro: function() {
        if (!this.ctx) return;
        var t     = this.ctx.currentTime;
        // 上升音階
        var notes = [220, 293.66, 349.23, 440, 523.25, 698.46, 880];
        for (var i = 0; i < notes.length; i++) {
            var osc  = this.ctx.createOscillator();
            var gain = this.ctx.createGain();
            var dt   = t + i * 0.12;
            osc.type = 'sawtooth';
            osc.frequency.value = notes[i];
            gain.gain.setValueAtTime(0, dt);
            gain.gain.linearRampToValueAtTime(0.12, dt + 0.04);
            gain.gain.linearRampToValueAtTime(0, dt + 0.18);
            osc.connect(gain); gain.connect(this.soundGain);
            osc.start(dt); osc.stop(dt + 0.2);
        }
    },

    /** 黑白郎君笑聲（轉場動畫用）— 程序化合成 */
    _sfxLaugh: function() {
        if (!this.ctx) return;
        var t = this.ctx.currentTime;
        // Ha Ha Ha：三個衝擊音
        var times = [0, 0.22, 0.44];
        for (var k = 0; k < times.length; k++) {
            var dt   = t + times[k];
            var osc  = this.ctx.createOscillator();
            var gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, dt);
            osc.frequency.linearRampToValueAtTime(180, dt + 0.18);
            gain.gain.setValueAtTime(0.18, dt);
            gain.gain.linearRampToValueAtTime(0, dt + 0.18);
            osc.connect(gain); gain.connect(this.soundGain);
            osc.start(dt); osc.stop(dt + 0.2);
        }
    }
};
