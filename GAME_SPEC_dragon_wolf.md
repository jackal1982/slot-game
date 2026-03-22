# 黑白龍狼傳（Legend of Dragon & Wolf）遊戲規格書

**版本**：1.0
**發佈日期**：2026-03-22
**遊戲 ID**：dragon_wolf
**開發者**：Jackal
**主題**：金光布袋戲 — 黑白龍狼傳（東方武俠風格）
**平台版本要求**：≥ 1.0

---

## 第一章：遊戲基本資訊

| 項目 | 規格 |
|------|------|
| **遊戲名稱** | 黑白龍狼傳 |
| **英文名** | Legend of Dragon & Wolf |
| **遊戲 ID** | dragon_wolf |
| **遊戲類型** | 1024-Ways Video Slot |
| **版本** | 1.0 |
| **發佈日期** | 2026-03-22 |
| **RTP 目標（%）** | 96.0% |
| **波動度（Volatility）** | Base Game：中低 / Free Game：中高 |
| **最大獲勝倍數（Max Win Cap）** | 5000x Bet |
| **開發者** | Jackal |
| **平台版本要求** | ≥ 1.0 |

### 波動度說明
- **Base Game**：介於低波動與中波動之間。Hit Frequency 約 28~32%，獎金分布較均勻，適合延長遊戲時間。
- **Free Game**：介於中波動與高波動之間。透過「隨機百搭」特色機制創造爆發力，單次 Free Spin 可能產生極高獎金。

---

## 第二章：遊戲佈局與核心規格

### 2.1 核心規格表

| 規格項 | 規格值 |
|--------|-------|
| **軸數** | 5 |
| **行數** | 4 |
| **總格數** | 20（5×4） |
| **賠付模式** | 1024 Ways |
| **Ways 計算** | 4^5 = 1024 |
| **匹配方向** | 左至右連續相鄰軸 |
| **最少連續軸數** | 3 |
| **1注金額** | 50 分 |
| **押注倍數** | 1～10 倍（可調） |
| **最小下注** | 50 分（1倍） |
| **最大下注** | 500 分（10倍） |
| **MAX BET** | 直接切到 10 倍（500 分） |

### 2.2 賠付模式：1024 Ways

**定義**：5 軸 × 4 行，每軸任意位置出現相同符號即可組成 Way。總 Ways 數 = 4^5 = 1024。

**計算公式**：
```
獎金 = 符號賠率 × 下注額 × ways 係數
ways 係數 = ∏(各軸匹配行數)
```

**評估邏輯偽代碼**：
```javascript
function evaluate1024Ways(grid, bet) {
    let totalWin = 0;
    const symbols = getAllPaySymbols(); // 不含 Scatter

    for (const symbol of symbols) {
        let consecutiveReels = 0;
        let waysCombination = 1;

        for (let reel = 0; reel < 5; reel++) {
            let matchCount = 0;
            for (let row = 0; row < 4; row++) {
                if (grid[reel][row] === symbol || grid[reel][row] === 'WD') {
                    matchCount++;
                }
            }

            if (matchCount > 0) {
                waysCombination *= matchCount;
                consecutiveReels++;
            } else {
                break; // 中斷，不連續
            }
        }

        if (consecutiveReels >= 3) {
            const payout = PAYTABLE[symbol][consecutiveReels];
            totalWin += payout * bet * waysCombination;
        }
    }

    return totalWin;
}
```

**計算範例**：
- 符號 M2（黑龍）在 5 軸上分別出現 [2, 1, 3, 0, 0] 行
- 有效連續軸數 = 3，ways 係數 = 2 × 1 × 3 = 6
- M2 三連賠率 = 5，下注 50 分
- 獎金 = 5 × 50 × 6 = **1,500 分**

### 2.3 RTP 目標與分配

| 來源 | 預期 RTP |
|------|---------|
| **Base Game** | ~63% |
| **Free Game** | ~33% |
| **總 RTP** | **96%** |

---

## 第三章：符號系統

### 3.1 Base Game 符號定義（9 種）

| 符號 ID | 代號 | 角色/圖案 | 類型 | 滾輪限制 |
|---------|------|----------|------|---------|
| 1 | SC | 幽靈馬車 | Scatter | 僅滾輪 1～3 |
| 2 | WD | 太極圖案 | Wild | 僅滾輪 2～5 |
| 3 | M2 | 黑龍 | 高價 | 全部滾輪 |
| 4 | M3 | 白狼 | 高價 | 全部滾輪 |
| 5 | M4 | 憶無心 | 中高價 | 全部滾輪 |
| 6 | A1 | 符號 A | 低價 | 全部滾輪 |
| 7 | A2 | 符號 K | 低價 | 全部滾輪 |
| 8 | A3 | 符號 Q | 低價 | 全部滾輪 |
| 9 | A4 | 符號 J | 低價 | 全部滾輪 |

### 3.2 Free Game 符號定義（8 種）

| 符號 ID | 代號 | 角色/圖案 | 類型 | 滾輪限制 |
|---------|------|----------|------|---------|
| 1 | SC | 幽靈馬車 | Scatter | 僅滾輪 1～3 |
| 2 | WD | 太極圖案 | Wild | 僅滾輪 2～5 |
| 10 | M1 | 黑白郎君 | 最高價（限定） | 全部滾輪 |
| 5 | M4 | 憶無心 | 中高價 | 全部滾輪 |
| 6 | A1 | 符號 A | 低價 | 全部滾輪 |
| 7 | A2 | 符號 K | 低價 | 全部滾輪 |
| 8 | A3 | 符號 Q | 低價 | 全部滾輪 |
| 9 | A4 | 符號 J | 低價 | 全部滾輪 |

**差異說明**：Free Game 移除 M2（黑龍）與 M3（白狼），新增 M1（黑白郎君）作為 Free Game 限定最高價值符號，同時也是隨機百搭特色的觸發者。

### 3.3 符號出現限制

| 限制規則 | 說明 |
|---------|------|
| **Scatter 滾輪限制** | 只在滾輪 1、2、3 出現 |
| **Scatter 重複限制** | 同一滾輪的 4 個格位最多出現 1 個 Scatter |
| **Wild 滾輪限制** | 只在滾輪 2、3、4、5 出現 |
| **M1 出現範圍** | 滾輪 1～5 都會出現（僅 Free Game） |

### 3.4 Wild 替代規則

- **可替代**：除 Scatter 外所有符號（含 M1、M2、M3、M4、A1~A4）
- **不可替代**：Scatter
- **Wild 自身賠率**：Wild 有自身賠率，且為最高
- **出現模式**：Normal（正常均勻分佈在 Reel Strip）
- **Free Game 隨機百搭**：特色觸發後額外放置的 Wild，與 Reel Strip 上的 Wild 行為相同

### 3.5 Scatter 觸發機制

- **觸發條件**：滾輪 1～3 任意位置出現 3 個 Scatter
- **觸發功能**：Free Spins（自由旋轉）
- **Scatter 不參與 Ways 賠付計算**
- **視覺效果**：Scatter 觸發時顯示紫金色脈衝光暈，延遲 2 秒後顯示 Free Spins Intro

---

## 第四章：賠率表

### 4.1 Base Game 賠率表

以 1× 下注（50 分）為基準，賠率為 per-way 的 bet 倍率：

| 符號 | 3連 | 4連 | 5連 |
|------|-----|-----|-----|
| **M2**（黑龍） | 0.10 | 0.20 | 0.44 |
| **M3**（白狼） | 0.06 | 0.18 | 0.38 |
| **M4**（憶無心） | 0.06 | 0.08 | 0.22 |
| **A1**（A） | 0.04 | 0.04 | 0.10 |
| **A2**（K） | 0.04 | 0.04 | 0.08 |
| **A3**（Q） | 0.04 | 0.04 | 0.08 |
| **A4**（J） | 0.04 | 0.04 | 0.06 |

**賠率說明**：
- Wild（太極）無獨立賠率，僅作為替代符號（因 Wild 只在軸2~5出現，不可能從軸1開始組成連線）
- 所有賠率為 0.02 的倍數，確保最小下注 50分 × 賠率 × ways 永遠是整數
- 實際贏分 = ways數 × 賠率 × 下注額

### 4.2 Free Game 賠率表

| 符號 | 3連 | 4連 | 5連 |
|------|-----|-----|-----|
| **M1**（黑白郎君） | 0.30 | 0.74 | 1.44 |
| **M4**（憶無心） | 0.12 | 0.30 | 0.56 |
| **A1**（A） | 0.06 | 0.16 | 0.32 |
| **A2**（K） | 0.04 | 0.14 | 0.18 |
| **A3**（Q） | 0.04 | 0.14 | 0.18 |
| **A4**（J） | 0.04 | 0.06 | 0.16 |

**Free Game 賠率說明**：
- Free Game 移除 M2、M3，新增 M1（黑白郎君）
- M1 賠率最高，觸發「隨機百搭」特色時可大幅放大獎金
- Free Game 無額外倍率（1×），靠隨機百搭特色創造高波動

---

## 第五章：Reel Strip 設計

### 5.1 Base Game Reel Strip

各軸符號數量不同（108~132），以避免週期共振。

### 5.2 Base Game 符號分佈總覽

| 軸 | SC | WD | M2 | M3 | M4 | A1 | A2 | A3 | A4 | 合計 |
|----|----|----|----|----|----|----|----|----|----|----|
| 軸1 | 6 | — | 3 | 4 | 6 | 14 | 18 | 24 | 33 | **108** |
| 軸2 | 6 | 4 | 3 | 4 | 6 | 14 | 18 | 24 | 36 | **115** |
| 軸3 | 6 | 5 | 3 | 4 | 6 | 14 | 18 | 24 | 52 | **132** |
| 軸4 | — | 5 | 3 | 4 | 7 | 15 | 18 | 26 | 44 | **122** |
| 軸5 | — | 6 | 3 | 4 | 7 | 15 | 18 | 26 | 46 | **125** |

### 5.3 Free Game Reel Strip

各軸符號數量不同（110~128），以避免週期共振。

### 5.4 Free Game 符號分佈總覽

| 軸 | SC | WD | M1 | M4 | A1 | A2 | A3 | A4 | 合計 |
|----|----|----|----|----|----|----|----|----|-----|
| 軸1 | 2 | — | 6 | 5 | 14 | 17 | 24 | 42 | **110** |
| 軸2 | 2 | 6 | 6 | 5 | 14 | 17 | 24 | 41 | **115** |
| 軸3 | 2 | 7 | 6 | 5 | 14 | 17 | 24 | 45 | **120** |
| 軸4 | — | 8 | 6 | 6 | 15 | 17 | 26 | 44 | **122** |
| 軸5 | — | 9 | 6 | 6 | 15 | 17 | 26 | 49 | **128** |

### 5.5 設計原則

- 各軸長度 108~132，各軸不同，避免週期共振
- SC 在輪帶中均勻間距分佈（確保同軸 4 格視窗最多只看到 1 個 SC）
- WD 同樣均勻間距分佈
- Base Game SC:6/6/6（軸1~3），Free Game SC:2/2/2（降低 Retrigger）
- Scatter 觸發率 ~0.84%（約每 119 把進一次 Free Game）

---

## 第六章：特殊功能

### 6.1 Free Spins（自由旋轉）

#### 6.1.1 觸發條件

| 參數 | 規格 |
|------|------|
| **觸發符號** | Scatter（幽靈馬車） |
| **所需數量** | 3 個（滾輪 1～3 各 1 個） |
| **初始場次** | 10 局 |
| **Free Spins 倍率** | 1×（無額外倍率） |
| **Retrigger 條件** | Free Spins 中再出現 3 個 Scatter |
| **Retrigger 獎勵** | +10 局 |
| **最大場次上限** | 50 局 |

#### 6.1.2 Free Spins 流程

```
1. Base Game 中出現 3 個 Scatter
2. Scatter 符號顯示紫金色脈衝光暈（2 秒）
3. 顯示 Free Spins Intro overlay（"自由旋轉 × 10"）
4. 切換為 Free Game 符號表（移除 M2/M3，加入 M1）
5. 切換為 Free Game Reel Strip
6. 切換為 Free Game BGM（懸疑緊湊風格）
7. 執行 Free Spins（使用 Free Game 規則）
8. 每局檢查 M1 連線 → 是否觸發隨機百搭特色
9. 每局檢查 Scatter → 是否 Retrigger
10. 所有 Free Spins 完成後，顯示總獎金
11. 切換回 Base Game（符號表、Reel Strip、BGM）
```

#### 6.1.3 Free Spins 觸發機率估算

- Scatter 觸發率：~0.84%（約每 119 把觸發一次）
- 基於 10M 次 Monte Carlo 模擬驗證

### 6.2 隨機百搭特色（黑白郎君氣功）

#### 6.2.1 觸發條件

| 參數 | 規格 |
|------|------|
| **觸發時機** | 僅在 Free Game 中 |
| **觸發符號** | M1（黑白郎君） |
| **觸發條件** | M1 在任意 Way 上有 3 連線或以上 |
| **M1 出現範圍** | 滾輪 1～5 |

#### 6.2.2 觸發流程

```
1. Free Spin 停止，評估結果
2. 檢測 M1 在 Ways 上是否有 3+ 連線
3. 若觸發：
   a. M1 連線符號播放「框起來」高亮效果
   b. 播放「黑白郎君發氣功」動畫
   c. 計算滾輪2~5已有的百搭數量（existingWilds）
   d. 可放置上限 = 16 - existingWilds
   e. 依分佈表決定百搭數量，但不得超過可放置上限
   f. 在滾輪2~5的非百搭位置中，隨機選取對應數量的位置
   g. 以隨機順序逐個放置百搭（每個播放掌力打牆音效）
   h. 放置完成後重新計算所有 Ways 贏分
4. 顯示最終贏分（含隨機百搭後的結果）
```

#### 6.2.3 隨機百搭數量分佈

| 百搭數量 | 機率 | 累積機率 |
|---------|------|---------|
| 2～4 個 | 60% | 60% |
| 5～8 個 | 30% | 90% |
| 9～12 個 | 8% | 98% |
| 13～16 個 | 2% | 100% |

**各範圍內均勻分佈**：
- 2～4 個：每個數量各 20%（60% ÷ 3）
- 5～8 個：每個數量各 7.5%（30% ÷ 4）
- 9～12 個：每個數量各 2%（8% ÷ 4）
- 13～16 個：每個數量各 0.5%（2% ÷ 4）

**最大放置量**：16 個（滾輪 2～5，每軸 4 行 = 16 格全滿）

#### 6.2.4 隨機百搭放置邏輯偽代碼

```javascript
function triggerRandomWilds(grid) {
    // 1. 決定百搭數量
    const roll = Math.random() * 100;
    let count;
    if (roll < 60) {
        count = randomInt(2, 4);       // 60%: 2~4 個
    } else if (roll < 90) {
        count = randomInt(5, 8);       // 30%: 5~8 個
    } else if (roll < 98) {
        count = randomInt(9, 12);      // 8%: 9~12 個
    } else {
        count = randomInt(13, 16);     // 2%: 13~16 個
    }

    // 2. 收集可放置的位置（滾輪 2~5，排除已是 Wild 的格位）
    const availablePositions = [];
    for (let reel = 1; reel < 5; reel++) {      // reel 1~4 (0-indexed) = 滾輪 2~5
        for (let row = 0; row < 4; row++) {
            if (grid[reel][row] !== 'WD') {
                availablePositions.push({ reel, row });
            }
        }
    }

    // 3. 實際放置數量不超過可用位置
    const actualCount = Math.min(count, availablePositions.length);

    // 4. Fisher-Yates shuffle 後取前 actualCount 個位置
    shuffle(availablePositions);
    const selectedPositions = availablePositions.slice(0, actualCount);

    // 5. 放置百搭
    for (const pos of selectedPositions) {
        grid[pos.reel][pos.row] = 'WD';
        // 播放掌力打牆音效
        playSound('palm_hit');
    }

    // 6. 重新計算所有 Ways 贏分
    return evaluate1024Ways(grid, currentBet);
}
```

#### 6.2.5 隨機百搭的 RTP 影響

- 觸發條件：M1 三連線（Free Game 限定）
- M1 在 Free Game 每軸出現率：約 3/33 ≈ 9.1%
- M1 三連線估計機率：約 0.75%（含 Wild 替代）
- 平均額外百搭數：2×20% + 3×20% + 4×20% + 5×7.5% + 6×7.5% + 7×7.5% + 8×7.5% + 9×2% + 10×2% + 11×2% + 12×2% + 13×0.5% + 14×0.5% + 15×0.5% + 16×0.5% ≈ 4.97 個
- 此特色是 Free Game 高波動的核心來源

---

## 第七章：狀態機

### 7.1 遊戲狀態流程

```
IDLE（等待）
  ↓ onSpin()
SPINNING（轉動中）
  ↓ onReelsStopped()
EVALUATING（評估）
  ↓ checkWays()
SHOWING_WINS（展示勝利）
  ↓ onWinsShown()
FEATURE_PENDING（特色待觸發，阻擋輸入）
  ↓
  ├─ hasFreeSpins? → FREE_SPINS 模式
  │   ↓ Free Spin 每局：
  │   SPINNING → EVALUATING → checkM1() →
  │   ├─ M1 連線? → RANDOM_WILDS → 重新評估 → SHOWING_WINS
  │   └─ 無 M1 連線 → SHOWING_WINS
  │   ↓ 所有 Free Spins 完成
  │   FREE_SPINS_SUMMARY → IDLE
  └─ 無特色 → IDLE
```

### 7.2 狀態定義

| 狀態 | 說明 | 可執行操作 |
|------|------|----------|
| IDLE | 等待玩家操作 | Spin、調整下注、返回大廳 |
| SPINNING | 滾輪轉動中 | Slam Stop |
| EVALUATING | 評估結果中 | 無 |
| SHOWING_WINS | 展示勝利動畫 | Skip |
| FEATURE_PENDING | 特色高亮延遲（2秒） | 無（阻擋所有輸入） |
| FREE_SPINS | Free Spins 進行中 | Spin（自動）/ Slam Stop |
| RANDOM_WILDS | 隨機百搭放置動畫中 | 無 |
| FREE_SPINS_SUMMARY | Free Spins 結算畫面 | 點擊關閉 |

---

## 第八章：配色系統

### 8.1 色彩定義

**風格**：金光布袋戲華麗風（金紅紫）

| 用途 | CSS 變數建議 | 色碼 |
|------|------------|------|
| 主背景 | `--dw-bg-primary` | `#1A0A2E`（深紫黑） |
| 次背景 | `--dw-bg-secondary` | `#2D1B4E`（暗紫） |
| 三級背景 | `--dw-bg-tertiary` | `#3D2B5E`（中紫） |
| 主強調色（金） | `--dw-accent-gold` | `#FFD700`（金色） |
| 副強調色（紅） | `--dw-accent-red` | `#DC143C`（猩紅） |
| 三級強調色（紫） | `--dw-accent-purple` | `#9B59B6`（紫色） |
| 主文字 | `--dw-text-primary` | `#FFFFFF`（白色） |
| 次文字 | `--dw-text-secondary` | `#E8D5B7`（暖米） |
| 金色文字 | `--dw-text-gold` | `#FFD700` |
| 滾輪背景 | `--dw-reel-bg` | `#0D0520`（極深紫） |
| 滾輪邊框 | `--dw-reel-border` | `#FFD700`（金色） |
| 按鈕漸層 | `--dw-btn-gradient` | `135deg, #DC143C → #8B0000` |
| 陰影 | `--dw-shadow-gold` | `rgba(255, 215, 0, 0.3)` |
| Free Spins 色 | — | `#9B59B6`（紫色） |
| 勝利色 | — | `#FFD700`（金色） |

### 8.2 滾輪背景

- **主題**：武林場景
- **元素**：山岳、竹林、飛瀑、霧氣
- **風格**：半透明水墨畫效果，疊加在深紫色背景上
- **動態效果**：霧氣緩緩流動（CSS animation）

### 8.3 配色注意事項

- 與 Fortune Slots 的淺藍休閒風完全不同，形成鮮明對比
- 所有 CSS 變數使用 `--dw-` 前綴，避免與 Fortune Slots 衝突
- overlay 文字使用白色或金色（深色背景上）
- 按鈕使用紅金漸層，hover 時金色光暈
- Scatter 高亮使用紫金色脈衝
- M1 連線高亮使用紅金色脈衝
- 隨機百搭放置時使用金色閃光效果

---

## 第九章：音效系統

### 9.1 BGM（背景音樂）

**技術**：Web Audio API 程序化生成（與 Fortune Slots 相同架構）

#### Base Game BGM
- **風格**：輕快、森林氣息
- **樂器**：琵琶 + 古箏為主
- **BPM**：90～100
- **調性**：D 大調（明亮溫暖）
- **旋律長度**：至少 10 秒不重複
- **音階**：五聲音階（宮商角徵羽）
- **層次**：
  1. 古箏 Pad（持續和弦背景）
  2. 琵琶旋律（主旋律）
  3. 竹笛點綴（偶爾加入）
  4. 輕鼓節奏（木魚/小鼓）

#### Free Game BGM
- **風格**：懸疑、緊湊
- **樂器**：琵琶 + 古箏 + 低音鼓
- **BPM**：120～130
- **調性**：A 小調（緊張感）
- **旋律長度**：至少 10 秒不重複
- **音階**：五聲小調
- **層次**：
  1. 低音古箏（持續低頻脈動）
  2. 琵琶快速輪指（緊張感旋律）
  3. 鼓點（太鼓風格，強調節拍）
  4. 氣氛音效（風聲、劍氣）

#### BGM 切換
- Base → Free：0.15s crossfade，即時切換
- Free → Base：Free Spins Summary 關閉後切換
- MUSIC 按鈕獨立於 SOUND 開關

### 9.2 音效

| 音效 | 說明 | 觸發時機 |
|------|------|---------|
| **spin_start** | 滾輪啟動聲 | 按下 SPIN |
| **reel_stop** | 單軸停止聲 | 每軸停止時 |
| **small_win** | 小贏音效 | 贏分 < 10× 下注 |
| **big_win** | 大贏音效 | 贏分 ≥ 10× 下注 |
| **scatter_hit** | Scatter 出現聲 | Scatter 落定時 |
| **free_spin_intro** | Free Spins 啟動聲 | 進入 Free Spins |
| **palm_hit** | 掌力打牆短悶響 | 每個隨機百搭放置時 |
| **m1_trigger** | 黑白郎君氣功啟動聲 | M1 連線觸發特色時 |
| **qigong_wave** | 氣功波動音效 | 氣功動畫播放時 |

---

## 第十章：動畫規格

### 10.1 滾輪動畫

| 動畫 | 規格 |
|------|------|
| **旋轉速度** | 與 Fortune Slots 相同（可共用 reels.js） |
| **停止動畫** | Two-Phase Bounce（超衝 + 回彈 180ms） |
| **Slam Stop** | 支援快停，分軸 stagger bounce |

### 10.2 特色動畫

#### Base Game → Free Game 轉場動畫（約 4 秒）

**時間軸**：

**第 0～1 秒 — 黑龍、白狼靠近**
- 黑龍從畫面左側滑入，白狼從右側滑入
- 兩者背靠背接近至畫面中央
- 背景漸暗（滾輪區淡出）
- 音效：低沉的氣場聚合音

**第 1～2 秒 — 融合・黑白霧氣**
- 黑龍白狼開始融合，輪廓模糊化
- 大量黑白霧氣從融合點向外擴散
- **此刻響起黑白郎君的狂笑聲**（持續到動畫結束）
- 音效：能量衝擊波 + 狂笑聲開始

**第 2～4 秒 — 黑白郎君現身**
- 霧氣中心，黑白郎君身影逐漸清晰
- 霸氣登場姿勢（雙手展開或叉腰）
- **顯示「Free Spins × 10」文字**（金色，從黑白郎君上方或下方浮現）
- 霧氣漸散，狂笑聲漸弱
- 轉場結束，進入 Free Game 畫面

**音效時間軸**：
| 時間 | 音效 |
|------|------|
| 0～1 秒 | 低沉氣場聚合音 |
| 1～4 秒 | 黑白郎君狂笑聲（標誌性笑聲） |
| 1～2 秒 | 能量衝擊波音效（融合瞬間） |

**設計參考**：金光布袋戲黑白龍狼傳中，黑龍（善體）與白狼（惡體）合體回歸為黑白郎君的經典橋段。

#### 黑白郎君氣功動畫
1. **角色出場**：黑白郎君從畫面左側滑入（0.5 秒）
2. **蓄力**：角色蓄力姿勢，周圍出現氣場光環（0.5 秒）
3. **發功**：雙手推出氣功波，波紋向滾輪區擴散（0.5 秒）
4. **百搭放置**：氣功波到達滾輪區，百搭符號逐個亮起（每個 0.15 秒間隔）
5. **角色退場**：黑白郎君淡出（0.3 秒）

#### Scatter 觸發動畫
1. Scatter 符號顯示紫金色脈衝光暈（2 秒）
2. 光暈擴散效果
3. 顯示 Free Spins Intro overlay

#### 勝利線動畫
- 1024-Ways 不繪製固定線路
- 改為：中獎符號同時閃爍 + 贏分數字彈出
- 多組贏分逐組展示，每組 1.5 秒

### 10.3 粒子效果

| 效果 | 觸發條件 | 顏色 |
|------|---------|------|
| **金色光粒** | 任何贏分 | 金色 #FFD700 |
| **紅色火花** | Big Win | 紅色 #DC143C |
| **紫色氣場** | Free Spins 觸發 | 紫色 #9B59B6 |
| **白色劍氣** | 隨機百搭放置 | 白色 #FFFFFF |

---

## 第十一章：大廳整合

### 11.1 遊戲卡片

```javascript
{
    id: 'dragon_wolf',
    name: '黑白龍狼傳',
    subtitle: 'Legend of Dragon & Wolf',
    description: '5 軸 1024 Ways・金光布袋戲主題',
    rtp: '96.00%',
    icon: 'images/dragon-wolf-icon.svg',
    features: ['1024 Ways', 'Free Spins', '隨機百搭'],
    volatility: '中低～中高'
}
```

### 11.2 遊戲生命週期

- **進入遊戲**：`Platform.enterGame('dragon_wolf')` → 載入 dragon_wolf 設定 → 初始化遊戲
- **返回大廳**：同步餘額 → `Platform.returnToLobby()`
- **狀態持久化**：`platform_state.games.dragon_wolf`

### 11.3 路由

- Hash：`#game/dragon_wolf`
- 從大廳進入時跳過 Splash Screen（同 Fortune Slots 機制）

---

## 第十二章：玩家控制

| 控制 | 功能 | 觸發方式 |
|------|------|---------|
| **SPIN** | 開始旋轉 | 按鈕 / 滾輪區點擊 / 空白鍵 |
| **STOP** | 快速停止 | SPINNING 狀態下點擊 |
| **SKIP** | 跳過勝利展示 | SHOWING_WINS 狀態下點擊 |
| **BET ×** | 調整倍數 | +/- 按鈕（1~10） |
| **MAX BET** | 切到最高倍數 | 按鈕（直接設為 10倍 = 500分） |
| **AUTO** | 自動旋轉 | 按鈕（可中斷） |
| **TURBO** | 加速模式 | 按鈕切換 |
| **返回大廳** | 回到大廳 | 僅 IDLE 可用 |
| **MUSIC** | BGM 開關 | 獨立於 SOUND |
| **SOUND** | 音效開關 | 按鈕切換 |
| **PAYTABLE** | 查看賠率表 | 按鈕 |

**防連點機制**：500ms ACTION_COOLDOWN

---

## 第十三章：Paytable（遊戲內賠率表顯示）

### 13.1 顯示內容

1. **符號賠率**：展示所有符號的 3/4/5 連賠率
2. **Ways 說明**：解釋 1024 Ways 的概念
3. **Wild 規則**：太極替代說明
4. **Scatter 規則**：幽靈馬車觸發 Free Spins
5. **Free Game 特色**：黑白郎君隨機百搭說明
6. **下注說明**：倍數系統

### 13.2 Base Game / Free Game 區分

- Paytable 需明確標示 Base Game 和 Free Game 的符號差異
- 說明 M1 僅在 Free Game 出現
- 說明 M2、M3 僅在 Base Game 出現

---

## 第十四章：RTP 驗證

### 14.1 驗證方法

使用 Monte Carlo 模擬法，建議模擬次數 ≥ 1,000 萬次。

### 14.2 驗證偽代碼

```javascript
function verifyRTP(iterations = 10000000) {
    let totalBet = 0;
    let totalWin = 0;
    let baseGameWin = 0;
    let freeGameWin = 0;
    let freeSpinsTriggers = 0;
    let randomWildTriggers = 0;

    for (let i = 0; i < iterations; i++) {
        const bet = 50; // 1× 下注
        totalBet += bet;

        // Base Game spin
        const baseGrid = generateBaseGameGrid();
        const baseWin = evaluate1024Ways(baseGrid, bet);
        baseGameWin += baseWin;
        totalWin += baseWin;

        // 檢查 Free Spins 觸發
        const scatterCount = countScatters(baseGrid);
        if (scatterCount >= 3) {
            freeSpinsTriggers++;
            let freeSpinsRemaining = 10;
            let totalFreeSpinsUsed = 0;

            while (freeSpinsRemaining > 0 && totalFreeSpinsUsed < 50) {
                freeSpinsRemaining--;
                totalFreeSpinsUsed++;

                // Free Game spin
                const freeGrid = generateFreeGameGrid();
                let freeWin = evaluate1024Ways(freeGrid, bet);

                // 檢查 M1 連線
                if (hasM1ThreeOrMore(freeGrid)) {
                    randomWildTriggers++;
                    // 放置隨機百搭
                    const wildCount = rollRandomWildCount();
                    placeRandomWilds(freeGrid, wildCount);
                    // 重新計算
                    freeWin = evaluate1024Ways(freeGrid, bet);
                }

                freeGameWin += freeWin;
                totalWin += freeWin;

                // 檢查 Retrigger
                const freeScatters = countScatters(freeGrid);
                if (freeScatters >= 3) {
                    freeSpinsRemaining = Math.min(
                        freeSpinsRemaining + 10,
                        50 - totalFreeSpinsUsed
                    );
                }
            }
        }
    }

    const rtp = totalWin / totalBet;
    const baseRTP = baseGameWin / totalBet;
    const freeRTP = freeGameWin / totalBet;

    console.log(`Total RTP: ${(rtp * 100).toFixed(2)}%`);
    console.log(`Base Game RTP: ${(baseRTP * 100).toFixed(2)}%`);
    console.log(`Free Game RTP: ${(freeRTP * 100).toFixed(2)}%`);
    console.log(`Free Spins Trigger Rate: 1/${Math.round(iterations / freeSpinsTriggers)}`);
    console.log(`Random Wild Trigger Rate in FS: ${(randomWildTriggers / freeSpinsTriggers / 10 * 100).toFixed(1)}%`);
}
```

### 14.3 RTP 目標驗收標準

| 指標 | 目標 | 可接受範圍 |
|------|------|----------|
| **總 RTP** | 96.00% | 95.50% ~ 96.50% |
| **Base Game RTP** | 63.00% | 61.00% ~ 65.00% |
| **Free Game RTP** | 33.00% | 31.00% ~ 35.00% |

### 14.4 調校優先順序

1. 先調整 Base Game 賠率 → 驗證 Base RTP
2. 再調整 Free Game Reel Strip（M1/Wild 分佈）→ 驗證 Free RTP
3. **不要同時修改賠率和 Reel Strip**
4. 每次調整後重新驗證

---

## 第十五章：RWD 響應式設計

### 15.1 斷點

| 斷點 | 目標 | 符號尺寸 |
|------|------|---------|
| > 768px | 桌機 | 90px（5×4 較小） |
| ≤ 768px | 平板 | 70px |
| ≤ 480px | 手機 | `calc((100vw - 30px) / 5)` |
| ≤ 360px | 小手機 | 50px |

### 15.2 5×4 佈局調整

- 相較 Fortune Slots 的 5×3，多一行需要壓縮每行高度
- 滾輪區總高度 = 符號尺寸 × 4 + gap
- 控制面板可能需要更緊湊的排列

---

## 第十六章：開發 Checklist

- [ ] 建立 `dragon_wolf/` 目錄結構（或在現有 js/ 下建立模組）
- [ ] 實作 `config_dragon_wolf.js`（符號、賠率、Reel Strip）
- [ ] 實作 1024-Ways 賠付評估引擎
- [ ] 實作 Free Game 符號表切換
- [ ] 實作 Free Game Reel Strip 切換
- [ ] 實作隨機百搭特色邏輯
- [ ] 實作黑白郎君氣功動畫
- [ ] 設計 SVG 符號圖檔（9+1 種）
- [ ] 設計滾輪背景（武林場景 SVG）
- [ ] 設計遊戲圖標（dragon-wolf-icon.svg）
- [ ] 實作配色系統（CSS 變數）
- [ ] 實作 BGM（Base Game + Free Game）
- [ ] 實作掌力打牆音效
- [ ] 實作 Paytable 頁面
- [ ] 整合至大廳遊戲目錄
- [ ] 整合至 Router（#game/dragon_wolf）
- [ ] 整合至 Platform 狀態管理
- [ ] 編寫 RTP 驗證腳本
- [ ] Monte Carlo 模擬驗證 RTP
- [ ] RWD 測試（桌機/平板/手機）
- [ ] 音效測試
- [ ] 完整遊戲流程測試
- [ ] 提交 PR

---

## 第十七章：附錄

### A. 與 Fortune Slots 的主要差異

| 項目 | Fortune Slots | 黑白龍狼傳 |
|------|-------------|-----------|
| 佈局 | 5×3 | 5×4 |
| 賠付模式 | 20 Fixed Paylines | 1024 Ways |
| 配色 | 淺藍休閒 | 金紅紫華麗 |
| Free Spins 倍率 | 3× | 1×（靠隨機百搭） |
| 特色功能 | Bonus Game（寶箱） | 隨機百搭（氣功） |
| Jackpot | Progressive | 無 |
| 符號數 | 8 | Base 9 / Free 8 |
| BGM 風格 | 現代電子 | 中國風（琵琶古箏） |
| 主題 | 經典幸運 | 金光布袋戲武俠 |

### B. 名詞對照

| 術語 | 說明 |
|------|------|
| Ways | 任意相鄰軸相同符號組合的賠付方式 |
| Way 係數 | 各軸匹配行數的乘積 |
| Retrigger | Free Spins 中再次觸發 Free Spins |
| 隨機百搭 | M1 連線觸發的特色，在滾輪上額外放置 Wild |
| Slam Stop | 玩家主動快速停止滾輪 |

---

**文件結束**
