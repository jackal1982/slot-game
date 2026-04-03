/**
 * Dragon Wolf Audio Module
 * BGM 使用 MP3 音檔播放（Base / Free 兩種模式），0.15s crossfade 切換
 * 重用 SlotGame.Audio.ctx
 */
var DragonWolf = window.DragonWolf || {};

DragonWolf.Audio = {
    ctx:         null,
    masterGain:  null,
    soundGain:   null,

    // BGM 音檔播放相關
    _bgmBuffers:     { base: null, free: null },
    _bgmSource:      null,   // 目前播放中的 BufferSource
    _bgmGain:        null,   // BGM 專用 GainNode
    _bgmMode:        'base', // 'base' | 'free'
    _bgmRunning:     false,
    _bgmLoaded:      false,

    // SFX MP3 音檔（laugh 等）
    _sfxBuffers:     {},

    /** buffer 載入完成後，若 bgmStart 已被呼叫但當時 buffer 不存在，補播 BGM */
    _onBgmLoaded: function() {
        if (this._bgmRunning && !this._bgmSource) {
            this._playBgmTrack(this._bgmMode);
        }
    },

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

        // BGM 專用 gain node（用於 crossfade）
        this._bgmGain = this.ctx.createGain();
        this._bgmGain.gain.value = 1.0;
        this._bgmGain.connect(this.masterGain);

        // 預載 BGM 音檔
        this._loadBgmFiles();

        // 預載 SFX MP3 音檔
        this._loadSfxFiles();

        // 切換 App 回來時恢復 BGM
        var self = this;
        var _bgmWasRunning = false;
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                _bgmWasRunning = self._bgmRunning || false;
                self.bgmStop();
            } else {
                if (self.ctx && self.ctx.state === 'suspended') {
                    self.ctx.resume();
                }
                if (_bgmWasRunning && DragonWolf.State.musicEnabled) {
                    self.bgmStart(self._bgmMode);
                }
            }
        });
    },

    /** 預載 SFX MP3 音檔（laugh 等） */
    _loadSfxFiles: function() {
        if (!this.ctx) return;
        var self  = this;
        var files = {
            laugh:        'audio/dragon_wolf/dw-laugh.mp3',
            'free-bigwin': 'audio/dragon_wolf/free-bigwin.mp3'
        };
        var keys  = Object.keys(files);

        function loadOne(key, url) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'arraybuffer';
            xhr.onload = function() {
                if (xhr.status === 200) {
                    self.ctx.decodeAudioData(xhr.response, function(buffer) {
                        self._sfxBuffers[key] = buffer;
                    }, function() { /* decode fail — ignore */ });
                }
            };
            xhr.onerror = function() { /* file not found — ignore */ };
            xhr.send();
        }

        for (var i = 0; i < keys.length; i++) {
            loadOne(keys[i], files[keys[i]]);
        }
    },

    /** 播放已載入的 SFX MP3 buffer，回傳 true 表示成功 */
    _playSfxBuffer: function(key) {
        if (!this.ctx || !this._sfxBuffers[key]) return false;
        var src  = this.ctx.createBufferSource();
        var gain = this.ctx.createGain();
        src.buffer = this._sfxBuffers[key];
        gain.gain.value = 1.0;
        src.connect(gain);
        gain.connect(this.soundGain);
        src.start(0);
        return true;
    },

    /** 預載 Base / Free 兩個 BGM MP3 檔 */
    _loadBgmFiles: function() {
        if (!this.ctx) return;
        var self = this;
        var files = {
            base: 'audio/dragon_wolf/dw-bgm-normal.mp3',
            free: 'audio/dragon_wolf/dw-bgm-free.mp3'
        };
        var loaded = 0;
        var total  = 2;

        function loadOne(key, url) {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'arraybuffer';
            xhr.onload = function() {
                if (xhr.status === 200) {
                    self.ctx.decodeAudioData(xhr.response, function(buffer) {
                        self._bgmBuffers[key] = buffer;
                        loaded++;
                        if (loaded >= total) { self._bgmLoaded = true; self._onBgmLoaded(); }
                    }, function() {
                        loaded++;
                        if (loaded >= total) { self._bgmLoaded = true; self._onBgmLoaded(); }
                    });
                } else {
                    loaded++;
                    if (loaded >= total) { self._bgmLoaded = true; self._onBgmLoaded(); }
                }
            };
            xhr.onerror = function() {
                loaded++;
                if (loaded >= total) { self._bgmLoaded = true; self._onBgmLoaded(); }
            };
            xhr.send();
        }

        loadOne('base', files.base);
        loadOne('free', files.free);
    },

    // ── 主音量控制 ────────────────────────────────────────

    setSoundEnabled: function(enabled) {
        if (!this.soundGain) return;
        this.soundGain.gain.value = enabled ? 1.0 : 0.0;
    },

    // ── BGM（音檔播放） ─────────────────────────────────

    bgmStart: function(mode) {
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') {
            try { this.ctx.resume(); } catch(e) {}
        }
        if (!DragonWolf.State.musicEnabled) return;

        var newMode = mode || 'base';
        if (this._bgmRunning && this._bgmMode === newMode) return;

        this._bgmMode = newMode;
        this._bgmRunning = true;
        this._playBgmTrack(newMode);
    },

    bgmStop: function() {
        this._bgmRunning = false;
        this._stopBgmSource(0.15);
    },

    bgmSetMode: function(mode) {
        if (!this._bgmRunning) return;
        if (this._bgmMode === mode) return;
        this._bgmMode = mode;
        // crossfade：淡出舊的，淡入新的
        this._crossfadeTo(mode);
    },

    /** 播放指定模式的 BGM 音軌 */
    _playBgmTrack: function(mode) {
        if (!this.ctx || !this._bgmGain) return;
        var buffer = this._bgmBuffers[mode];
        if (!buffer) return;

        // 停掉舊的（如果有）
        this._stopBgmSourceImmediate();

        var src  = this.ctx.createBufferSource();
        src.buffer = buffer;
        src.loop   = true;
        src.connect(this._bgmGain);
        this._bgmGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
        src.start(0);
        this._bgmSource = src;
    },

    /** crossfade 切換到新模式（0.15s 淡出舊 → 淡入新） */
    _crossfadeTo: function(newMode) {
        if (!this.ctx || !this._bgmGain) return;
        var buffer = this._bgmBuffers[newMode];
        if (!buffer) return;

        var self = this;
        var now  = this.ctx.currentTime;
        var fade = 0.15;

        // 淡出目前的
        this._bgmGain.gain.setValueAtTime(this._bgmGain.gain.value, now);
        this._bgmGain.gain.linearRampToValueAtTime(0, now + fade);

        // 淡出結束後，停掉舊的、啟動新的、淡入
        setTimeout(function() {
            if (!self._bgmRunning) return;
            self._stopBgmSourceImmediate();

            var src  = self.ctx.createBufferSource();
            src.buffer = buffer;
            src.loop   = true;
            src.connect(self._bgmGain);

            var t = self.ctx.currentTime;
            self._bgmGain.gain.setValueAtTime(0, t);
            self._bgmGain.gain.linearRampToValueAtTime(1.0, t + fade);
            src.start(0);
            self._bgmSource = src;
        }, fade * 1000);
    },

    /** 淡出停止目前 BGM source */
    _stopBgmSource: function(fadeTime) {
        if (!this._bgmSource || !this.ctx || !this._bgmGain) return;
        var now = this.ctx.currentTime;
        var ft  = fadeTime || 0.15;
        this._bgmGain.gain.setValueAtTime(this._bgmGain.gain.value, now);
        this._bgmGain.gain.linearRampToValueAtTime(0, now + ft);
        var src = this._bgmSource;
        this._bgmSource = null;
        setTimeout(function() {
            try { src.stop(); } catch(e) {}
            try { src.disconnect(); } catch(e) {}
        }, ft * 1000 + 50);
    },

    /** 立即停止 BGM source（無淡出） */
    _stopBgmSourceImmediate: function() {
        if (!this._bgmSource) return;
        try { this._bgmSource.stop(); } catch(e) {}
        try { this._bgmSource.disconnect(); } catch(e) {}
        this._bgmSource = null;
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
            case 'palm_hit':      this._sfxPalmHit();      break;
            case 'meteor_impact': this._sfxMeteorImpact(); break;
            case 'fs_intro':      this._sfxFsIntro();      break;
            case 'laugh':         this._sfxLaugh();        break;
            case 'free-bigwin':   this._sfxFreeBigwin();   break;
        }
    },

    _sfxFreeBigwin: function() {
        if (!this._playSfxBuffer('free-bigwin')) {
            /* fallback: 用合成音代替，避免無聲 */
            try {
                var osc  = this.ctx.createOscillator();
                var gain = this.ctx.createGain();
                var t    = this.ctx.currentTime;
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(440, t);
                osc.frequency.linearRampToValueAtTime(880, t + 0.5);
                gain.gain.setValueAtTime(0.3, t);
                gain.gain.linearRampToValueAtTime(0, t + 1.0);
                osc.connect(gain);
                gain.connect(this.soundGain);
                osc.start(t);
                osc.stop(t + 1.0);
            } catch(e) {}
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

    /** 隕石撞擊（Wild 著地，比 palm_hit 更重更震撼） */
    _sfxMeteorImpact: function() {
        if (!this.ctx) return;
        var t = this.ctx.currentTime;
        // 1. 重低頻撞擊（更長更深）
        var osc1 = this.ctx.createOscillator();
        var g1   = this.ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(80, t);
        osc1.frequency.exponentialRampToValueAtTime(30, t + 0.25);
        g1.gain.setValueAtTime(0.55, t);
        g1.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc1.connect(g1); g1.connect(this.soundGain);
        osc1.start(t); osc1.stop(t + 0.35);

        // 2. 噪音爆裂（更大更寬）
        var buf  = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.15, this.ctx.sampleRate);
        var data = buf.getChannelData(0);
        for (var i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 1.5);
        }
        var src  = this.ctx.createBufferSource();
        var g2   = this.ctx.createGain();
        var filt = this.ctx.createBiquadFilter();
        src.buffer     = buf;
        filt.type      = 'lowpass';
        filt.frequency.setValueAtTime(800, t);
        filt.frequency.exponentialRampToValueAtTime(200, t + 0.15);
        filt.Q.value   = 1.0;
        g2.gain.setValueAtTime(0.7, t);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        src.connect(filt); filt.connect(g2); g2.connect(this.soundGain);
        src.start(t); src.stop(t + 0.18);

        // 3. 金屬共鳴回響
        var osc2 = this.ctx.createOscillator();
        var g3   = this.ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(150, t + 0.02);
        osc2.frequency.exponentialRampToValueAtTime(60, t + 0.2);
        g3.gain.setValueAtTime(0.25, t + 0.02);
        g3.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc2.connect(g3); g3.connect(this.soundGain);
        osc2.start(t + 0.02); osc2.stop(t + 0.3);
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

    /** 黑白郎君笑聲 — 優先用 MP3，fallback 程序化合成 */
    _sfxLaugh: function() {
        if (!this.ctx) return;
        // 優先播放 MP3 音檔
        if (this._playSfxBuffer('laugh')) return;
        // Fallback：程序化合成 Ha Ha Ha
        var t = this.ctx.currentTime;
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
