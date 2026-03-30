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
    dw-audio.js     # 音效系統（Web Audio API，獨立）；BGM 使用 MP3 音檔（audio/dragon_wolf/）
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
tools/
  rtp-verify-fortune-slots.js  # Fortune Slots RTP 驗證腳本（Node.js，Monte Carlo 500 萬次）
  rtp-verify-dragon-wolf.js    # 黑白龍狼傳 RTP 驗證腳本（Node.js，Monte Carlo 1000 萬次）
```

### JS 載入順序
**Fortune Slots**：`config → platform → router → state → rng → audio → paylines → features → jackpot → reels → animations → ui → lobby → main`

**黑白龍狼傳**：`dw-config → dw-state → dw-rng → dw-audio → dw-payways → dw-features → dw-reels → dw-animations → dw-ui → dw-main`

## RTP 調整注意事項
- 修改賠率時**不要同時改 Reel Strips**，兩者交互影響很大
- 調整後務必跑 `node tools/rtp-verify-fortune-slots.js` 驗證（目標 95.5%~96.5%）
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
16. **滾輪區 click 不驅動遊戲**：dw-ui.js 缺少 reelArea click handler → 新增點擊滾輪區觸發 spin/slamStop 邏輯
17. **SPIN 按鈕未置中**：CSS 缺少 flex:1 → 修正使按鈕置中對齊
18. **Paytable 顯示 xways**：移除佔位文字，改為顯示實際贏分金額
19. **缺少 STOP/SKIP 按鈕**：SPINNING 狀態時顯示 STOP（快停），SHOWING_WINS 時顯示 SKIP（跳過展示）
20. **滾輪停止頓感生硬**：改用 transitionend 事件 + double-rAF 確保動畫流暢
21. **Free Spins 未自動開始**：Free Spins 觸發後需手動點擊 → 加入 500ms 延遲自動觸發
22. **轉場動畫不符腳本**：修正 keyframes 實現黑龍白狼融合序列
23. **連點滾輪區抖動**：快速連點導致動畫異常 → 加入 500ms cooldown + SPINNING 狀態鎖定
24. **滾輪往上滾（方向錯誤）**：translateY 方向計算錯誤 → 修正為向下滾動
25. **Bet 倍數跳動不連續**：BET_MULTIPLIERS 含非連續值 → 改為 [1,2,3,4,5,6,7,8,9,10] 連續整數
26. **Slam Stop 已停止滾輪回彈**：slam stop 時已停止的滾輪仍觸發 bounce 動畫 → 加入 `_reelStopped[]` 陣列檢查，已停止者跳過 bounce
27. **黑白龍狼傳 RTP 超過 100%（PR #42）**：原 BASE_PAY/FREE_PAY 與舊驗證腳本使用不同數值（差距 3~12×），實際 RTP 達 105.23% → 重新設計全套賠率，以 1000 萬局 Monte Carlo 驗證，實測 96.04%
28. **Free Game M1 爆分（PR #42）**：Free Reel1 M1 密度 19.1% × randomWilds 高端機率（8%/2% 可加 9~16 WD）× 1024-Ways 乘數，偶發 675× bet 極端大爆炸 → 壓縮高端機率至 3%/1%、降低 Free Reel2~5 的 WD/M1 數量、新增 generateGrid M1≤2/視窗限制
29. **A 符號同視窗堆疊（PR #42）**：A4 密度最高達 37%，同視窗可出現 3~4 個，造成 Ways 意外堆疊 → generateGrid 新增所有模式 A 符號≤2/視窗限制
30. **Fortune Slots Symbol 桌面版不置中（PR #44）**：`#reel-area` 的 `overflow: hidden` 與 `justify-content: center` 在部分瀏覽器有潛在衝突，reel grid 在寬容器中靠左 → 移除 `overflow: hidden`，`#reel-grid` 加 `margin: auto` 保底置中（驗證：left = right = 111px）
31. **黑白龍狼傳 Symbol 靠左不置中（PR #44）**：`.dw-reel-strip` 為 block 容器，`.dw-symbol` 固定寬度（90/72px）小於 grid `1fr` 計算出的 viewport 寬（約 109px），預設靠左對齊 → `.dw-reel-strip` 加入 `display: flex; flex-direction: column; align-items: center`（驗證：left = right = 18px）
32. **黑白龍狼傳 BGM 換為 MP3 音檔（PR #51）**：原程序化 BGM（Web Audio API 合成）換成 AI 生成的中國武俠風 MP3 音檔，Normal 穩重、Free Spins 激昂，0.15s crossfade 切換，無縫循環（loop=true）
33. **黑白龍狼傳 Free Game BGM 過早切換（PR #52）**：`_endFreeSpins()` 中 `bgmSetMode('base')` 在 `playFSSummary()` 之前呼叫，導致贏分 popup 顯示期間已切換為 Base BGM → 移至 `playFSSummary` 的 onComplete callback 第一行，確保玩家按「收取」後才切換
34. **手機版進入遊戲未捲回頂部（PR #52）**：SPA view 切換只改 CSS class，不觸發瀏覽器原生捲動重置，導致從大廳往下捲後進遊戲頂部 UI 不可見 → `router.js` 的 `_showGame()` 與 `_showLobby()` 均加入 `window.scrollTo(0, 0)`

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
- PR #25: 修復黑白龍狼傳 UI/UX 問題（滾輪區 click 驅動遊戲、SPIN 按鈕置中、TOTAL BET 顯示、Paytable 移除 xways 改為實際贏分、SPINNING 時顯示 STOP + SHOWING_WINS 時顯示 SKIP、滾輪停止動畫改 transitionend + double-rAF、Free Spins 500ms 延遲自動開始、轉場動畫修正黑龍白狼融合序列、文字與賠率修正）+ 更新角色 SVG
- PR #26: 修復遊戲體驗問題（連點滾輪區 500ms cooldown + SPINNING 鎖定防抖動、滾輪 translateY 方向修正改為向下滾、BET_MULTIPLIERS 改為連續 [1,2,3,4,5,6,7,8,9,10]、新增 AUTO 自動連續 Spin 功能、M1 出現率提升 + FREE_PAY 降低）
- PR #27: Free Game 觸發率提高至 ~1/57（Base Game SC 增加至軸1=7、軸2=8、軸3=8 + FREE_PAY 降低，RTP 96.09%）+ Slam Stop 修復（_reelStopped[] 檢查，已停止滾輪不再回彈）
- PR #42: 黑白龍狼傳 RTP 重新校準至 96%（Base 60% + Free 36%）+ Free Reel 優化 + generateGrid 視窗限制 + 新版符號圖片
- PR #44: 修復兩款遊戲 Symbol 水平置中問題（Fortune Slots：移除 `#reel-area` overflow:hidden + `#reel-grid` 加 margin:auto；黑白龍狼傳：`.dw-reel-strip` 加 flex column + align-items:center 解決 symbol 寬度小於 viewport 1fr 寬度導致靠左的問題）
- PR #51: 黑白龍狼傳 BGM 換為 AI 生成 MP3（`audio/dragon_wolf/dw-bgm-normal.mp3` + `dw-bgm-free.mp3`），移除程序化合成引擎，改用 XHR 預載 + BufferSource loop + 0.15s crossfade 切換
- PR #52: 修復黑白龍狼傳 Free Game BGM 過早切換（bgmSetMode 移至 playFSSummary onComplete callback）+ 手機版進入遊戲未捲回頂部（router.js _showGame/_showLobby 加入 window.scrollTo(0,0)）

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
- **RTP 目標**：96%（實測 96.04%，Base ~60.3% + Free ~35.7%）
- **匹配規則**：由左至右連續匹配，Wild 可替代任何非 Scatter 符號
- **隨機機制**：Reel Strip-based，每軸固定序列，隨機選取停止位置
- **BET_MULTIPLIERS**：[1, 2, 3, 4, 5, 6, 7, 8, 9, 10] 連續整數
- **AUTO 功能**：自動連續 Spin，餘額不足自動取消

### Symbol 賠率表（黑白龍狼傳 — PR #42 定版）

**Base Game（per-way 倍率 × bet）**
| Symbol | 說明 | 3連 | 4連 | 5連 |
|--------|------|-----|-----|-----|
| M2 | 黑龍 | 0.16 | 0.32 | 0.70 |
| M3 | 白狼 | 0.10 | 0.29 | 0.60 |
| M4 | 憶無心 | 0.10 | 0.13 | 0.35 |
| A1 | A | 0.06 | 0.06 | 0.16 |
| A2 | K | 0.06 | 0.06 | 0.13 |
| A3 | Q | 0.06 | 0.06 | 0.13 |
| A4 | J | 0.05 | 0.05 | 0.10 |

**Free Game（per-way 倍率 × bet）**
| Symbol | 說明 | 3連 | 4連 | 5連 |
|--------|------|-----|-----|-----|
| M1 | 黑白郎君 | 0.07 | 0.20 | 0.35 |
| M4 | 憶無心 | 0.03 | 0.07 | 0.13 |
| A1 | A | 0.01 | 0.03 | 0.07 |
| A2 | K | 0.01 | 0.03 | 0.04 |
| A3 | Q | 0.01 | 0.03 | 0.04 |
| A4 | J | 0.01 | 0.01 | 0.03 |

- Scatter 觸發 Free Spins（固定 10 次，可重觸發 +10 次，上限 50 次）；觸發率 ~2.56%（約 1/39），Base Game SC 數量：軸1=7、軸2=8、軸3=8
- 1024-Ways 賠付：每軸各有幾個相符符號就乘幾（如軸1×2×1×3×2=12 種 way）

### 命名空間與模組
- **全域物件**：`window.DragonWolf`（完全獨立，不與 SlotGame 交叉）
- **模組前綴**：所有模組使用 `DW` 前綴（DWConfig、DWState、DWRNG 等）

### 關鍵實作細節
- **dw-rng.js `generateGrid`**：SC/WD 每軸最多 1 個；Free Game M1 同視窗最多 2 個；所有模式任一 A 符號同視窗最多 2 個（PR #42 新增）；均透過最多 1000 次重試 + fallback 全掃描確保
- **dw-reels.js**：動畫 extra 符號使用 `_lastStops` 確保每次 spin 啟動畫面與上次結果一致；`_reelStopped[]` 陣列防止已停止軸再次回彈
- **dw-main.js `onSpin`**：立即更新 `State.grid`，防止 M1 特色（Free Spins 等）污染 grid 狀態
- **dw-payways.js**：1024-Ways 計算方式：統計每軸相符符號數，乘積即為 way 數，再乘賠率
- **Free Spins M1 數量（最新）**：軸1=21、軸2=9、軸3=9、軸4=6、軸5=6
- **Free Game WD 數量（最新）**：軸2=4、軸3=5、軸4=5、軸5=6（PR #42 調降）
- **randomWilds 機率（最新）**：2~4個 60%、5~8個 36%、9~12個 3%、13~16個 1%（PR #42 調整）

### RTP 驗證
- 驗證腳本：`tools/rtp-verify-dragon-wolf.js`（Node.js，獨立執行）
- 指令：`node tools/rtp-verify-dragon-wolf.js`
- 目標：95.5%~96.5%（Base 60% + Free 36%）
- 實測（PR #42，1000 萬局）：Total **96.04%**（Base **60.31%** + Free **35.74%**）
- 注意：舊版 `rtp_verify_dragon_wolf_final.js` 使用過時賠率，結果不可信
