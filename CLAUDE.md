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
- **Splash Screen 跳過**：從大廳進入時跳過（lobby.js 預解鎖 AudioContext + `_launchedFromLobby` flag）；直接 URL 進入才顯示

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
- **Scatter/Crown 框選高亮**：Scatter cyan / Crown gold 脈衝光暈，高亮 2 秒後才顯示 overlay
  - `clearWinHighlights()` 只清 win cycle 用的 dimmed/winning；`clearHighlights()` 清全部（含 scatter/crown）
- **BGM**：程序化 4 層合成（pad/bass/arpeggio/rhythm），Normal + Free Spins 雙模式，0.15s crossfade 即時切換
  - MUSIC 按鈕獨立於 SOUND 開關

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
- 調整後務必跑 `node tools/rtp-verify-fortune-slots.js` 驗證（目標 95.5%~96.5%）
- Reel Strips 在 `config.js` 的 `REEL_STRIPS` 陣列，每軸長度不同（28~34）

## 開發慣例
- **分支命名**：`feature/xxx` 或 `fix/xxx`
- **PR 流程**：開 PR → Review → Merge to master
- **本地預覽**：`node` 啟動靜態 server（port 8080），設定在 `.claude/launch.json`
- **全域命名空間**：`window.SlotGame`（各模組掛在 SlotGame 下）

## 開發注意事項（防踩坑）
> 完整 Bug 修復記錄見 [CHANGELOG.md](CHANGELOG.md)

- **刪函式前先 grep**：曾因移除功能連帶刪除被其他流程依賴的函式（clearWinHighlights），導致全站 crash
- **特殊符號每列最多 1 個**：Wild/Scatter/Crown（兩款遊戲皆適用），在 `generateGrid` 中強制限制
- **Spin 起始需連續**：prepend currentColumn 到 strip 頂部，確保新 spin 畫面銜接上次結果
- **FEATURE_PENDING 狀態**：Scatter/Crown 高亮 2 秒延遲期間須阻擋輸入，否則玩家可提前觸發下一把
- **platform.js `_state.games`**：新增遊戲時必須在 `_state.games`、`_applyLoaded()`、`reset()` 三處加入對應 key，否則 PLAY NOW 無反應
- **Audio 方法名**：Fortune Slots 的 BGM 停止是 `Audio.bgmStop()`（非 `stopBGM()`）
- **scrollTo 對 hidden 元素無效**：SPA view 切換時，`window.scrollTo(0,0)` 必須在 `classList.add('view-active')` 之後執行
- **100vh vs 100dvh**：手機上 `100vh` 包含瀏覽器地址列高度（多 ~200px），用 `100dvh` 替代
- **非同步載入的 BGM**：XHR 預載 buffer 可能晚於 `bgmStart()` 呼叫，需 `_onBgmLoaded()` 回調補播
- **RTP 調校**：修改賠率時不要同時改 Reel Strips（交互影響大）；DW 曾因 BASE_PAY/FREE_PAY 數值不一致導致 RTP 超 100%
- **DW generateGrid 視窗限制**：Free Game M1 同視窗≤2、所有模式 A 符號同視窗≤2（防 Ways 堆疊爆分）

## RWD 斷點
| 斷點 | 目標 | 符號尺寸 |
|------|------|---------|
| 桌機 | > 768px | 100px |
| 平板 | <= 768px | 80px |
| 手機 | <= 480px | `calc((100vw - 30px) / 5)` |
| 小手機 | <= 360px | 55px |

## PR 歷史
> 完整 PR 歷史與 Bug 修復記錄見 [CHANGELOG.md](CHANGELOG.md)
>
> 最新：PR #58（Fortune Slots Win Cycle 重構為 event-driven）

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
