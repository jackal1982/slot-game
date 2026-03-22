# Slot Game 專案記憶

## 專案概述
遊戲平台 + 老虎機遊戲（純 HTML/CSS/JS，無框架），部署為靜態網頁。GitHub repo: `jackal1982/slot-game`

## 平台架構（PR #21 + PR #23）
- **SPA 架構**：單一 `index.html`，JS 透過 CSS class（`view-hidden`/`view-active`）切換大廳與遊戲視圖
- **Hash Routing**：`#lobby` 大廳、`#game/slot` Fortune Slots、`#game/dragon_wolf` 黑白龍狼傳
- **平台級餘額管理**：餘額存在 `platform_state` localStorage key，進出遊戲時同步
- **舊版遷移**：自動偵測並遷移 `slotGame_state` 到新 `platform_state` 格式
- **返回按鈕**：僅 IDLE 狀態可用，Spin/Free Spins/Bonus 中 disabled
- **遊戲目錄**：`lobby.js` 中 `_games` 陣列，目前收錄 2 款遊戲（Fortune Slots、黑白龍狼傳）
- **platform.js `_state.games`**：`{ slot: { betIndex: 0 }, dragon_wolf: { betIndex: 0 } }`，缺少 key 會導致 `startGame()` 回傳 false，PLAY NOW 無反應
- **Splash Screen 跳過機制**：`lobby.js` 的 `launchGame()` 在 user click 時預先建立/resume AudioContext 並設 `_launchedFromLobby = true`，`router.js` 的 `_showGame()` 檢查此 flag，若為 true 則隱藏 splash 直接進入遊戲，`audio.js` 的 `init()` reuse 已存在的 ctx 而非重新建立
- **遊戲卡片老虎機主題背景**：`lobby.css` 使用 `::before` pseudo-element 在 `.game-card-body` 上疊加 9 個散佈的水果符號（bell、cherry、grape、lemon），透過 CSS custom properties（`--symbol-bell-svg` 等）定義 SVG Data URI，opacity 0.22，底色淺藍 `#f0f7ff` + 藍色調漸層，RWD 三斷點對應縮小符號尺寸

## 遊戲規格
- **軸數/列數**：5 軸 3 列（15 格）
- **賠付線**：20 條（全部常駐啟動）
- **RTP 目標**：96%（實測 96.29%）
  - Base Game ~56.5% + Free Spins ~29.5% + Jackpot ~10.2%
- **匨配規則**：由左至右連續匹配，Wild 可替代任何非 Scatter 符號
- **隨機機制**：Reel Strip-based（每軸固定符號序列，隨機選取停止位置）

## Symbol 賠率表（PR #8 定版）
| Symbol  | Weight | 3連 | 4連 | 5連 |
|---------|--------|-----|-----|-----|
| Wild    | 2      | 40  | 100 | 300 |
| Scatter | 3      | -   | -   | -   |
| Crown   | 4      | 25  | 70  | 200 |
| Bell    | 6      | 15  | 50  | 125 |
| Seven   | 8      | 12  | 35  | 100 |
| Cherry  | 10     | 8   | 25  | 75  |
| Lemon   | 14     | 5   | 15  | 50  |
| Grape   | 14     | 3   | 8   | 40  |

- Scatter 不直接賠付，觸發 Free Spins（3顆=8次、4顆=12次、5顆=18次，3x 倍率）
- Crown 3連在賠付線上觸發 Bonus Game（12 個寶箱選 3 個）

## 關鍵功能
- **Jackpot**：種子 5000，每注 10% 貢獻，基礎觸發率 1/50000
- **Bonus Game**：3 個 Crown 連線觸發，12 寶箱選 3
- **Free Spins**：Scatter 觸發，3x 倍率，可重新觸發
- **Scatter/Crown 框選高亮**：
  - Scatter 3+ 顆觸發 Free Spins 時，所有 Scatter 顯示 cyan 脈衝光暈（`scatterFramePulse`）
  - Crown 3 連線觸發 Bonus 時，Crown 顯示 gold 脈衝光暈（`crownFramePulse`）
  - 高亮持續 2 秒後才顯示 Free Spins/Bonus overlay
  - `clearWinHighlights()` 只清 dimmed/winning，不影響 scatter/crown 高亮
  - `clearHighlights()` 清除所有高亮（含 scatter/crown），在 spin 開始時呼叫
  - `pendingScatterPositions` 儲存位置，`onWinsShown()` 中重新套用（防止 stopWinLines 清除）
- **BGM**：程序化生成背景音樂（4 層：pad/bass/arpeggio/rhythm）
  - Normal 模式：100 BPM，Cmaj7→Am7→Fmaj7→G7 和弦進行
  - Free Spins 模式：130 BPM，Dm→Bb→Gm→A（D minor 調性，八度跳躍 bass）
  - Measure-by-measure 排程，即時模式切換（重設 `_bgmNextBarTime`，0.15s crossfade）
  - MUSIC 按鈕獨立於 SOUND 開關
- **Splash Screen**：僅供直接 URL 進入時解鎖 AudioContext 用；從大廳進入時跳過（lobby click 已預先解鎖）

## 架構概覽
- **全域命名空間**：
  - `window.SlotGame`（Platform, Router, Lobby, Config, State, RNG, Audio, Paylines, Features, Jackpot, Reels, Animations, UI, Main）— Fortune Slots
  - `window.DragonWolf`（DWConfig, DWState, DWRNG, DWAudio, DWPayways, DWFeatures, DWReels, DWAnimations, DWUI, DWMain）— 黑白龍狼傳（完全獨立命名空間）
- **啟動流程**：`DOMContentLoaded → Platform.init() → Lobby.init() → Router.init()`
- **狀態機**：IDLE → SPINNING → EVALUATING → SHOWING_WINS → IDLE（+ FEATURE_PENDING）
- **持久化**：`platform_state` localStorage key（含 totalBalance、games、settings）

## 關鍵設計模式
- **Spin Generation Counter**（`_spinGeneration`）：防止 stale callback，每次 spin/slamStop 遞增
- **Two-Phase 彈跳動畫**：Phase 1 overshoot + Phase 2 bounce-back 180ms
- **Slam Stop**：快停機制，generation counter 使進行中回呼失效，分軸 stagger bounce
- **Symbol 限制**：Wild/Scatter/Crown 每列最多 1 個（generateGrid 中強制）
- **Highlight 分層清除**：`clearWinHighlights()` 只清 win cycle 用的 dimmed/winning，`clearHighlights()` 清全部含 scatter/crown

## GitHub 與部署
- **Repository**：`jackal1982/slot-game`
- **GitHub Pages**：https://jackal1982.github.io/slot-game/
- **GitHub 帳號**：`jackal1982`
- **gh CLI 路徑**：`/c/Program Files/GitHub CLI/gh.exe`（bash 環境中需用完整路徑）

## 檔案架構
```
index.html          # 主頁面（含大廳 + 兩款遊戲 view）
js/
  platform.js       # ⭐ 平台狀態管理：餘額 API、遊戲生命週期、localStorage 持久化
  router.js         # SPA hash routing（#lobby / #game/slot / #game/dragon_wolf）、view transition
  lobby.js          # 大廳 UI：遊戲卡片渲染、遊戲目錄、互動事件
  config.js         # ⭐ Fortune Slots 核心設定：符號定義、賠率、權重、Reel Strips、賠付線
  main.js           # Fortune Slots 初始化、主流程、cleanup()、returnToLobby()
  rng.js            # 隨機數生成、Strip-based grid 產生、內建 RTP 模擬器
  paylines.js       # 賠付線評估邏輯（Wild 替代、左至右匨配）
  features.js       # Free Spins 與 Bonus Game 邏輯
  reels.js          # 滾輪動畫控制
  animations.js     # 視覺特效
  audio.js          # 音效系統（bgmStop() 方法名稱，非 stopBGM()）
  jackpot.js        # Jackpot 累積與觸發
  state.js          # 遊戲狀態管理（含 syncFromPlatform/syncToPlatform）
  ui.js             # UI 互動、Paytable、返回按鈕狀態管理
  dragon_wolf/      # ⭐ 黑白龍狼傳專用目錄（window.DragonWolf 命名空間）
    dw-config.js    # 符號定義、賠率、Reel Strips（5×4）、1024-Ways
    dw-state.js     # 遊戲狀態管理
    dw-rng.js       # 隨機數生成（SC/WD 重試邏輯強化，1000次+全掃描 fallback）
    dw-audio.js     # 音效系統（Web Audio API，獨立）
    dw-payways.js   # 1024-Ways 賠付評估（不用固定線，用 adjacent-reel way）
    dw-features.js  # Free Spins 邏輯
    dw-reels.js     # 滾輪動畫（_lastStops 確保啟動連續性）
    dw-animations.js # 視覺特效
    dw-ui.js        # UI 互動、Paytable
    dw-main.js      # 遊戲初始化、主流程（onSpin 立即更新 State.grid）
css/
  main.css          # 主題色彩（淺藍 #E8F4FF + 亮藍 #0099FF）
  lobby.css         # 大廳樣式：view transition、遊戲卡片、RWD
  reels.css         # 滾輪區樣式（含白色雲朵氣泡背景）
  animations.css    # 動畫（藍色系光暈）
  responsive.css    # RWD
  ui.css            # UI 元件
  dragon_wolf.css   # 黑白龍狼傳專用樣式（5×4 grid、深色主題）
images/             # SVG 符號圖檔 + reel-bg-fortune.svg 背景 + slot-icon.svg
  dragon_wolf/      # 黑白龍狼傳 SVG：dragon, wolf, tiger, phoenix, koi, turtle, coin, sword, jade, scatter, wild（11 個）
rtp-verify.js       # Fortune Slots RTP 驗證腳本（Node.js，Monte Carlo 500 萬次）
```

### JS 載入順序
**Fortune Slots**：`config → platform → router → state → rng → audio → paylines → features → jackpot → reels → animations → ui → lobby → main`

**黑白龍狼傳**：`dw-config → dw-state → dw-rng → dw-audio → dw-payways → dw-features → dw-reels → dw-animations → dw-ui → dw-main`

## RTP 調整注意事項
- 修改賠率時**不要同時改 Reel Strips**，兩者交互影響很大
- 調整後務必跑 `node rtp-verify.js` 驗證（目標 95.5%~96.5%）
- Reel Strips 在 `config.js` 的 `REEL_STRIPS` 陣列，每軸長度不同（28~34）

## 開發慣例
- **分支命名**：`feature/xxx` 或 `fix/xxx`
- **PR 流程**：開 PR → Review → Merge to master
- **本地預覽**：`node` 啟動靜態 server（port 8080），設定在 `.claude/launch.json`
- **全域命名空間**：`window.SlotGame`（各模組掛在 SlotGame 下）

## 已修復的重要 Bug
1. **targetY 計算錯誤**：prepend current symbols 後 totalHeight 僅用 reelStrip.length → 轉軸提前 3 格停止
2. **手機方向錯覺**：原 easing 過於前傾，手機上尾段看起來像反向滾動 → 改為 two-phase 彈跳動畫
3. **Wild/Scatter/Crown 重複**：同一列可能出現多個特殊符號 → generateGrid 中加入每列最多 1 個限制
4. **Spin 起始不連續**：新一輪 spin 起始畫面與上一輪結果不同 → prepend currentColumn 到 strip 頂部
5. **BGM 音量過小（雙重衰減）**：個別音符音量 × master gain = 幾乎聽不到 → 調高 master gain
6. **BGM 模式切換延遲**：原本等當前小節結束才切換（最長 2.4s）→ 重設 `_bgmNextBarTime` 立即切換
7. **Free Spins BGM 太尖銳**：高八度振盪器刺耳 → 換 D minor 調性、避免高頻、用溫暖音色
8. **Scatter 框選高亮被 overlay 蓋住**：Free Spins intro 立即出現 → 延遲 2 秒，且 stopWinLines 改用 clearWinHighlights 保留 scatter 高亮
9. **Crown 框選高亮同理**：Bonus Game overlay 立即出現 → 延遲 2 秒顯示
10. **高亮延遲期間可輸入**：2 秒 Scatter/Crown 高亮延遲時點擊滾輪區會觸發下一把 → 新增 FEATURE_PENDING phase 阻擋輸入
11. **clearWinHighlights 被誤刪（致命）**：PR #14 移除瞇牌時連帶刪除 clearWinHighlights()，導致每次 spin 必 crash → 還原該方法
12. **從大廳進入遊戲顯示多餘 Splash Screen**：首次從 Lobby 點 PLAY NOW 進入遊戲時仍顯示 "TAP TO PLAY" Splash Screen → lobby.js 新增 `_launchedFromLobby` flag 並在 click 時預先解鎖 AudioContext，router.js 檢查 flag 跳過 splash，audio.js 改為 reuse 已存在的 AudioContext
13. **大廳 SOUND/MUSIC 按鈕無效（PR #24）**：main.js `cleanup()` 呼叫 `Audio.stopBGM()` 但實際方法名為 `Audio.bgmStop()`，從遊戲返回大廳時 BGM 殘留，導致大廳切換按鈕失效 → 修正方法名；lobby.js MUSIC OFF 時同步呼叫 `bgmStop()`
14. **黑白龍狼傳 PLAY NOW 無反應（PR #24）**：platform.js 預設 `_state.games` 缺少 `dragon_wolf` key，`Platform.startGame('dragon_wolf')` 回傳 false，launchGame 提前返回 → 在 `_state.games`、`_applyLoaded()`、`reset()` 三處加入 `dragon_wolf: { betIndex: 0 }`
15. **DW SC/WD 同軸重複**：dw-rng.js `generateGrid` SC/WD 重試邏輯不足 → 改為最多 1000 次重試 + fallback 全掃描，確保每軸最多 1 個特殊符號

## RWD 斷點
| 斷點 | 目標 | 符號尺寸 |
|------|------|---------|
| 桌機 | > 768px | 100px |
| 平板 | <= 768px | 80px |
| 手機 | <= 480px | `calc((100vw - 30px) / 5)` |
| 小手機 | <= 360px | 55px |

## PR 歷史摘要
- PR #2: 新增 20 條賠付線視覺指引到 Paytable
- PR #3: UI 修復、完整賠付線顯示、Strip-based RTP 調校
- PR #4: SPIN 按鈕置中（CSS Grid）
- PR #5: 修復首次旋轉音效延遲
- PR #6: Splash Screen 解鎖 AudioContext
- PR #7: 程序化 BGM 雙模式 + 修復 Bonus 遊戲遮罩（audio.js +344 行）
- PR #8: 重新設計符號賠率（整數化）+ 滾輪區祥雲金幣背景
- PR #9: 淺藍色調休閒風格改版（全面配色更換 + 雲朵氣泡背景 + CLAUDE.md）
- PR #10: Scatter/Crown 框選高亮（cyan 和 gold 脈衝光暈）+ 延遲 overlay 顯示
- PR #13: 移除 Scatter 瞇牌效果（Peek Reveal），保留框選高亮機制
- PR #15: 修復 2 秒高亮延遲期間可輸入的 Bug（新增 FEATURE_PENDING 狀態）
- PR #16: 修復 clearWinHighlights() 被 PR #14 誤刪導致遊戲完全崩潰的致命 Bug
- PR #21: 遊戲平台大廳（SPA routing、平台級餘額管理、返回大廳功能、舊版 state 遷移）
- Hotfix: 從大廳進入遊戲跳過 Splash Screen（lobby.js AudioContext 預解鎖 + router.js flag 檢查 + audio.js ctx reuse）
- Hotfix: 遊戲卡片老虎機主題背景（lobby.css：9 個散佈水果符號 SVG + 淺藍底色 + ::before 偽元素 + RWD 三斷點適配）
- PR #22: 更新 README.md 和 README.zh-TW.md（修正賠率表、Free Spins/Bonus/Jackpot 參數、新增平台架構/音效系統/架構圖、更新專案結構）
- PR #23: 新增第二款遊戲「黑白龍狼傳」（Dragon Wolf Legend）— 5×4、1024-Ways、RTP 96%，獨立 window.DragonWolf 命名空間，10 個 JS 模組 + CSS + 11 個 SVG 符號
- PR #24: 修復大廳音效控制 + 黑白龍狼傳進入遊戲（main.js stopBGM→bgmStop、lobby.js MUSIC OFF 同步停止、platform.js 補 dragon_wolf game state）

## 配色系統（PR #9 定版）
| 用途 | CSS 變數 | 色碼 |
|------|---------|------|
| 主背景 | `--bg-primary` | `#E8F4FF` |
| 次背景 | `--bg-secondary` | `#D0E8FF` |
| 三級背景 | `--bg-tertiary` | `#B8DCFF` |
| 主強調色 | `--accent-gold` | `#0099FF`（亮藍） |
| 副強調色 | `--accent-amber` | `#0077CC`（深藍） |
| 主文字 | `--text-primary` | `#0A1929`（深藍黑） |
| 次文字 | `--text-secondary` | `#1A4366` |
| 金色文字 | `--text-gold` | `#0099FF` |
| 滾輪背景 | `--reel-bg` | `#1A5B99` |
| 滾輪邊框 | `--reel-border` | `#0099FF` |
| 按鈕漸層 | `--btn-gradient` | `135deg, #0099FF → #0077CC` |
| 陰影 | `--shadow-gold` | `rgba(0, 153, 255, 0.3)` |
| Jackpot 色 | — | `#FF9F1C`（暖橙，JS hardcoded） |
| Free Spins 色 | — | `#00D4FF`（青藍） |

### 配色修改注意事項
- CSS 變數名保留 `--accent-gold`、`--shadow-gold` 等舊名，但值已改為藍色系
- Overlay 文字色用白色 `#ffffff`（深色滾輪背景上）
- STOP 按鈕保持紅色系（功能色，不跟主題走）
- Jackpot 寶箱色在 `js/ui.js` 中 hardcoded 為 `#FF9F1C`
- 滾輪背景 SVG 使用白色/淺色元素（`#ffffff`、`#66E6FF`），在深藍背景上才看得見
- 修改配色時搜尋殘留舊色碼：`grep -r "ffd700\|1a0a2e" css/ js/`

---

## 黑白龍狼傳（Dragon Wolf Legend）— PR #23

### 遊戲規格
- **軸數/列數**：5 軸 4 列（20 格）
- **賠付方式**：1024-Ways（不用固定線，計算相鄰軸上的符號數量組合）
- **RTP 目標**：96%
- **匹配規則**：由左至右連續匹配，Wild 可替代任何非 Scatter 符號
- **隨機機制**：Reel Strip-based，每軸固定序列，隨機選取停止位置

### Symbol 賠率表（黑白龍狼傳）
| Symbol  | 說明 | 1連 | 2連 | 3連 | 4連 | 5連 |
|---------|------|-----|-----|-----|-----|-----|
| Wild    | 萬用  | —   | —   | 30  | 80  | 200 |
| Scatter | 散落  | —   | —   | —   | —   | —   |
| Dragon  | 龍（最高）| — | — | 20 | 60 | 150 |
| Wolf    | 狼   | —   | —   | 15  | 40  | 100 |
| Tiger   | 虎   | —   | —   | 10  | 30  | 80  |
| Phoenix | 鳳凰  | —   | —   | 8   | 20  | 60  |
| Koi     | 錦鯉  | —   | —   | 5   | 12  | 40  |
| Turtle  | 龜   | —   | —   | 4   | 10  | 30  |
| Coin    | 銅錢  | —   | —   | 3   | 8   | 20  |
| Sword   | 劍   | —   | —   | 2   | 5   | 15  |
| Jade    | 玉   | —   | —   | 2   | 5   | 15  |

- Scatter 觸發 Free Spins（3顆=10次、4顆=15次、5顆=20次，2x 倍率，可重觸發）
- 1024-Ways 賠付：每軸各有幾個相符符號就乘幾（如軸1×2×1×3×2=12 種 way）

### 命名空間與模組
- **全域物件**：`window.DragonWolf`（完全獨立，不與 SlotGame 交叉）
- **模組前綴**：所有模組使用 `DW` 前綴（DWConfig、DWState、DWRNG 等）

### 關鍵實作細節
- **dw-rng.js `generateGrid`**：SC/WD 每軸最多出現 1 個，透過最多 1000 次重試 + fallback 全掃描安全位置確保
- **dw-reels.js**：動畫 extra 符號使用 `_lastStops` 確保每次 spin 啟動畫面與上次結果一致
- **dw-main.js `onSpin`**：立即更新 `State.grid`，防止 M1 特色（Free Spins 等）污染 grid 狀態
- **dw-payways.js**：1024-Ways 計算方式：統計每軸相符符號數，乘積即為 way 數，再乘賠率

### RTP 驗證
- 驗證腳本：`rtp_verify_dragon_wolf_final.js`（Node.js，獨立執行）
- 指令：`node rtp_verify_dragon_wolf_final.js`
- 目標：95.5%~96.5%
