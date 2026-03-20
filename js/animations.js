/**
 * SlotGame Animations Module
 * Win line drawing, celebration effects, and particles.
 */
SlotGame.Animations = {
    canvas: null,
    ctx: null,
    cycleTimer: null,
    particles: [],
    particleRAF: null,

    /**
     * Initialize canvas overlay.
     */
    init: function() {
        this.canvas = document.getElementById('winline-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', this.resizeCanvas.bind(this));
    },

    /**
     * Resize canvas to match reel grid.
     */
    resizeCanvas: function() {
        var grid = document.getElementById('reel-grid');
        if (!grid) return;
        var rect = grid.getBoundingClientRect();
        var areaRect = document.getElementById('reel-area').getBoundingClientRect();

        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        this.canvas.style.left = (rect.left - areaRect.left) + 'px';
        this.canvas.style.top = (rect.top - areaRect.top) + 'px';
    },

    /**
     * Draw a single payline.
     * @param {number} paylineIndex
     * @param {number} matchCount - How many reels matched
     * @param {string} color
     */
    drawPayline: function(paylineIndex, matchCount, color) {
        var line = SlotGame.Config.paylines[paylineIndex];
        var cellWidth = this.canvas.width / SlotGame.Config.REELS;
        var cellHeight = this.canvas.height / SlotGame.Config.ROWS;

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 12;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.beginPath();

        for (var reel = 0; reel < SlotGame.Config.REELS; reel++) {
            var x = reel * cellWidth + cellWidth / 2;
            var y = line[reel] * cellHeight + cellHeight / 2;
            if (reel === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;

        // Draw circles at each position
        this.ctx.fillStyle = color;
        for (var r = 0; r < SlotGame.Config.REELS; r++) {
            var cx = r * cellWidth + cellWidth / 2;
            var cy = line[r] * cellHeight + cellHeight / 2;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, 6, 0, Math.PI * 2);
            this.ctx.fill();
        }
    },

    /**
     * Cycle through winning paylines, showing one at a time.
     * @param {Array} winDetails - Array of win objects from Paylines.evaluate
     */
    showWinLines: function(winDetails) {
        if (!winDetails || winDetails.length === 0) return;

        var self = this;
        var index = 0;
        var colors = SlotGame.Config.paylineColors;

        var cycle = function() {
            if (SlotGame.State.phase !== 'SHOWING_WINS') return;

            self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);

            var win = winDetails[index % winDetails.length];
            self.drawPayline(win.paylineIndex, win.count, colors[win.paylineIndex % colors.length]);

            // Highlight symbols for this payline
            SlotGame.Reels.highlightSymbols(win.positions);

            // Update line win text
            SlotGame.UI.showLineWin(win.payout, win.paylineIndex + 1);

            index++;
            self.cycleTimer = setTimeout(cycle, SlotGame.Config.WIN_LINE_CYCLE_DELAY);
        };
        cycle();
    },

    /**
     * Stop win line cycling.
     */
    stopWinLines: function() {
        if (this.cycleTimer) {
            clearTimeout(this.cycleTimer);
            this.cycleTimer = null;
        }
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        SlotGame.Reels.clearWinHighlights();
    },

    /**
     * Show all win lines at once (briefly).
     * @param {Array} winDetails
     */
    showAllWinLines: function(winDetails) {
        if (!winDetails || winDetails.length === 0) return;
        var colors = SlotGame.Config.paylineColors;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (var i = 0; i < winDetails.length; i++) {
            var win = winDetails[i];
            this.drawPayline(win.paylineIndex, win.count, colors[win.paylineIndex % colors.length]);
        }
    },

    /**
     * Spawn coin particles for celebrations.
     * @param {number} count
     */
    spawnCoinParticles: function(count) {
        var container = document.getElementById('reel-area');
        for (var i = 0; i < count; i++) {
            (function(idx) {
                setTimeout(function() {
                    var coin = document.createElement('div');
                    coin.className = 'coin-particle';
                    coin.textContent = ['🪙', '💰', '✨'][Math.floor(Math.random() * 3)];
                    coin.style.left = (Math.random() * 80 + 10) + '%';
                    coin.style.top = '-20px';
                    coin.style.animationDuration = (1.5 + Math.random() * 1) + 's';
                    coin.style.animationDelay = (idx * 0.05) + 's';
                    container.appendChild(coin);

                    setTimeout(function() {
                        if (coin.parentNode) coin.parentNode.removeChild(coin);
                    }, 3000);
                }, idx * 50);
            })(i);
        }
    },

    /**
     * Big win celebration.
     * @param {number} amount
     */
    bigWinCelebration: function(amount) {
        this.spawnCoinParticles(30);
        if (SlotGame.Audio) SlotGame.Audio.bigWin();
    },
};
