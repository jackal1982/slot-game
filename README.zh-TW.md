# Fortune Slots - 幸運老虎機

繁體中文 | [English](README.md)

一款功能完整的老虎機遊戲平台，包含遊戲大廳與 5 軸視頻老虎機，使用純 HTML5 + CSS3 + 原生 JavaScript 打造。無框架、無相依套件、無需建置步驟。

## 立即遊玩

**https://jackal1982.github.io/slot-game/**

## 功能介紹

### 遊戲平台
- **SPA 架構** — 單一 `index.html`，Hash Routing 切換視圖（`#lobby` / `#game/slot`）
- **遊戲大廳** — 卡片式遊戲選擇介面，含老虎機主題背景
- **平台級餘額管理** — 跨遊戲共享餘額，透過 `localStorage` 持久化
- **無縫切換** — CSS class 控制大廳與遊戲視圖的顯示切換
- **舊版遷移** — 自動偵測並遷移舊版 `slotGame_state` 到新 `platform_state` 格式

### 核心玩法
- **5 軸 x 3 列**，20 條固定賠付線（全部常駐啟動）
- **8 種 SVG 符號**，採用 Reel Strip 隨機生成
- **Wild 百搭符號** — 可替代所有符號（Scatter 除外）
- **由左至右**賠付線判定（連續 3 個以上相同符號即中獎）
- **可調注額** — 多段投注等級
- **目標 RTP：96%**（基礎遊戲 ~56.5% + 免費旋轉 ~29.5% + 彩池 ~10.2%）

### 特殊功能
- **免費旋轉（Free Spins）** — 3 顆以上 Scatter 觸發（3 顆=8 次、4 顆=12 次、5 顆=18 次），所有獎金 3 倍。期間可重新觸發
- **獎勵遊戲（Bonus Game）** — 賠付線上 3 個 Crown 觸發，12 個寶箱選 3 個
- **累進彩池（Progressive Jackpot）** — 種子金額 5,000，每注 10% 注入彩池。基礎觸發率：1/50,000
- **Scatter/Crown 框選高亮** — Scatter 觸發時顯示 cyan 脈衝光暈，Crown 觸發時顯示 gold 脈衝光暈，高亮 2 秒後才顯示功能 overlay

### 音效系統
- **程序化 BGM** — 4 層音樂（pad / bass / arpeggio / rhythm），無需音檔
  - 一般模式：100 BPM，Cmaj7→Am7→Fmaj7→G7
  - Free Spins 模式：130 BPM，Dm→Bb→Gm→A（D 小調）
  - 即時模式切換，0.15 秒 crossfade
- **獨立控制** — MUSIC 與 SOUND 開關分離
- **Web Audio API** — 所有音效由程式碼動態生成
- **Splash Screen** — 直接 URL 進入時解鎖 AudioContext 用；從大廳進入時自動跳過

### 操作方式
- **SPIN / STOP / SKIP** — 按鈕根據遊戲階段自動切換功能
- **急停（Slam Stop）** — 轉動中按下 STOP 可立即停止，分軸 stagger 彈跳動畫
- **Turbo 模式** — 2.5 倍速旋轉動畫
- **自動旋轉（Auto Spin）** — 連續自動轉 100 次
- **鍵盤操作** — 按空白鍵等同點擊 SPIN / STOP / SKIP
- **點擊轉盤區** — 點擊轉盤區域任意位置也可觸發操作
- **返回大廳** — 僅 IDLE 狀態可用（Spin / Free Spins / Bonus 中停用）

### 技術亮點
- **零相依** — 純 HTML5 + CSS3 + 原生 JS，無需任何框架或套件
- **SVG 向量圖形** — 符號在任何解析度下都清晰銳利
- **CSS Transition 動畫** — 透過 `transform: translateY()` 實現 GPU 加速的轉輪捲動
- **Two-Phase 彈跳動畫** — Phase 1 過衝 + Phase 2 回彈，自然的轉輪停止效果
- **Spin Generation Counter** — 防止急停時過期回呼觸發
- **Canvas 疊加層** — 中獎線帶發光效果的動態繪製
- **localStorage 持久化** — 平台狀態（餘額、設定、遊戲資料）跨瀏覽器會話保留
- **響應式設計（RWD）** — 桌機（>768px）、平板（≤768px）、手機（≤480px）、小手機（≤360px）
- **淺藍色休閒風格** — 主背景 `#E8F4FF`、主強調色 `#0099FF`

## 符號與賠率表

| 符號 | 名稱 | x3 | x4 | x5 | 特殊效果 |
|------|------|----|----|-----|---------|
| Wild | 百搭 | 40 | 100 | 300 | 替代所有符號（Scatter 除外） |
| Scatter | 鑽石 | - | - | - | 3/4/5 個 = 8/12/18 次免費旋轉（3 倍） |
| Crown | 皇冠 | 25 | 70 | 200 | 賠付線上 3 個 = 觸發獎勵遊戲 |
| Bell | 鈴鐺 | 15 | 50 | 125 | - |
| Seven | 幸運7 | 12 | 35 | 100 | - |
| Cherry | 櫻桃 | 8 | 25 | 75 | - |
| Lemon | 檸檬 | 5 | 15 | 50 | - |
| Grape | 葡萄 | 3 | 8 | 40 | - |

> 賠率值乘以每線投注金額即為實際獎金。

## 專案結構

```
slot-game/
├── index.html              # 單頁 HTML（大廳 + 遊戲兩個 view）
├── GAME_SPEC_TEMPLATE.md   # 新遊戲規格模板 v2.0
├── tools/
│   ├── rtp-verify-fortune-slots.js  # Node.js 蒙地卡羅 RTP 驗證（Fortune Slots，500 萬次）
│   └── rtp-verify-dragon-wolf.js    # Node.js 蒙地卡羅 RTP 驗證（黑白龍狼傳，1000 萬次）
├── css/
│   ├── main.css            # 根變數、版面、覆蓋層
│   ├── lobby.css           # 大廳樣式、遊戲卡片、view transition
│   ├── reels.css           # 轉盤網格、符號、雲朵氣泡背景
│   ├── ui.css              # 控制面板、按鈕、賠率表、HUD
│   ├── animations.css      # 關鍵影格、粒子、過渡動畫
│   └── responsive.css      # 各斷點的媒體查詢
├── js/
│   ├── config.js           # 符號定義、賠率、權重、Reel Strips、賠付線
│   ├── platform.js         # ⭐ 平台狀態管理：餘額 API、遊戲生命週期、持久化
│   ├── router.js           # SPA Hash Routing（#lobby / #game/slot）、view 切換
│   ├── lobby.js            # 大廳 UI：遊戲卡片渲染、遊戲目錄、互動事件
│   ├── state.js            # 遊戲狀態 + 平台同步（syncFromPlatform / syncToPlatform）
│   ├── rng.js              # Strip-based 隨機生成 + 內建 RTP 模擬器
│   ├── audio.js            # Web Audio API：音效 + 程序化 BGM（雙模式）
│   ├── paylines.js         # 中獎判定引擎（Wild 替代、左至右匹配）
│   ├── features.js         # 免費旋轉 + 獎勵遊戲邏輯
│   ├── jackpot.js          # 累進彩池管理
│   ├── reels.js            # 轉盤渲染 + 旋轉動畫（Two-Phase 彈跳）
│   ├── animations.js       # 中獎線、粒子、Scatter/Crown 框選高亮
│   ├── ui.js               # DOM 事件、畫面更新、賠率表、返回按鈕
│   └── main.js             # 啟動、遊戲迴圈、cleanup()、returnToLobby()
└── images/                 # SVG 素材
    ├── wild.svg
    ├── scatter.svg
    ├── crown.svg
    ├── bell.svg
    ├── seven.svg
    ├── cherry.svg
    ├── lemon.svg
    ├── grape.svg
    ├── reel-bg-fortune.svg # 轉盤區背景
    └── slot-icon.svg       # 遊戲卡片圖示
```

### JS 載入順序

```
config → platform → router → state → rng → audio → paylines → features → jackpot → reels → animations → ui → lobby → main
```

## 本地執行

無需建置步驟，使用任何 HTTP 伺服器即可：

```bash
# Python
python -m http.server 8080

# Node.js
npx serve .

# 或直接在瀏覽器開啟 index.html
```

## RTP 驗證

專案提供瀏覽器內與獨立 Node.js 兩種驗證方式：

```bash
# Fortune Slots RTP 驗證（500 萬次模擬）
node tools/rtp-verify-fortune-slots.js

# 黑白龍狼傳 RTP 驗證（1000 萬次模擬）
node tools/rtp-verify-dragon-wolf.js
```

```javascript
// 瀏覽器內（開啟開發者工具 Console）
SlotGame.RNG.simulateRTP(1000000);
```

目標 RTP：約 96%（基礎遊戲 ~56.5% + 免費旋轉 ~29.5% + 彩池 ~10.2%）

## 架構概覽

```
┌─────────────────────────────────────────┐
│              平台層 Platform            │
│  platform.js（餘額、生命週期）            │
│  router.js（Hash Routing、view 切換）    │
│  lobby.js（遊戲目錄、卡片）              │
├─────────────────────────────────────────┤
│              遊戲層 Game                │
│  state.js ←→ 平台同步                   │
│  main.js（遊戲迴圈調度）                 │
│  config / rng / paylines / features     │
│  reels / animations / audio / ui        │
│  jackpot                                │
└─────────────────────────────────────────┘
全域命名空間：window.SlotGame
狀態機：IDLE → SPINNING → EVALUATING → SHOWING_WINS → IDLE
       （+ FEATURE_PENDING 用於高亮延遲）
持久化：platform_state localStorage key
```

## 瀏覽器支援

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
- 行動瀏覽器（iOS Safari、Chrome for Android）

## 授權聲明

本專案僅供教育及娛樂用途，非真錢博弈遊戲。
