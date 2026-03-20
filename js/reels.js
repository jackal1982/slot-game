/**
 * SlotGame Reels Module
 * Manages reel rendering, spinning animation, and stopping logic.
 */
SlotGame.Reels = {
    // DOM references (set in init)
    strips: [],       // reel-strip elements
    viewports: [],    // reel-viewport elements
    symbolSize: 100,  // Default, updated on resize

    // Animation state
    spinning: false,
    reelTimers: [],
    spinAnimFrames: [],
    _spinGeneration: 0, // Increments each spin to invalidate stale callbacks
    _reelStopped: [],   // Tracks which reels have naturally stopped

    /**
     * Initialize reel module - get DOM references, detect symbol size.
     */
    init: function() {
        for (var i = 0; i < SlotGame.Config.REELS; i++) {
            this.strips[i] = document.getElementById('reel-strip-' + i);
            this.viewports[i] = this.strips[i].parentElement;
        }
        this.detectSymbolSize();
        this.renderStaticGrid(SlotGame.RNG.generateGrid());
    },

    /**
     * Detect current symbol size from CSS.
     */
    detectSymbolSize: function() {
        var vp = this.viewports[0];
        if (vp) {
            this.symbolSize = vp.clientHeight / SlotGame.Config.ROWS;
        }
    },

    /**
     * Create a symbol DOM element.
     * @param {number} symbolId
     * @returns {HTMLElement}
     */
    createSymbolEl: function(symbolId) {
        var div = document.createElement('div');
        div.className = 'symbol';
        div.setAttribute('data-symbol', symbolId);
        var img = document.createElement('img');
        img.src = SlotGame.Config.symbols[symbolId].img;
        img.alt = SlotGame.Config.symbols[symbolId].name;
        img.draggable = false;
        div.appendChild(img);
        return div;
    },

    /**
     * Render a static 5x3 grid (no animation).
     * @param {number[][]} grid - grid[reel][row]
     */
    renderStaticGrid: function(grid) {
        SlotGame.State.grid = grid;
        for (var reel = 0; reel < SlotGame.Config.REELS; reel++) {
            var strip = this.strips[reel];
            strip.innerHTML = '';
            strip.style.transition = 'none';
            strip.style.transform = 'translateY(0)';

            for (var row = 0; row < SlotGame.Config.ROWS; row++) {
                strip.appendChild(this.createSymbolEl(grid[reel][row]));
            }
        }
    },

    /**
     * Get symbol elements currently visible in the final grid.
     * @returns {HTMLElement[][]} 5x3 array of symbol elements
     */
    getVisibleSymbols: function() {
        var result = [];
        for (var reel = 0; reel < SlotGame.Config.REELS; reel++) {
            var strip = this.strips[reel];
            var children = strip.children;
            var totalSymbols = children.length;
            var reelSymbols = [];
            // The last 3 symbols are the final visible ones
            for (var row = 0; row < SlotGame.Config.ROWS; row++) {
                reelSymbols.push(children[totalSymbols - SlotGame.Config.ROWS + row]);
            }
            result.push(reelSymbols);
        }
        return result;
    },

    /**
     * Start spinning all reels, then stop at target grid.
     * @param {number[][]} targetGrid - grid[reel][row] = symbolId
     * @param {function} onAllStopped - callback when all reels have stopped
     */
    // Store for slam stop
    _targetGrid: null,
    _onAllStopped: null,

    spin: function(targetGrid, onAllStopped) {
        var self = this;
        this.spinning = true;
        this._targetGrid = targetGrid;
        this._onAllStopped = onAllStopped;
        this._spinGeneration++;
        var gen = this._spinGeneration;
        this._reelStopped = [];
        for (var ri = 0; ri < SlotGame.Config.REELS; ri++) this._reelStopped[ri] = false;
        this.detectSymbolSize();

        var turbo = SlotGame.State.turboMode;
        var baseDuration = SlotGame.Config.REEL_SPIN_DURATION;
        var stagger = SlotGame.Config.REEL_STOP_STAGGER;
        if (turbo) {
            baseDuration *= SlotGame.Config.TURBO_SPEED_FACTOR;
            stagger *= SlotGame.Config.TURBO_SPEED_FACTOR;
        }

        // Number of "extra" symbols to scroll through before landing
        var baseExtra = turbo ? 8 : 20;
        var reelsStopped = 0;
        var BOUNCE_DURATION = 180; // ms for bounce-back phase (fixed, not affected by turbo)
        var symCount = SlotGame.Config.symbols.length;

        for (var reel = 0; reel < SlotGame.Config.REELS; reel++) {
            (function(r) {
                var strip = self.strips[r];
                var extraCount = baseExtra + r * 5; // Each reel spins a bit longer
                var stopPos = SlotGame.RNG._stopPositions[r];
                var reelStrip = SlotGame.RNG.generateReelStrip(r, stopPos, extraCount);

                // Prepend current visible symbols so the reel starts showing the previous result
                var currentColumn = SlotGame.State.grid ? SlotGame.State.grid[r] : null;

                // Build reel strip DOM: [current 3] + [extra random] + [target 3] + [1 buffer]
                strip.innerHTML = '';
                strip.style.transition = 'none';
                strip.style.transform = 'translateY(0px)';

                // Add current symbols at the top (visible at start)
                if (currentColumn) {
                    for (var c = 0; c < currentColumn.length; c++) {
                        strip.appendChild(self.createSymbolEl(currentColumn[c]));
                    }
                }

                // Add the scrolling symbols + target
                for (var s = 0; s < reelStrip.length; s++) {
                    strip.appendChild(self.createSymbolEl(reelStrip[s]));
                }

                // Add 1 buffer symbol after target for overshoot visual coverage
                strip.appendChild(self.createSymbolEl(Math.floor(Math.random() * symCount)));

                // Force reflow so browser registers the starting position
                strip.offsetHeight;

                // Calculate final position (buffer NOT counted in totalSymbols)
                var totalSymbols = (currentColumn ? currentColumn.length : 0) + reelStrip.length;
                var totalHeight = totalSymbols * self.symbolSize;
                var viewportHeight = SlotGame.Config.ROWS * self.symbolSize;
                var targetY = -(totalHeight - viewportHeight);

                // Overshoot: go 15% of symbol height past the target
                var overshootY = targetY - self.symbolSize * 0.15;

                // Start scroll animation after stagger delay
                var startDelay = r * stagger;
                var spinTime = baseDuration + r * stagger;

                self.reelTimers[r] = setTimeout(function() {
                    // Phase 1: Main scroll to overshoot position
                    strip.style.transition = 'transform ' + spinTime + 'ms cubic-bezier(0.2, 0.0, 0.3, 1.0)';
                    strip.style.transform = 'translateY(' + overshootY + 'px)';

                    // When Phase 1 transition ends
                    var phase1Fired = false;
                    var onPhase1End = function() {
                        if (phase1Fired || gen !== self._spinGeneration) return;
                        phase1Fired = true;
                        strip.removeEventListener('transitionend', onPhase1End);

                        // Remove buffer symbol before Phase 2
                        if (strip.children.length > totalSymbols) {
                            strip.removeChild(strip.lastChild);
                        }

                        // Play reel stop sound
                        if (SlotGame.Audio && SlotGame.Audio.reelStop) {
                            SlotGame.Audio.reelStop(r);
                        }

                        // Phase 2: bounce back animation
                        strip.style.transition = 'transform ' + BOUNCE_DURATION + 'ms cubic-bezier(0.34, 1.56, 0.64, 1)';
                        strip.style.transform = 'translateY(' + targetY + 'px)';

                        var phase2Fired = false;
                        var onPhase2End = function() {
                            if (phase2Fired || gen !== self._spinGeneration) return;
                            phase2Fired = true;
                            strip.removeEventListener('transitionend', onPhase2End);

                            self._reelStopped[r] = true;
                            reelsStopped++;

                            if (reelsStopped === SlotGame.Config.REELS) {
                                self.spinning = false;
                                SlotGame.State.grid = targetGrid;
                                if (onAllStopped) onAllStopped();
                            }
                        };
                        strip.addEventListener('transitionend', onPhase2End);

                        // Safety fallback for Phase 2
                        setTimeout(onPhase2End, BOUNCE_DURATION + 100);
                    };
                    strip.addEventListener('transitionend', onPhase1End);

                    // Safety fallback for Phase 1
                    setTimeout(onPhase1End, spinTime + 100);
                }, startDelay);
            })(reel);
        }

        // Play spin start sound
        if (SlotGame.Audio && SlotGame.Audio.spinStart) {
            SlotGame.Audio.spinStart();
        }
    },

    /**
     * Clear all reel animations and timers.
     */
    cleanup: function() {
        for (var i = 0; i < this.reelTimers.length; i++) {
            clearTimeout(this.reelTimers[i]);
        }
        this.reelTimers = [];
        this.spinning = false;
    },

    /**
     * Slam stop: quickly land each reel with a staggered bounce effect.
     * Reels that have already naturally stopped are left as-is.
     */
    slamStop: function() {
        if (!this.spinning) return;
        var targetGrid = this._targetGrid;
        var onAllStopped = this._onAllStopped;
        if (!targetGrid) return;

        var self = this;

        // Invalidate all stale spin callbacks (safety timeouts, transitionend)
        this._spinGeneration++;

        // Clear all pending stagger timers
        for (var i = 0; i < this.reelTimers.length; i++) {
            clearTimeout(this.reelTimers[i]);
        }
        this.reelTimers = [];

        this.spinning = false;
        this._targetGrid = null;
        this._onAllStopped = null;

        var reelCount = SlotGame.Config.REELS;
        var stagger = 60;       // ms between each reel landing
        var bounceDur = 250;    // ms for the bounce animation
        var sz = this.symbolSize;
        var symCount = SlotGame.Config.symbols.length;
        var bounceIndex = 0;    // sequential index for stagger among unstopped reels

        for (var reel = 0; reel < reelCount; reel++) {
            if (this._reelStopped[reel]) {
                // Already stopped naturally - just clean up to static state
                var strip = this.strips[reel];
                strip.innerHTML = '';
                strip.style.transition = 'none';
                strip.style.transform = 'translateY(0)';
                for (var row = 0; row < SlotGame.Config.ROWS; row++) {
                    strip.appendChild(this.createSymbolEl(targetGrid[reel][row]));
                }
            } else {
                // Still spinning - bounce animation with stagger
                (function(r, idx) {
                    setTimeout(function() {
                        var strip = self.strips[r];
                        strip.innerHTML = '';
                        strip.style.transition = 'none';

                        // Build: [extra_top] + [target rows] + [extra_bottom]
                        strip.appendChild(self.createSymbolEl(Math.floor(Math.random() * symCount)));
                        for (var row = 0; row < SlotGame.Config.ROWS; row++) {
                            strip.appendChild(self.createSymbolEl(targetGrid[r][row]));
                        }
                        strip.appendChild(self.createSymbolEl(Math.floor(Math.random() * symCount)));

                        // Start: slightly above final position (arriving from scroll)
                        strip.style.transform = 'translateY(' + (-sz * 1.3) + 'px)';
                        strip.offsetHeight; // force reflow

                        // Animate to final with bounce overshoot
                        strip.style.transition = 'transform ' + bounceDur + 'ms cubic-bezier(0.34, 1.56, 0.64, 1)';
                        strip.style.transform = 'translateY(' + (-sz) + 'px)';

                        // Play reel stop sound
                        if (SlotGame.Audio && SlotGame.Audio.reelStop) {
                            SlotGame.Audio.reelStop(r);
                        }
                    }, idx * stagger);
                })(reel, bounceIndex);
                bounceIndex++;
            }
        }

        // After all bounce animations complete, clean up and fire callback
        if (bounceIndex > 0) {
            var totalTime = (bounceIndex - 1) * stagger + bounceDur + 50;
            setTimeout(function() {
                // Remove extra symbols, reset transform for clean state
                for (var r = 0; r < reelCount; r++) {
                    var strip = self.strips[r];
                    strip.style.transition = 'none';
                    if (strip.children.length > SlotGame.Config.ROWS) {
                        strip.removeChild(strip.firstChild);
                    }
                    if (strip.children.length > SlotGame.Config.ROWS) {
                        strip.removeChild(strip.lastChild);
                    }
                    strip.style.transform = 'translateY(0)';
                }
                SlotGame.State.grid = targetGrid;
                if (onAllStopped) onAllStopped();
            }, totalTime);
        } else {
            // All reels already stopped naturally - finalize immediately
            this.renderStaticGrid(targetGrid);
            if (onAllStopped) onAllStopped();
        }
    },

    /**
     * Highlight specific symbol positions.
     * @param {Array<{reel: number, row: number}>} positions
     */
    highlightSymbols: function(positions) {
        var visible = this.getVisibleSymbols();
        // Dim all first
        for (var r = 0; r < SlotGame.Config.REELS; r++) {
            for (var row = 0; row < SlotGame.Config.ROWS; row++) {
                visible[r][row].classList.add('dimmed');
                visible[r][row].classList.remove('winning');
            }
        }
        // Highlight winners
        for (var p = 0; p < positions.length; p++) {
            var pos = positions[p];
            visible[pos.reel][pos.row].classList.remove('dimmed');
            visible[pos.reel][pos.row].classList.add('winning');
        }
    },

    /**
     * Clear all symbol highlights.
     */
    clearHighlights: function() {
        var visible = this.getVisibleSymbols();
        for (var r = 0; r < SlotGame.Config.REELS; r++) {
            for (var row = 0; row < SlotGame.Config.ROWS; row++) {
                visible[r][row].classList.remove('dimmed', 'winning', 'scatter-hit', 'highlight', 'highlight-scatter', 'highlight-crown');
            }
        }
    },

    /**
     * Clear only win-cycle highlights (dimmed/winning), preserving scatter/crown highlights.
     */
    clearWinHighlights: function() {
        var visible = this.getVisibleSymbols();
        for (var r = 0; r < SlotGame.Config.REELS; r++) {
            for (var row = 0; row < SlotGame.Config.ROWS; row++) {
                visible[r][row].classList.remove('dimmed', 'winning');
            }
        }
    },

    /**
     * Highlight Scatter symbols with cyan pulse frame effect.
     * @param {Array<{reel: number, row: number}>} positions - Scatter symbol positions
     */
    highlightScatters: function(positions) {
        var visible = this.getVisibleSymbols();
        for (var i = 0; i < positions.length; i++) {
            var pos = positions[i];
            if (pos.reel < SlotGame.Config.REELS && pos.row < SlotGame.Config.ROWS) {
                visible[pos.reel][pos.row].classList.add('highlight', 'highlight-scatter');
            }
        }
    },

    /**
     * Highlight Crown symbols with orange pulse frame effect (for Bonus trigger).
     * @param {Array<{reel: number, row: number}>} positions - Crown symbol positions
     */
    highlightCrowns: function(positions) {
        var visible = this.getVisibleSymbols();
        for (var i = 0; i < positions.length; i++) {
            var pos = positions[i];
            if (pos.reel < SlotGame.Config.REELS && pos.row < SlotGame.Config.ROWS) {
                visible[pos.reel][pos.row].classList.add('highlight', 'highlight-crown');
            }
        }
    },

};
