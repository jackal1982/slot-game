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
    _barIndex:       0,

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
        this._barIndex   = 0;
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
        this._barIndex       = 0;
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

        // 提前 0.3s 排程下一個小節（4 小節循環）
        while (this._bgmNextBarTime < now + 0.3) {
            this._scheduleBar(this._bgmNextBarTime, this._bgmMode);
            var bpm     = this._bgmMode === 'base' ? 96 : 120;
            var barLen  = (60 / bpm) * 4; // 4拍一小節
            this._bgmNextBarTime += barLen;
            this._barIndex = (this._barIndex + 1) % 4;
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
            this._scheduleBaseBar(startTime, this._barIndex);
        } else {
            this._scheduleFreeBar(startTime, this._barIndex);
        }
    },

    /**
     * Base Game BGM — 4 小節循環（96 BPM × 4 bar = 10 秒）
     * D 五聲音階（D-E-F#-A-B），武俠/東方大氣風格
     * 4 個和聲中心：Bar0=D開5度, Bar1=A開5度, Bar2=F#開5度, Bar3=Bm解決回D
     *
     * 音符頻率參考（D 五聲音階）：
     *   D2=73.42  F#2=92.50  A2=110.00  B2=123.47
     *   D3=146.83 E3=164.81  F#3=185.00 A3=220.00 B3=246.94
     *   D4=293.66 E4=329.63  F#4=369.99 A4=440.00 B4=493.88
     *   D5=587.33 E5=659.26  F#5=739.99
     */
    _scheduleBaseBar: function(t0, barIdx) {
        var bpm  = 96;
        var beat = 60 / bpm;      // 0.625 s
        var bar  = beat * 4;      // 2.5 s
        var s16  = beat / 4;      // 0.15625 s（十六分音符）
        var idx  = barIdx % 4;

        // ── Pad（開放5度，東方感） ──────────────────────────
        var padChords = [
            [146.83, 220.00, 293.66, 440.00],    // D3-A3-D4-A4 (D 開5度)
            [110.00, 164.81, 220.00, 329.63],    // A2-E3-A3-E4 (A 開5度，明亮)
            [185.00, 277.18, 369.99, 554.37],    // F#3-C#4-F#4-C#5 (F# 開5度，張力)
            [185.00, 246.94, 369.99, 493.88],    // F#3-B3-F#4-B4 (Bm 開5度，引回D)
        ];
        this._playPad(t0, bar * 0.92, padChords[idx], 0.060);

        // ── Bass（三角波，根音行走） ─────────────────────────
        // 各小節：[D, A, F#, B→解決至D] 根音 + 四拍行走
        var bassLines = [
            [[73.42, beat*0.72], [110.00, beat*0.50], [73.42, beat*0.72], [92.50, beat*0.50]],
            [[110.00, beat*0.72],[164.81, beat*0.50],[110.00, beat*0.72], [82.41, beat*0.50]],
            [[92.50, beat*0.72], [138.59, beat*0.50], [92.50, beat*0.72],[110.00, beat*0.50]],
            [[123.47,beat*0.70], [110.00, beat*0.65], [92.50, beat*0.60],[73.42, beat*0.80]],
        ];
        var bl = bassLines[idx];
        for (var b = 0; b < 4; b++) {
            this._playNote(t0 + b * beat, 0.04, bl[b][1], bl[b][0], 'triangle', 0.22);
        }

        // ── 琵琶撥奏（16 個十六分音符，D 五聲音階） ─────────
        var arpPatterns = [
            // Bar 0 (D)：上行後在中音區迴轉
            [293.66,329.63,369.99,440.00, 493.88,440.00,369.99,329.63,
             293.66,246.94,293.66,369.99, 440.00,369.99,293.66,220.00],
            // Bar 1 (A)：以 A 為中心，向上延伸
            [220.00,246.94,293.66,329.63, 369.99,440.00,493.88,440.00,
             369.99,329.63,369.99,440.00, 493.88,440.00,369.99,293.66],
            // Bar 2 (F#)：攀上高音區（高潮前）
            [369.99,440.00,493.88,587.33, 659.26,587.33,493.88,440.00,
             493.88,587.33,659.26,739.99, 659.26,587.33,493.88,440.00],
            // Bar 3 (解決)：下行回到 D，銜接循環
            [440.00,369.99,329.63,293.66, 246.94,220.00,185.00,164.81,
             185.00,220.00,246.94,293.66, 369.99,293.66,246.94,220.00],
        ];
        var arp = arpPatterns[idx];
        for (var i = 0; i < 16; i++) {
            this._playNote(t0 + i * s16, 0.01, s16 * 0.75, arp[i], 'sine', 0.062);
        }

        // ── 二胡旋律（四個四分音符，悠揚歌唱） ──────────────
        // 旋律弧線：D4上升→A浮遊→B4高潮→D4解決，完美首尾相接
        var melodies = [
            [293.66, 369.99, 440.00, 369.99],  // Bar 0: D4-F#4-A4-F#4
            [440.00, 493.88, 440.00, 329.63],  // Bar 1: A4-B4-A4-E4
            [493.88, 587.33, 659.26, 587.33],  // Bar 2: B4-D5-E5-D5 (高潮!)
            [493.88, 440.00, 369.99, 293.66],  // Bar 3: B4-A4-F#4-D4 (優雅降回)
        ];
        var mel = melodies[idx];
        for (var j = 0; j < 4; j++) {
            this._playMelodyNote(t0 + j * beat, beat * 0.88, mel[j], 0.13);
        }

        // ── 古風鼓（強-弱-強-弱，後兩小節加切分） ───────────
        this._playDrum(t0,           0.10, 90,  0.22);
        this._playDrum(t0 + beat,    0.07, 180, 0.12);
        this._playDrum(t0 + beat*2,  0.10, 90,  0.22);
        this._playDrum(t0 + beat*3,  0.07, 180, 0.12);
        if (idx >= 1) {
            this._playDrum(t0 + beat*0.5, 0.05, 260, 0.07);
            this._playDrum(t0 + beat*2.5, 0.05, 260, 0.07);
        }
    },

    /**
     * Free Game BGM — 4 小節循環（120 BPM × 4 bar = 8 秒）
     * A 小調五聲音階（A-C-D-E-G），緊張刺激戰鬥風格
     * 4 個和聲中心：Bar0=Am, Bar1=Dm, Bar2=Em(最緊張), Bar3=Gm→Am
     *
     * 音符頻率參考（A 小調五聲音階）：
     *   A2=110.00  C3=130.81  D3=146.83  E3=164.81  G3=196.00
     *   A3=220.00  C4=261.63  D4=293.66  E4=329.63  G4=392.00
     *   A4=440.00  C5=523.25  D5=587.33  E5=659.26  G5=784.00  A5=880.00
     */
    _scheduleFreeBar: function(t0, barIdx) {
        var bpm  = 120;
        var beat = 60 / bpm;     // 0.5 s
        var bar  = beat * 4;     // 2.0 s
        var s16  = beat / 4;     // 0.125 s（十六分音符）
        var s8   = beat / 2;     // 0.25 s（八分音符）
        var idx  = barIdx % 4;

        // ── Pad（開放5度，暗沉緊繃） ────────────────────────
        var padChords = [
            [110.00, 164.81, 220.00, 329.63],   // Am: A2-E3-A3-E4
            [146.83, 220.00, 293.66, 440.00],   // Dm: D3-A3-D4-A4
            [164.81, 246.94, 329.63, 493.88],   // Em: E3-B3-E4-B4 (最大張力)
            [196.00, 293.66, 392.00, 261.63],   // Gm: G3-D4-G4-C5 (引回Am)
        ];
        this._playPad(t0, bar * 0.90, padChords[idx], 0.055);

        // ── Bass（鋸齒波，推進式八分音符） ─────────────────
        var bassLines = [
            // Am：根音+八度跳+色彩音
            [110.00, 220.00, 110.00, 110.00, 146.83, 110.00, 220.00, 110.00],
            // Dm：走動低音
            [146.83, 146.83, 110.00, 146.83, 146.83, 196.00, 220.00, 146.83],
            // Em：保持音+張力
            [164.81, 164.81, 246.94, 164.81, 164.81, 164.81, 146.83, 164.81],
            // Gm→Am：轉場低音
            [196.00, 196.00, 146.83, 196.00, 110.00, 110.00, 164.81, 110.00],
        ];
        var bl2 = bassLines[idx];
        for (var b = 0; b < 8; b++) {
            this._playNote(t0 + b * s8, 0.02, s8 * 0.75, bl2[b], 'sawtooth', 0.16);
        }

        // ── 古箏快速走句（16 個十六分音符，A 小調五聲音階） ─
        var runPatterns = [
            // Bar 0 (Am)：上行後迴轉
            [220.00,261.63,293.66,329.63, 392.00,440.00,392.00,329.63,
             293.66,329.63,392.00,440.00, 523.25,440.00,392.00,329.63],
            // Bar 1 (Dm)：強調 D，向上攀升
            [293.66,329.63,392.00,440.00, 523.25,587.33,523.25,440.00,
             392.00,440.00,523.25,587.33, 659.26,587.33,523.25,440.00],
            // Bar 2 (Em)：最高音區，最刺激
            [440.00,523.25,587.33,659.26, 784.00,659.26,587.33,523.25,
             587.33,659.26,784.00,880.00, 784.00,659.26,587.33,523.25],
            // Bar 3 (Gm→Am)：下行，衝回循環
            [392.00,329.63,293.66,261.63, 220.00,261.63,293.66,329.63,
             261.63,220.00,196.00,220.00, 261.63,293.66,261.63,220.00],
        ];
        var run = runPatterns[idx];
        for (var i = 0; i < 16; i++) {
            this._playNote(t0 + i * s16, 0.01, s16 * 0.65, run[i], 'sine', 0.055);
        }

        // ── 戰鬥鼓（16分音符網格：踢鼓+軍鼓+踩鈸） ────────
        for (var k = 0; k < 16; k++) {
            var pTime = t0 + k * s16;
            if (k % 4 === 0) {
                this._playDrum(pTime, 0.10, 70, 0.26);     // 踢鼓（強拍）
            } else if (k % 4 === 2) {
                this._playDrum(pTime, 0.06, 190, 0.18);    // 軍鼓（弱拍）
            } else {
                this._playHihat(pTime, 0.04, 0.07);        // 踩鈸（off-beat）
            }
        }
        // Bar 2 最緊張，加入額外重音
        if (idx === 2) {
            this._playDrum(t0 + beat*1.5, 0.07, 130, 0.15);
            this._playDrum(t0 + beat*3.5, 0.07, 130, 0.15);
        }
    },

    /** 旋律音（二胡/笛子風，緩慢起音，長持續） */
    _playMelodyNote: function(startTime, duration, freq, gainVal) {
        if (!this.ctx || !freq) return;
        var osc  = this.ctx.createOscillator();
        var gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(gainVal, startTime + 0.08);
        gain.gain.setValueAtTime(gainVal, startTime + duration * 0.78);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);
        this._bgmNodes.push(osc);
    },

    /** 踩鈸（高通噪音，短促清脆） */
    _playHihat: function(startTime, duration, gainVal) {
        if (!this.ctx) return;
        var sr  = this.ctx.sampleRate;
        var len = Math.round(sr * Math.min(duration, 0.05));
        var buf  = this.ctx.createBuffer(1, len, sr);
        var data = buf.getChannelData(0);
        for (var i = 0; i < len; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4);
        }
        var src  = this.ctx.createBufferSource();
        var filt = this.ctx.createBiquadFilter();
        var gain = this.ctx.createGain();
        src.buffer          = buf;
        filt.type           = 'highpass';
        filt.frequency.value = 8000;
        gain.gain.setValueAtTime(gainVal, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        src.connect(filt);
        filt.connect(gain);
        gain.connect(this.masterGain);
        src.start(startTime);
        src.stop(startTime + duration + 0.01);
        this._bgmNodes.push(src);
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
