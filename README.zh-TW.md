# 老虎機遊戲平台

繁體中文 | [English](README.md)

多款老虎機遊戲平台，包含遊戲大廳，使用純 HTML5 + CSS3 + 原生 JavaScript 打造。無框架、無相依套件、無需建置步驟。

## 立即遊玩

**https://jackal1982.github.io/slot-game/**

---

## 遊戲清單

### 🎰 Fortune Slots

經典 5 軸 20 線視頻老虎機，具備免費旋轉、獎勵遊戲與累進彩池。

- **5 軸 × 3 列** | 20 條固定賠付線 | 目標 RTP：96%
- 路由：`#game/slot`

| 符號 | 名稱 | x3 | x4 | x5 | 特殊效果 |
|------|------|----|----|-----|---------|
| Wild | 百搭 | 40 | 100 | 300 | 替代所有符號（Scatter 除外） |
| Scatter | 鑽石 | - | - | - | 3/4/5 個 = 8/12/18 次免費旋轉（3 倍） |
| Crown | 皇冠 | 25 | 70 | 200 | 賠付線上 3 個 = 觸發獎勵遊戲（選寶箱） |
| Bell | 鈴鐺 | 15 | 50 | 125 | - |
| Seven | 幸運7 | 12 | 35 | 100 | - |
| Cherry | 櫻桃 | 8 | 25 | 75 | - |
| Lemon | 檸檬 | 5 | 15 | 50 | - |
| Grape | 葡萄 | 3 | 8 | 40 | - |

> 賠率值 × 每線投注額 = 實際獎金。

**特殊功能**：免費旋轉（3 倍獎金，可重觸發）・獎勵選寶箱・累進彩池（種子 5,000，基礎觸發率 1/50,000）

---

### 🐉 黑白龍狼傳（Legend of Dragon & Wolf）

金光布袋戲主題 1024-Ways 視頻老虎機。自由旋轉中 M1（黑白郎君）連線可觸發隨機百搭氣功特色。

- **5 軸 × 4 列** | 1024 Ways | 目標 RTP：96%
- 路由：`#game/dragon_wolf`

**Base Game 賠率表**（per-way 倍率 × 下注額）：

| 符號 | 說明 | x3 | x4 | x5 |
|------|------|-----|-----|-----|
| M2 | 黑龍 | 0.16 | 0.32 | 0.70 |
| M3 | 白狼 | 0.10 | 0.29 | 0.60 |
| M4 | 憶無心 | 0.10 | 0.13 | 0.35 |
| A1 | A | 0.06 | 0.06 | 0.16 |
| A2 | K | 0.06 | 0.06 | 0.13 |
| A3 | Q | 0.06 | 0.06 | 0.13 |
| A4 | J | 0.05 | 0.05 | 0.10 |

**Free Game 賠率表**（per-way 倍率 × 下注額）：

| 符號 | 說明 | x3 | x4 | x5 |
|------|------|-----|-----|-----|
| M1 | 黑白郎君 | 0.07 | 0.20 | 0.35 |
| M4 | 憶無心 | 0.03 | 0.07 | 0.13 |
| A1 | A | 0.01 | 0.03 | 0.07 |
| A2 | K | 0.01 | 0.03 | 0.04 |
| A3 | Q | 0.01 | 0.03 | 0.04 |
| A4 | J | 0.01 | 0.01 | 0.03 |

**特殊功能**：自由旋轉（10 局，可重觸發上限 50 局）・隨機百搭氣功（M1 連線觸發，在軸2~5隨機放置 2~16 個 Wild）・MP3 BGM 搭配三段式聚氣音效

---

## 平台功能

- **SPA 架構** — 單一 `index.html`，Hash Routing 切換視圖（`#lobby` / `#game/slot` / `#game/dragon_wolf`）
- **遊戲大廳** — 卡片式遊戲選擇介面，含主題背景
- **平台級餘額管理** — 跨遊戲共享餘額，透過 `localStorage` 持久化
- **無縫切換** — CSS class 控制大廳與遊戲視圖的顯示切換
- **Splash Screen** — 直接 URL 進入時解鎖 AudioContext；從大廳進入時自動跳過
- **舊版遷移** — 自動偵測並遷移舊版 `slotGame_state` 到新 `platform_state` 格式

---

## 技術亮點

- **零相依** — 純 HTML5 + CSS3 + 原生 JS，無需任何框架或套件
- **SVG 向量圖形** — 符號在任何解析度下都清晰銳利
- **Reel Strip RNG** — 基於符號帶的隨機生成，確保 RTP 精準可控
- **Two-Phase 彈跳動畫** — Phase 1 過衝 + Phase 2 回彈，自然的轉輪停止效果
- **Spin Generation Counter** — 防止急停時過期回呼觸發
- **Web Audio API** — 程序化 BGM（Fortune Slots）＋ MP3 buffer 預載播放（黑白龍狼傳）
- **localStorage 持久化** — 平台狀態（餘額、設定、各遊戲資料）跨瀏覽器會話保留
- **響應式設計（RWD）** — 桌機（>768px）、平板（≤768px）、手機（≤480px）、小手機（≤360px）
- **iOS 相容性** — 所有 overlay 加 `touch-action: manipulation` 防止雙擊縮放；`orientationchange` reflow handler 修復 iOS viewport 殘留問題

---

## 專案結構

```
slot-game/
├── index.html                  # 單頁 HTML（大廳 + 所有遊戲 view）
├── css/
│   ├── main.css                # 根變數、版面、overlay
│   ├── lobby.css               # 大廳樣式、遊戲卡片、view transition
│   ├── reels.css               # 轉盤網格、符號、雲朵氣泡背景
│   ├── dragon_wolf.css         # 黑白龍狼傳專用樣式（5×4 grid、深色主題）
│   ├── ui.css                  # 控制面板、按鈕、賠率表、HUD
│   ├── animations.css          # 關鍵影格、粒子、過渡動畫
│   └── responsive.css          # 各斷點的媒體查詢
├── js/
│   ├── platform.js             # ⭐ 平台狀態管理：餘額 API、遊戲生命週期、持久化
│   ├── router.js               # SPA Hash Routing、view 切換
│   ├── lobby.js                # 大廳 UI：遊戲卡片渲染、遊戲目錄、互動事件
│   ├── config.js               # Fortune Slots：符號定義、賠率、Reel Strips、賠付線
│   ├── state.js                # Fortune Slots：遊戲狀態 + 平台同步
│   ├── rng.js                  # Fortune Slots：Strip-based 隨機生成 + RTP 模擬器
│   ├── audio.js                # Fortune Slots：程序化 Web Audio BGM + 音效
│   ├── paylines.js             # Fortune Slots：中獎判定引擎
│   ├── features.js             # Fortune Slots：免費旋轉 + 獎勵遊戲邏輯
│   ├── jackpot.js              # Fortune Slots：累進彩池管理
│   ├── reels.js                # Fortune Slots：轉盤渲染 + 旋轉動畫
│   ├── animations.js           # Fortune Slots：中獎線、粒子、高亮效果
│   ├── ui.js                   # Fortune Slots：DOM 事件、賠率表、返回按鈕
│   ├── main.js                 # Fortune Slots：啟動、遊戲迴圈、cleanup()
│   └── dragon_wolf/            # ⭐ 黑白龍狼傳（window.DragonWolf 命名空間）
│       ├── dw-config.js        # 符號定義、賠率、Reel Strips（5×4）、1024-Ways 設定
│       ├── dw-state.js         # 遊戲狀態管理
│       ├── dw-rng.js           # Strip-based RNG（SC/WD 重試邏輯）
│       ├── dw-audio.js         # Web Audio API：MP3 BGM + 音效（聚氣三段式）
│       ├── dw-payways.js       # 1024-Ways 賠付評估
│       ├── dw-features.js      # 自由旋轉 + 隨機百搭邏輯
│       ├── dw-reels.js         # 轉盤渲染 + 旋轉動畫
│       ├── dw-animations.js    # 視覺特效、FS 轉場動畫、氣功動畫
│       ├── dw-ui.js            # DOM 事件、賠率表
│       └── dw-main.js          # 啟動、遊戲迴圈
├── images/
│   ├── （Fortune Slots SVG）   # wild, scatter, crown, bell, seven, cherry, lemon, grape
│   ├── reel-bg-fortune.svg     # Fortune Slots 轉盤區背景
│   ├── slot-icon.svg           # Fortune Slots 大廳卡片圖示
│   └── dragon_wolf/            # 黑白龍狼傳 SVG 符號（11 個）
│       └── dragon, wolf, tiger, phoenix, koi, turtle, coin, sword, jade, scatter, wild
├── audio/
│   └── dragon_wolf/            # 黑白龍狼傳 MP3 音效
│       ├── dw-bgm-normal.mp3   # Base Game BGM
│       ├── dw-bgm-free.mp3     # Free Game BGM
│       ├── dw-laugh.mp3        # 黑白郎君狂笑聲
│       ├── free-bigwin.mp3     # 大贏彩金音效
│       ├── qigong-1.mp3        # 聚氣音效 Tier 1（2~4 wilds，2 秒）
│       ├── qigong-2.mp3        # 聚氣音效 Tier 2（5~8 wilds，4 秒）
│       └── qigong-3.mp3        # 聚氣音效 Tier 3（9+ wilds，7 秒）
└── tools/
    ├── rtp-verify-fortune-slots.js  # Node.js 蒙地卡羅 RTP 驗證（Fortune Slots，500 萬次）
    └── rtp-verify-dragon-wolf.js    # Node.js 蒙地卡羅 RTP 驗證（黑白龍狼傳，1000 萬次）
```

### JS 載入順序

**Fortune Slots**：
```
config → platform → router → state → rng → audio → paylines → features → jackpot → reels → animations → ui → lobby → main
```

**黑白龍狼傳**：
```
dw-config → dw-state → dw-rng → dw-audio → dw-payways → dw-features → dw-reels → dw-animations → dw-ui → dw-main
```

---

## RTP 驗證

```bash
# Fortune Slots（500 萬次模擬）
node tools/rtp-verify-fortune-slots.js

# 黑白龍狼傳（1000 萬次模擬）
node tools/rtp-verify-dragon-wolf.js
```

兩款遊戲目標 RTP 均為 96%。

---

## 本地執行

無需建置步驟，使用任何 HTTP 伺服器即可：

```bash
# Python
python -m http.server 8080

# Node.js
npx serve .
```

---

## 架構概覽

```
┌─────────────────────────────────────────────────┐
│                  平台層 Platform                 │
│  platform.js（餘額 API、遊戲生命週期）              │
│  router.js（Hash Routing、view 切換）             │
│  lobby.js（遊戲目錄、卡片 UI）                    │
├──────────────────────┬──────────────────────────┤
│   Fortune Slots      │   黑白龍狼傳              │
│   window.SlotGame    │   window.DragonWolf       │
│   5×3，20 條賠付線   │   5×4，1024 Ways          │
│   config/state/rng…  │   dw-config/state/rng…    │
└──────────────────────┴──────────────────────────┘
持久化：platform_state localStorage key
狀態機：IDLE → SPINNING → EVALUATING → SHOWING_WINS → IDLE
       （+ FEATURE_PENDING 用於高亮延遲阻擋輸入）
```

---

## 瀏覽器支援

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
- 行動瀏覽器（iOS Safari、Chrome for Android）

## 授權聲明

本專案僅供教育及娛樂用途，非真錢博弈遊戲。
