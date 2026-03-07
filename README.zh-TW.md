# Fortune Slots - 幸運老虎機

繁體中文 | [English](README.md)

一款功能完整的 5 軸 3 列 20 線視頻老虎機，使用純 HTML5 + CSS3 + 原生 JavaScript 打造。無框架、無相依套件、無需建置步驟。

## 立即遊玩

**https://jackal1982.github.io/slot-game/**

## 功能介紹

### 核心玩法
- **5 軸 x 3 列**，20 條固定賠付線
- **8 種 SVG 符號**，採用加權隨機生成
- **Wild 百搭符號** — 可替代所有符號（Scatter 除外）
- **由左至右**賠付線判定（連續 3 個以上相同符號即中獎）
- **可調注額** — 10 個投注等級（每線 1 ~ 100）

### 特殊功能
- **免費旋轉（Free Spins）** — 畫面任意位置出現 3 個以上 Scatter 即觸發 6~13 次免費旋轉，所有獎金 2 倍。免費旋轉期間可重新觸發
- **獎勵遊戲（Bonus Game）** — 賠付線上出現 3 個以上 Crown 即觸發寶箱選獎遊戲，可獲得倍數獎金、額外選擇次數、甚至 Jackpot
- **累進彩池（Progressive Jackpot）** — 每次投注的 10% 注入彩池。中獎條件：中間列出現 5 個 Wild

### 操作方式
- **SPIN / STOP / SKIP** — 按鈕根據遊戲階段自動切換功能
- **急停（Slam Stop）** — 轉動中按下 STOP 可立即停止，帶有彈跳動畫
- **Turbo 模式** — 2.5 倍速旋轉動畫
- **自動旋轉（Auto Spin）** — 連續自動轉 100 次
- **鍵盤操作** — 按空白鍵等同點擊 SPIN / STOP / SKIP
- **點擊轉盤區** — 點擊轉盤區域任意位置也可觸發操作

### 技術亮點
- **零相依** — 純 HTML5 + CSS3 + 原生 JS，無需任何框架或套件
- **SVG 向量圖形** — 符號在任何解析度下都清晰銳利
- **CSS Transition 動畫** — 透過 `transform: translateY()` 實現 GPU 加速的轉輪捲動
- **Web Audio API** — 所有音效由程式碼動態生成（無需音檔）
- **Canvas 疊加層** — 中獎線帶發光效果的動態繪製
- **localStorage 持久化** — 餘額、設定、彩池金額跨瀏覽器會話保留
- **響應式設計（RWD）** — 支援桌機、平板、手機與橫向模式

## 符號與賠率表

| 符號 | 名稱 | x3 | x4 | x5 | 特殊效果 |
|------|------|----|----|-----|---------|
| Wild | 百搭 | 31 | 118 | 435 | 替代所有符號（Scatter 除外） |
| Scatter | 鑽石 | - | - | - | 3/4/5 個 = 6/9/13 次免費旋轉 |
| Crown | 皇冠 | 24 | 80 | 248 | 賠付線上 3+ 個 = 觸發獎勵遊戲 |
| Bell | 鈴鐺 | 15 | 48 | 150 | - |
| Seven | 幸運7 | 12 | 40 | 97 | - |
| Cherry | 櫻桃 | 8 | 24 | 75 | - |
| Lemon | 檸檬 | 5 | 15 | 48 | - |
| Grape | 葡萄 | 3 | 8 | 40 | - |

> 賠率值乘以每線投注金額即為實際獎金。

## 專案結構

```
slot-game/
├── index.html              # 單頁 HTML
├── css/
│   ├── main.css            # 根變數、版面、覆蓋層
│   ├── reels.css           # 轉盤網格、符號、中獎狀態
│   ├── ui.css              # 控制面板、按鈕、賠率表、HUD
│   ├── animations.css      # 關鍵影格、粒子、過渡動畫
│   └── responsive.css      # 各斷點的媒體查詢
├── js/
│   ├── config.js           # 常數、符號定義、賠付線、參數調校
│   ├── state.js            # 遊戲狀態 + localStorage 持久化
│   ├── rng.js              # 加權隨機 + RTP 蒙地卡羅模擬器
│   ├── audio.js            # Web Audio API 音效
│   ├── paylines.js         # 中獎判定引擎
│   ├── features.js         # 免費旋轉 + 獎勵遊戲邏輯
│   ├── jackpot.js          # 累進彩池管理
│   ├── reels.js            # 轉盤渲染 + 旋轉動畫
│   ├── animations.js       # 中獎線、粒子、慶祝特效
│   ├── ui.js               # DOM 事件 + 畫面更新
│   └── main.js             # 啟動 + 遊戲迴圈調度
└── images/                 # 8 個 SVG 符號圖形
    ├── wild.svg            # 金色六芒星
    ├── scatter.svg         # 藍色鑽石
    ├── crown.svg           # 金色皇冠
    ├── bell.svg            # 金色鈴鐺
    ├── seven.svg           # 紅色幸運7
    ├── cherry.svg          # 紅色櫻桃
    ├── lemon.svg           # 黃色檸檬
    └── grape.svg           # 紫色葡萄
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

遊戲內建蒙地卡羅 RTP 模擬器，打開瀏覽器開發者工具的 Console 執行：

```javascript
SlotGame.RNG.simulateRTP(1000000); // 模擬 100 萬次旋轉
```

目標 RTP：約 96%（基礎遊戲 ~56% + 免費旋轉 ~30% + 彩池 ~10%）

## 瀏覽器支援

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
- 行動瀏覽器（iOS Safari、Chrome for Android）

## 授權聲明

本專案僅供教育及娛樂用途，非真錢博弈遊戲。
