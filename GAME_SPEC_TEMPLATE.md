# 老虎機遊戲規格模板 v2.0

**版本**：2.0
**發佈日期**：2026-03-21
**更新日期**：2026-03-21
**用途**：遊戲開發者、QA、產品經理在設計新老虎機遊戲時的標準化規格文件
**語言**：繁體中文

---

## 使用說明

本模板適用於開發基於 Slot Game 平台的任何新老虎機遊戲。使用步驟：

1. **複製本文件**到新遊戲資料夾，命名為 `GAME_SPEC_{遊戲ID}.md`
2. **填寫第一章至第七章**的空白欄位（遊戲基本資訊、符號、Reel Strip、賠付模式等）
3. **選擇合適的遊戲機制**（參考附錄 D 速查表），填寫第六章特殊功能
4. **執行 RTP 驗證**：`node rtp-verify.js`，確保 RTP 落在目標範圍
5. **調整配色系統**（第八章）並與 UI 團隊確認
6. **逐項完成附錄 B 的 Checklist**
7. **提交 Pull Request**進行 Review

### v2.0 新增內容
- **多種賠付模式支援**（243 Ways、1024 Ways、Megaways、Cluster Pays 等）
- **Wild 行為模式詳解**（Sticky、Expanding、Walking、Multiplier、Stacked、Colossal）
- **擴展特殊功能**（Cascading、Hold and Spin、Gamble、Buy Feature、Progressive）
- **模組化生命週期**管理
- **進階動畫規格**與**音效主題框架**
- **完整的 RTP 數學模型**（波動度、Hit Frequency、Max Win Cap）

---

## 第一章：遊戲基本資訊

| 項目 | Fortune Slots 範例 | 新遊戲 |
|------|------------------|-------|
| **遊戲名稱** | Fortune Slots | |
| **遊戲 ID** | slot | |
| **遊戲類型** | Classic 5-Reel Slot | |
| **版本** | 1.0 | |
| **發佈日期** | 2025-12-15 | |
| **RTP 目標（%）** | 96.0 | |
| **波動度（Volatility）** | 中等 (Medium) | |
| **最大獲勝倍數（Max Win Cap）** | 100x Bet | |
| **開發者** | Jackal | |
| **平台版本要求** | ≥ 1.0 | |

### 波動度定義
| 波動度等級 | RTP波動範圍 | Hit Frequency | 目標玩家 | 例子 |
|--------|-----------|---------------|---------|------|
| **低（Low）** | 變異較小 | >30% | 保守玩家 | 經典櫻桃機 |
| **中（Medium）** | 標準變異 | 20~30% | 一般玩家 | Fortune Slots |
| **高（High）** | 較大變異 | 15~20% | 冒險玩家 | 進階功能遊戲 |
| **極高（Extreme）** | 極端變異 | <15% | 極限玩家 | Megaways 遊戲 |

### 最大獲勝倍數說明
遊戲應定義單次 Spin 最大可能獲勝（含所有功能、倍率加成）相對於下注額的倍數。例如 100x 表示下注 1 枚可贏得最高 100 枚。此限制防止遊戲發生意外極限情況。

---

## 第二章：遊戲佈局與核心規格

### 2.1 核心規格表

| 規格項 | Fortune Slots 範例 | 新遊戲 |
|--------|------------------|-------|
| **軸數** | 5 | |
| **列數** | 3 | |
| **總格數** | 15 (5×3) | |
| **賠付模式** | Fixed Paylines | |
| **常駐賠付線數** | 20 | |
| **下注級別數** | 1 | |
| **最小下注** | 1 credit | |
| **最大下注** | 1 credit | |
| **デノミネーション** | 1 credit | |

### 2.2 賠付模式定義

賠付模式定義了遊戲如何計算與支付玩家的獎金。遊戲平台支援多種賠付結構，以適應不同遊戲主題與難度。

#### 2.2.1 Fixed Paylines（固定賠付線）

| 參數 | 說明 | Fortune Slots | 新遊戲 |
|------|------|---|---|
| **paylines_count** | 總賠付線數（固定啟用） | 20 | ___ |
| **paylines_layout** | 賠付線排列方式 | Left-to-Right（從左至右） | ___ |
| **direction_rule** | 匹配方向 | 必須由左軸開始連續向右 | ___ |
| **symbol_substitute** | Wild 替代規則 | Wild 可替代任何非 Scatter 符號 | ___ |
| **scatter_direct_payout** | Scatter 是否直接賠付 | 否（僅觸發 Free Spins） | ___ |

**適用遊戲示例**：經典機制遊戲、Fortune Slots

**優點**：易於理解、獲勝計算透明、容易實現

**缺點**：靈活性較低、獲勝組合有限

---

#### 2.2.2 Multi-Way (243 Ways)

**定義說明**：243 Ways（或稱 Multi-Way）是一種不依賴固定賠付線的賠付結構。遊戲採用 5 軸 × 3 列的標準格局，共 15 個符號位置。不同於傳統賠付線系統，243 Ways 允許玩家在相鄰軸上的**任意列位置**獲得相同符號即可中獎，無需遵循特定的賠付線路徑。

中獎計算方式為：相鄰軸上相同符號的出現位置組合，共形成 3^5 = 243 種不同的獲勝組合。

**評估邏輯（偽代碼）**：
```
function evaluateMultiWayPayouts(grid) {
    payouts = []
    
    // 遍歷每種符號（除了 Scatter）
    for each symbol in [Wild, Crown, Bell, Seven, Cherry, Lemon, Grape] {
        // 計算每軸該符號的出現行數
        matchedRows = []
        
        for reel = 0 to 4 {
            rowsWithSymbol = count positions in grid[reel] that match symbol
            matchedRows[reel] = rowsWithSymbol
        }
        
        // 檢查是否從左至右連續有該符號
        if matchedRows[0] > 0 {
            // 計算連續軸的組合方式
            waysCombination = 1
            consecutiveReels = 0
            
            for reel = 0 to 4 {
                if matchedRows[reel] > 0 {
                    waysCombination *= matchedRows[reel]
                    consecutiveReels++
                } else {
                    break  // 中斷，不連續了
                }
            }
            
            // 根據連續軸數決定是否計入獎金
            if consecutiveReels >= 3 {
                payoutAmount = symbolPayrate[symbol][consecutiveReels] × waysCombination × bet
                payouts.append(payoutAmount)
            }
        }
    }
    
    return sum(payouts)
}
```

**計算公式**：
- 基礎：獎金 = 符號賠率 × 下注額 × ways 係數
- ways 係數 = ∏ 各軸匹配列數
- 範例：5 軸中前 4 軸分別有 [2, 1, 3, 2] 列符合 Bell，第 5 軸無符合
  - 有效軸數 = 4，ways 係數 = 2 × 1 × 3 × 2 = 12
  - 下注 10，Bell 4 連賠率為 50
  - 獎金 = 50 × 10 × 12 = **6000 枚**

| 參數 | 說明 | Fortune Slots | 新遊戲 |
|------|------|---|---|
| **multiway_enabled** | 是否啟用 Multi-Way 模式 | 否 | ___ |
| **ways_count** | 總 Ways 數 | — | 243 |
| **min_consecutive_reels** | 最少連續軸數 | — | 3 |
| **way_coefficient_multiplier** | Ways 係數倍率增幅 | — | 1.0x |
| **symbol_payrate_adjustment** | Multi-Way 模式下賠率調整 | — | 100% |

> **範例：Immortal Romance (Microgaming)**
> 採用 243 Ways 系統。遊戲不使用固定賠付線，玩家任何相鄰軸上同符號出現都能中獎。

**適用遊戲**：Immortal Romance、Thunderstruck、Dark Harbour

---

#### 2.2.3 1024 Ways / 更高 Ways

**定義說明**：1024 Ways（或稱 1024 Paylines）是對 243 Ways 的直接擴展，透過增加列數實現。標準配置為 5 軸 × 4 列，產生 4^5 = 1024 種獲勝組合。更高階的可達 6 軸（如 4096 Ways）。

該模式保持 Multi-Way 的「任意相鄰位置」匹配邏輯，但因為列數增加，同一軸可能有更多符號出現位置，增加了 ways 係數計算的複雜度與獲勝機率。

**計算公式**：
- 基本公式同 Multi-Way：獎金 = 符號賠率 × 下注額 × ∏(軸 i 匹配列數)
- 平均 Ways 係數（1024 Ways）：(4/3)^5 ≈ 4.2（相比 243 Ways 的 1.0）

| 參數 | 說明 | 範例值 | 新遊戲 |
|------|------|---|---|
| **grid_rows** | 遊戲列數 | 4 | ___ |
| **ways_formula** | Ways 計算公式 | rows^reels | ___ |
| **expected_ways** | 期望 Ways 數 | 1024 | ___ |
| **payrate_scaling** | 相對於 243Ways 的賠率調整 | 70% | ___ |
| **hit_frequency_bonus** | 相比低Ways的命中率提升 | +5~8% | ___ |

> **範例：Raging Rhino (WMS)**
> 採用 4,096 Ways（6 軸 × 4 列）。Green Rhino 符號在軸 1~4 分別出現 3、2、1、2 列，ways 係數 = 3 × 2 × 1 × 2 = 12，獎金 = 40 × 10 × 12 = 4800。

**適用遊戲**：Raging Rhino、Chili Gold、High Society

---

#### 2.2.4 Megaways

**定義說明**：Megaways 是由 Big Time Gaming 開發的動態賠付模式。每軸的行數（2~7 行）每次 Spin 都會隨機變化，導致每 Spin 獲勝方式總數不固定（通常 324~117,649 Ways）。Megaways 還支援「Reel Modifiers」（軸修飾符），如 Cascading Reels（掉落式重組）和 Mystery Symbols（謎之符號）。

**核心特性**：
- **動態軸行數**：每軸行數隨機 2~7（或自訂範圍）
- **Ways 公式**：ways = ∏ 各軸行數（每次變化）
- **Cascading Reels**：已中獎符號消失，上方符號下落補位，可連鎖獲勝
- **Mystery Symbols**：隨機位置的符號在評估時轉換為同一個符號

**評估邏輯**：與 Multi-Way 相同，但每次 Spin 首先隨機生成各軸的行數。

| 參數 | 說明 | 典型值 | 新遊戲 |
|------|------|---|---|
| **megaways_enabled** | 是否啟用 Megaways | — | true / false |
| **reel_rows_min** | 每軸最少行數 | 2 | ___ |
| **reel_rows_max** | 每軸最多行數 | 7 | ___ |
| **cascading_enabled** | 是否啟用掉落式 | — | true / false |
| **mystery_symbol_enabled** | 是否啟用謎之符號 | — | true / false |
| **expected_ways_avg** | 平均 Ways 數 | 約 50,000 | ___ |

> **範例：Bonanza (Big Time Gaming)**
> 採用 Megaways。每軸行數隨機 2~7。Spin 結果：軸 1~5 分別為 [4, 5, 3, 6, 4] 行，ways = 4×5×3×6×4 = 1440。掉落式機制啟動，消失的符號被新符號補位，形成連鎖獲勝。

**適用遊戲**：Bonanza、Sweet Bonanza、Gates of Olympus

---

#### 2.2.5 Cluster Pays

**定義說明**：Cluster Pays 是一種完全不同的賠付模式，取消了傳統的「軸」和「行」概念。遊戲顯示一個 N × M 的網格（如 5×5 或 6×6），玩家需要集中相同符號（通常最少 4 個）形成垂直或水平的相鄰群組（Cluster）才能中獎。Cluster 符號消失後，上方符號下落，可引發連鎖 Cascades。

**核心特性**：
- **自由網格佈局**：無固定軸列概念
- **相鄰性判定**：符號必須水平或垂直相鄰，不計對角
- **最小群組大小**：通常需 4 個以上相同符號
- **Cascading**：中獎符號消失，上方符號下落補位

| 參數 | 說明 | 典型值 | 新遊戲 |
|------|------|---|---|
| **cluster_pays_enabled** | 是否啟用 Cluster Pays | — | true / false |
| **grid_width** | 網格寬度（軸數） | 5 或 6 | ___ |
| **grid_height** | 網格高度（列數） | 5 或 6 | ___ |
| **min_cluster_size** | 最少相鄰符號數 | 4 | ___ |
| **cascade_enabled** | 是否啟用下落式補位 | — | true |
| **symbol_multiplication** | Cluster 大小是否影響倍率 | — | true / false |

**獎金計算**：
- 基礎：獎金 = 符號基礎賠率 × 下注額 × Cluster Size Multiplier
- Cluster Size Multiplier：4個=1.0x，5個=1.5x，6個=2.0x（範例）

> **範例：Sweetfall (Thunderkick)**
> 採用 5×5 Cluster Pays 網格。Scatter 4 個相鄰符號觸發 Free Spins，且每個 Cascade 會增加倍率（1x → 2x → 3x...）。

**適用遊戲**：Jammin' Jars、Sweetfall、Beowulf

---

#### 2.3 符號賠率表（Symbol Payout Table）

標準 5×3 格局賠率定義範例：

| 符號名稱 | 權重 | 3 連 | 4 連 | 5 連 | 說明 |
|---------|------|------|------|------|------|
| Wild | 2 | 40 | 100 | 300 | 高價值，替代能力強 |
| Scatter | 3 | - | - | - | 無直接賠付，觸發 Free Spins |
| Crown | 4 | 25 | 70 | 200 | 觸發 Bonus Game（3 連） |
| Bell | 6 | 15 | 50 | 125 | 中價值符號 |
| Seven | 8 | 12 | 35 | 100 | 中價值符號 |
| Cherry | 10 | 8 | 25 | 75 | 低價值符號 |
| Lemon | 14 | 5 | 15 | 50 | 低價值符號 |
| Grape | 14 | 3 | 8 | 40 | 最低價值符號 |

**填寫指南**：
- 權重越低 → 越稀有 → 賠率越高
- 3 連賠率建議為 Bet 的 10~100 倍
- 5 連賠率應為 3 連的 5~10 倍
- Crown 如有特殊功能（觸發 Bonus），可設定特殊標記

#### 2.4 賠付計算公式

基礎公式：
```
獎金 = 下注額 × 符號賠率 × 特殊倍率（如 Free Spins 3x）
```

例如 Fortune Slots：
- 下注 10 枚，5 個 Wild 連線 → 10 × 300 × 1 = **3000 枚**
- Free Spins 中 4 個 Bell 連線 → 10 × 50 × 3 = **1500 枚**（3x 倍率）

**新遊戲需定義**：
- 是否支援連線倍率（如 Free Spins 的 3x）
- 是否支援累進倍率機制
- 特殊獎金（Bonus、Jackpot）如何計算

#### 2.5 RTP 目標與分配

| 來源 | 預期 RTP | Fortune Slots | 新遊戲 |
|------|---------|---|---|
| Base Game | ~50~60% | 56.5% | ___ |
| Free Spins | ~20~35% | 29.5% | ___ |
| Bonus Game | ~5~15% | 10.2% | ___ |
| **總 RTP** | **95.5~96.5%** | **96.29%** | ___ |

---

## 第三章：符號系統

### 3.1 符號定義表

| 符號 ID | 符號名稱 | 類型 | 權重 | Fortune Slots 賠率 | 新遊戲賠率 |
|---------|----------|------|------|------------------|----------|
| 1 | Wild | 特殊 | 2 | 3連40/4連100/5連300 | |
| 2 | Scatter | 特殊 | 3 | 不賠（觸發FS） | |
| 3 | Crown | 普通 | 4 | 3連25/4連70/5連200 | |
| 4 | Bell | 普通 | 6 | 3連15/4連50/5連125 | |
| 5 | Seven | 普通 | 8 | 3連12/4連35/5連100 | |
| 6 | Cherry | 普通 | 10 | 3連8/4連25/5連75 | |
| 7 | Lemon | 普通 | 14 | 3連5/4連15/5連50 | |
| 8 | Grape | 普通 | 14 | 3連3/4連8/5連40 | |

**合計符號數**：8
**特殊符號**：Wild（可替代）、Scatter（觸發 Free Spins）
**Bonus 符號**：Crown（3連線觸發 Bonus Game）

### 3.2 Wild 替代規則（Standard Mode）

#### 基本替代
- **可替代目標**：除 Scatter 外所有符號
- **不可替代**：Scatter
- **賠率**：Wild 符號自身賠率（見上表）
- **示例**：Wild + Bell + Bell 在同一賠付線 = Bell 3連賠率

#### 多個 Wild 組成連線
- 當同一賠付線包含多個 Wild 時，按 Wild 本身賠率計算
- 示例：[Wild, Wild, Wild, Bell, Bell] → Wild 3連賠率（40倍）

### 3.3 Wild 行為模式進階

Wild 符號是遊戲平台中的關鍵替代符號，不同的 Wild 配置會大幅改變遊戲體驗與難度。本節定義多種 Wild 行為模式，供新遊戲選擇或自訂。

#### 3.3.1 Wild 配置參數表

| 參數 | 說明 | Fortune Slots | 新遊戲 |
|------|------|---|---|
| **wild_weight** | Wild 在 Reel Strip 中的權重 | 2 | ___ |
| **wild_appearance_mode** | Wild 出現模式 | Normal（正常） | ___ |
| **wild_substitute_rule** | Wild 替代規則 | 非 Scatter/Crown | ___ |
| **wild_per_reel_limit** | 每軸 Wild 最多數量 | 1 | ___ |
| **wild_special_effect** | Wild 是否有特殊視覺效果 | 是（光暈） | ___ |
| **wild_modifier** | Wild 是否改變賠率 | 否 | ___ |

#### 3.3.2 Wild 出現模式選項

| 模式 | 說明 | 適用遊戲 |
|------|------|---------|
| **Normal** | Wild 均勻分佈在 Reel Strip 中 | Fortune Slots、經典遊戲 |
| **Sticky Wild** | Wild 停留到下一回合不消失 | 高刺激感遊戲 |
| **Expanding Wild** | Wild 擴展覆蓋整軸 | 大獎機制遊戲 |
| **Walking Wild** | Wild 每回合向下移動一格 | 進階機制遊戲 |
| **Multiplier Wild** | Wild 增加獲勝倍率 | 倍率驅動遊戲 |
| **Stacked Wild** | 多個 Wild 垂直堆疊在同軸 | 高波動遊戲 |
| **Colossal Wild** | Wild 佔據多格（如 2×2） | 大獎機制遊戲 |

> **範例：Sticky Fortune（假設）**
> 採用 Sticky Wild 模式。當遊戲進入 Free Spins 時，任何 Wild 在該回合保持，進入下一回合前位置向下移動一格。若 Wild 移出底部，消失並重新觸發 Free Spins（最多 3 次）。

> **範例：Wild Garden Cascade**
> 採用 Expanding Wild + Cascading Reel 組合。當某軸出現 Wild 時，該軸自動擴展為全 Wild。同時啟動 Cascade 機制（已中獎符號消失，上方符號下落補位），可形成連鎖獲勝。

#### 3.3.3 Sticky Wild（粘性 Wild）

**特性**：
- Wild 停留在原位置，進入下一 Spin 不消失
- 可選：每回合 Wild 位置向下移動（Walking）或保持不動
- 通常在 Free Spins 或 Bonus Feature 中觸發

**視覺效果**：Sticky Wild 應有特殊標記（如邊框或背景色差異）

| 參數 | 說明 | 範例值 |
|------|------|-------|
| **sticky_wild_enabled** | 是否啟用 | true / false |
| **sticky_reel_limit** | 單軸最多 Sticky Wild 數 | 3 |
| **sticky_removal_trigger** | Sticky 消失條件 | "無獲勝" / "超時回合數" |

#### 3.3.4 Expanding Wild（擴張 Wild）

**特性**：
- Wild 符號出現時自動擴展為覆蓋整軸的全 Wild
- 增加該軸上連線匹配的機率

| 參數 | 說明 | 範例值 |
|------|------|-------|
| **expanding_wild_enabled** | 是否啟用 | true / false |
| **expansion_direction** | 擴張方向 | "vertical" / "horizontal" / "full_reel" |
| **expanding_multiplier** | 擴張 Wild 的獲勝倍率加成 | 1.0x / 1.5x / 2.0x |

#### 3.3.5 Walking Wild（行走 Wild）

**特性**：
- Wild 每回合向下（或左右）移動一格
- 通常在 Free Spins 中出現，創造動態動畫效果

| 參數 | 說明 | 範例值 |
|------|------|-------|
| **walking_wild_enabled** | 是否啟用 | true / false |
| **walking_direction** | 移動方向 | "down" / "up" / "left" / "right" |
| **walking_steps_per_spin** | 每次 Spin 移動格數 | 1 / 2 |
| **walking_removal_trigger** | 移出邊界後的動作 | "disappear" / "wrap_around" |

#### 3.3.6 Multiplier Wild（倍率 Wild）

**特性**：
- Wild 不僅替代符號，還增加該連線獲勝的倍率
- 示例：Wild 參與的連線獎金 × 2

| 參數 | 說明 | 範例值 |
|------|------|-------|
| **multiplier_wild_enabled** | 是否啟用 | true / false |
| **multiplier_value** | 倍率值 | 1.5x / 2.0x / 3.0x |
| **multiplier_stacking** | 多個 Wild 倍率是否疊加 | true / false |

#### 3.3.7 Stacked Wild（堆疊 Wild）

**特性**：
- 多個 Wild 垂直堆疊在同軸的同列（如 2 個或 3 個）
- 增加填滿整軸的機率，提升大獎可能性

| 參數 | 說明 | 範例值 |
|------|------|-------|
| **stacked_wild_enabled** | 是否啟用 | true / false |
| **stack_size_min** | 最少堆疊數 | 2 |
| **stack_size_max** | 最多堆疊數 | 3 / 4 |
| **stack_position** | 堆疊位置 | "random" / "top" / "bottom" |

#### 3.3.8 Colossal Wild（巨型 Wild）

**特性**：
- Wild 佔據多個格子（如 2×2、3×3）
- 大幅增加匹配機率，通常伴隨大獎

| 參數 | 說明 | 範例值 |
|------|------|-------|
| **colossal_wild_enabled** | 是否啟用 | true / false |
| **colossal_size** | 巨型尺寸 | "2x2" / "2x3" / "3x3" |
| **colossal_trigger_condition** | 觸發條件 | "random" / "scatter_trigger" / "free_spins" |

### 3.4 Scatter 觸發機制

- **觸發條件**：任意位置（無需左至右）3 個及以上 Scatter
- **觸發次數**：
  - 3 個 Scatter → 8 次 Free Spins
  - 4 個 Scatter → 12 次 Free Spins
  - 5 個 Scatter → 18 次 Free Spins
- **倍率**：所有 Free Spins 中獎 × 3
- **重新觸發**：Free Spins 中再觸發 Scatter 可追加次數
- **視覺效果**：Scatter 顯示 cyan 脈衝光暈，延遲 2 秒後顯示 Free Spins Intro overlay

### 3.5 Bonus 觸發機制

- **觸發條件**：Crown 3 連線（需在同一賠付線上左至右連續）
- **觸發遊戲**：Bonus Game（12 寶箱選 3）
- **視覺效果**：Crown 顯示 gold 脈衝光暈，延遲 2 秒後顯示 Bonus Intro overlay
- **獎金方式**：見第六章 6.3

### 3.6 每列符號限制

- **限制規則**：同一列（column）最多只能出現 1 個特殊符號（Wild、Scatter、Crown 合計）
- **目的**：避免過度堆疊特殊符號導致遊戲過度波動
- **實現位置**：`rng.js` 的 `generateGrid()` 方法

---

## 第四章：隨機機制

### 4.1 Reel Strip 定義

Reel Strip 是每軸上的固定符號序列，隨機選取停止位置時，取連續 3 個符號作為該軸結果。

**Fortune Slots Reel Strip 範例**（符號 ID）：

| 軸 | Strip 長度 | 符號序列範例 | 新遊戲 |
|----|-----------|----------|-------|
| 軸 1 | 28 | [1,2,3,4,5,6,7,8,1,2,4,5,...] | |
| 軸 2 | 32 | [2,3,4,5,6,7,8,1,2,3,4,5,...] | |
| 軸 3 | 28 | [3,4,5,6,7,8,1,2,3,4,5,6,...] | |
| 軸 4 | 30 | [4,5,6,7,8,1,2,3,4,5,6,7,...] | |
| 軸 5 | 34 | [5,6,7,8,1,2,3,4,5,6,7,8,...] | |

**設計原則**：
- 長度應在 28~34 之間
- 各軸長度應不同，避免週期共振
- 符號分佈應符合權重定義
- 修改 Strip 時需重新驗證 RTP

### 4.2 Grid 生成邏輯

```
1. 初始化 5 軸，每軸有一個「當前停止位置」（0~Strip.length-1）
2. 對每軸執行隨機停止：
   - 生成隨機位置 position = RNG.random(0, stripLength)
   - 取該軸的 3 個連續符號：
     symbols = [strip[position], strip[(position+1)%stripLength], strip[(position+2)%stripLength]]
3. 檢查每列符號限制：
   - 若同一列出現多於 1 個特殊符號（Wild/Scatter/Crown），重新生成該軸
4. 返回 5×3 Grid（15 個符號）
```

**偽代碼**：
```javascript
generateGrid() {
  let grid = [];
  for (let reel = 0; reel < 5; reel++) {
    let position = RNG.random(0, this.REEL_STRIPS[reel].length);
    let symbols = [];
    for (let row = 0; row < 3; row++) {
      let idx = (position + row) % this.REEL_STRIPS[reel].length;
      symbols.push(this.REEL_STRIPS[reel][idx]);
    }
    // 檢查每列符號限制（已實現於 Fortune Slots）
    grid.push(symbols);
  }
  return grid;
}
```

### 4.3 公平性保障

- **RNG 種子初始化**：使用 `Math.random()`（瀏覽器提供的加密安全隨機）
- **RTP 驗證**：Monte Carlo 模擬 500 萬次 spin，統計總中獎 / 總下注，確保落在目標 ±0.5% 內
- **驗證工具**：`rtp-verify.js`（Node.js）
- **驗證頻率**：每次修改符號賠率或 Reel Strip 後必須驗證
- **驗證命令**：`node rtp-verify.js`

---

## 第五章：賠付計算

### 5.1 賠付線定義格式

20 條賠付線定義於 `config.js` 的 `PAYLINES` 陣列。每條線定義為 5 個整數，代表 5 軸上的列號（0=上、1=中、2=下）。

**Fortune Slots 賠付線示例**：

| 線 ID | 軸 1 | 軸 2 | 軸 3 | 軸 4 | 軸 5 | 新遊戲 |
|-------|------|------|------|------|------|-------|
| 1 | 0 | 0 | 0 | 0 | 0 | |
| 2 | 1 | 1 | 1 | 1 | 1 | |
| 3 | 2 | 2 | 2 | 2 | 2 | |
| 4 | 0 | 1 | 2 | 1 | 0 | |
| 5 | 2 | 1 | 0 | 1 | 2 | |
| ... | ... | ... | ... | ... | ... | |
| 20 | 1 | 0 | 1 | 2 | 1 | |

（共 20 條，按標準 5-reel 3-row slot 排列）

### 5.2 匹配規則

1. **方向**：由左至右（軸 1→軸 5）
2. **連續性**：符號必須在連續軸上匹配
3. **Wild 替代**：Wild 可替代除 Scatter 外任何符號
4. **匹配數量**：
   - 3 連：軸 1~3 或更短連續段也可計算
   - 4 連：軸 1~4
   - 5 連：軸 1~5
5. **Scatter 不計**：Scatter 不參與賠付線評估（只觸發 Free Spins）

**示例**：
- 線上符號：[Bell, Bell, Wild, Bell, Cherry]
- Wild 替代 Cherry，形成 Bell 4 連（軸 1~4）

---


## 第六章：模組化特殊功能

所有特殊功能遵循統一的生命週期模型。

### 6.1 功能模組生命週期

```
觸發 → 初始化 → 執行 → 結算 → 整合回 Base Game
```

| 階段 | 說明 | 函式 | 狀態 |
|------|------|------|------|
| **觸發**（Trigger） | 條件符合時觸發功能 | `Features.triggerFeature()` | FEATURE_PENDING |
| **初始化**（Init） | 功能所需的初始化設定 | `Features.startFeature()` | RUNNING |
| **執行**（Execution） | 功能主要迴圈邏輯 | `Features.update()` + 相關回呼 | RUNNING |
| **結算**（Payout） | 計算該功能產生的獎金 | `Features.calculatePayout()` | SHOWING_WINS |
| **整合**（Resume） | 將獎金整合回 Base Game 狀態 | `Features.resume()` | IDLE |

### 6.2 Free Spins 模組

#### 6.2.1 基本 Free Spins

**觸發條件**：3 個或以上 Scatter 符號出現（不限賠付線）

| 參數 | 說明 | Fortune Slots | 新遊戲 |
|------|------|---|---|
| **scatter_threshold_3** | 3 個 Scatter 觸發次數 | 8 次 | ___ |
| **scatter_threshold_4** | 4 個 Scatter 觸發次數 | 12 次 | ___ |
| **scatter_threshold_5** | 5 個 Scatter 觸發次數 | 18 次 | ___ |
| **free_spins_multiplier** | Free Spins 期間獲勝倍率 | 3x | ___ |
| **retrigger_enabled** | 是否可重新觸發 | 是 | ___ |
| **max_retrigger_count** | 最多重新觸發次數 | 無限制 | ___ |
| **scatter_frame_highlight** | Scatter 是否有框選高亮 | 是（青色脈衝） | ___ |
| **highlight_duration** | 高亮持續時間 | 2 秒 | ___ |

**實作流程**：
1. 檢測 Scatter 符號數量
2. 根據數量決定 Free Spins 次數
3. 顯示 cyan 脈衝光暈 2 秒
4. 進入 Free Spins 模式（獲勝 × 3 倍率）
5. Free Spins 完成後回到 Base Game

> **範例：Fortune Slots**
> 5 個 Scatter 觸發 18 次 Free Spins，每次中獎獎金 × 3。如果 Free Spins 中再觸發 3 個 Scatter，追加 8 次。

#### 6.2.2 Progressive Multiplier Free Spins

**特性**：每完成一次 Free Spins Cascade 或一輪中獎時，倍率遞增

| 參數 | 說明 | 範例值 |
|------|------|-------|
| **progressive_multiplier_enabled** | 是否啟用 | true / false |
| **multiplier_start** | 初始倍率 | 1x |
| **multiplier_increment** | 每輪遞增值 | +0.5x / +1.0x |
| **multiplier_max** | 最大倍率上限 | 10x / 15x |

> **範例：Game of Thrones (Microgaming)**
> Free Spins 初始 1x 倍率，每形成一次 Cascade 遞增 1x，最高達 5x。

#### 6.2.3 Sticky Wild Free Spins

**特性**：Free Spins 期間 Wild 符號粘留，不隨著 Spin 消失

參考第 3.3.3 節 Sticky Wild 機制。

#### 6.2.4 Reel Modifier Free Spins

**特性**：Free Spins 期間某些軸或符號受到修飾（如擴張、冷凍等）

| 修飾類型 | 說明 | 實例 |
|---------|------|------|
| **Frozen Reel** | 某軸在 FS 期間固定不動 | Sweet Bonanza |
| **Expanding Reel** | 某軸 Spin 時自動擴張為全符號 | Bonanza |
| **Symbol Replace** | 某符號自動替換為更高價值符號 | 自訂遊戲 |

#### 6.2.5 Pick-Your-Bonus Free Spins

**特性**：觸發 Free Spins 時，玩家先選擇不同的 FS 套餐

| 套餐示例 | FS 次數 | 倍率 | 特殊機制 |
|---------|-------|------|---------|
| **保守** | 20 次 | 1x | 無 |
| **平衡** | 10 次 | 2x | Sticky Wild |
| **冒險** | 5 次 | 5x | Expanding Wild |

### 6.3 Bonus Game

**觸發條件**：Crown 3 連線（需在同一賠付線上左至右連續）

| 參數 | 說明 | Fortune Slots | 新遊戲 |
|------|------|---|---|
| **bonus_trigger_symbol** | 觸發符號 | Crown | ___ |
| **bonus_trigger_count** | 觸發數量 | 3 連 | ___ |
| **bonus_grid_size** | 寶箱網格 | 12 格 | ___ |
| **bonus_pick_count** | 選擇寶箱數 | 3 個 | ___ |
| **bonus_frame_highlight** | Crown 是否有高亮 | 是（金色脈衝） | ___ |
| **highlight_duration** | 高亮持續時間 | 2 秒 | ___ |

**實作流程**：
1. 檢測 Crown 連線（3 個）
2. 顯示 gold 脈衝光暈 2 秒
3. 進入 Bonus Game（12 寶箱選 3）
4. 每選一個寶箱揭示獎金
5. 累計 3 個寶箱的獎金，回到 Base Game

> **範例：Fortune Slots**
> 12 個寶箱，玩家選 3 個，每個寶箱內獎金隨機 50~500 倍，累計後支付。

### 6.4 Jackpot 機制

**種子金額**：5000 倍 Bet

| 參數 | 說明 | Fortune Slots | 新遊戲 |
|------|------|---|---|
| **jackpot_seed** | 初始種子 | 5000x | ___ |
| **jackpot_contribution** | 每注貢獻比例 | 10% | ___ |
| **jackpot_trigger_odds** | 觸發機率 | 1/50000 | ___ |
| **jackpot_trigger_condition** | 觸發條件 | 隨機 | ___ |
| **jackpot_accumulation_method** | 累積方式 | 全局累積 | ___ |

**邏輯**：
- 每次 Spin，該注額的 10% 貢獻到 Jackpot 池
- 隨機檢查是否觸發 Jackpot（1/50000 機率）
- 若觸發，玩家獲得當前 Jackpot 金額

### 6.5 Cascading / Tumble Reels

**特性**：已中獎的符號消失，上方符號下落補位，可形成連鎖中獎

| 參數 | 說明 | 範例值 |
|------|------|-------|
| **cascading_enabled** | 是否啟用 | true / false |
| **cascade_repeat_limit** | 最多 Cascade 次數 | 無限 / 10 次 |
| **cascade_multiplier_increment** | 倍率遞增值 | +0.5x / +1.0x |
| **falling_animation_speed** | 下落速度（ms） | 300 / 500 |

### 6.6 Hold and Spin

**特性**：玩家可「持住」某些符號，重新 Spin 其他軸，追求更多相同符號

| 參數 | 說明 | 範例值 |
|------|------|-------|
| **hold_spin_enabled** | 是否啟用 | true / false |
| **holdable_symbols** | 可持住的符號 | "Scatter" / "Gold" |
| **hold_spins_remaining** | 持住後還能 Spin 次數 | 3 / 5 |
| **hold_success_condition** | 成功條件 | "集滿特定符號" |

### 6.7 Gamble / Double-Up

**特性**：玩家可選擇賭博（翻倍或失去）已獲得的獎金

| 參數 | 說明 | 範例值 |
|------|------|-------|
| **gamble_enabled** | 是否啟用 | true / false |
| **gamble_win_condition** | 贏的條件 | "猜對卡色" / "猜對卡點" |
| **gamble_multiply** | 贏時倍數 | 2x |
| **gamble_max_rounds** | 最多連賭次數 | 5 / 無限 |
| **gamble_max_stake** | 最大可賭金額 | 當前獎金 / 上限 |

### 6.8 Buy Feature

**特性**：玩家可直接花費額外 Bet 購買特定功能（如立即進入 Free Spins）

| 參數 | 說明 | 範例值 |
|------|------|-------|
| **buy_feature_enabled** | 是否啟用 | true / false |
| **buyable_features** | 可購買功能列表 | "Free Spins" / "Bonus Game" |
| **buy_cost_multiplier** | 購買成本（相對 Bet） | 100x / 50x |
| **buy_guarantee** | 購買後是否保證觸發 | true / false |

### 6.9 Progressive Feature

**特性**：功能的獎金或倍率跨越多個 Spin 逐漸累積

| 參數 | 說明 | 範例值 |
|------|------|-------|
| **progressive_feature_enabled** | 是否啟用 | true / false |
| **progressive_pool_type** | 累積池類型 | "global" / "session" |
| **progressive_contribution_rate** | 每注貢獻率 | 2% / 5% |
| **progressive_trigger_condition** | 觸發條件 | "特定符號組合" |

### 6.10 功能組合規則

多個特殊功能可組合啟用，但需遵循以下規則：

| 組合 | 相容性 | 說明 |
|------|-------|------|
| Free Spins + Sticky Wild | ✓ | 常見組合，互相增強 |
| Free Spins + Cascading | ✓ | 增加連鎖機率 |
| Bonus Game + Hold and Spin | ✓ | Bonus 內實施 Hold and Spin |
| Jackpot + 任何功能 | ✓ | 獨立觸發，不衝突 |
| Cascading + Expanding Wild | ✓ | 視覺效果豐富 |
| Free Spins + Buy Feature | ⚠ | 可選，需平衡 RTP |
| Buy Feature + Gamble | ✗ | 衝突，不同時啟用 |

---

## 第七章：RTP 與數學模型

### 7.1 RTP 目標與組成

| 來源 | 預期比例 | Fortune Slots 實測 | 新遊戲 |
|------|---------|-----------------|-------|
| Base Game | ~50~60% | 56.5% | ___ |
| Free Spins | ~20~35% | 29.5% | ___ |
| Bonus Game | ~5~15% | 10.2% | ___ |
| Jackpot | ~0~5% | 0% | ___ |
| **總 RTP** | **95.5~96.5%** | **96.29%** | ___ |

### 7.2 波動度（Volatility）

波動度衡量遊戲獎金的變動幅度。高波動度遊戲獲勝頻率低但獎金大，低波動度反之。

| 指標 | 低波動度 | 中波動度 | 高波動度 | 極高波動度 |
|------|---------|---------|---------|----------|
| **Hit Frequency** | >30% | 20~30% | 15~20% | <15% |
| **平均獲勝倍數** | 0.5~2x | 1~5x | 2~20x | 5~100x+ |
| **最大單次獎勝** | <50x | <200x | <1000x | >1000x |
| **推薦玩家** | 保守 | 一般 | 冒險 | 極限 |

**計算公式**：
```
Volatility = sqrt(E[X²] - E[X]²)
其中 X 為每次 Spin 的獎金額
```

### 7.3 Hit Frequency（命中率）

命中率定義為玩家獲得任何獎金的 Spin 百分比（至少贏得下注額的返還）。

| 命中率範圍 | 含義 | 遊戲體驗 |
|--------|------|---------|
| **>35%** | 非常高 | 幾乎每 3 Spin 都贏 |
| **25~35%** | 高 | 平均每 3~4 Spin 贏一次 |
| **15~25%** | 中 | 平均每 4~7 Spin 贏一次（Fortune Slots: ~25%） |
| **10~15%** | 低 | 平均每 7~10 Spin 贏一次 |
| **<10%** | 極低 | 長期無獲勝期很常見 |

### 7.4 Max Win Cap（最大獲勝限制）

為防止遊戲發生異常情況（如 Bug 導致過度倍率疊加），應設定單次 Spin 的最大可能獲勝。

| 遊戲類型 | 建議上限 | 例子 |
|---------|---------|------|
| **低波動度** | 50~100x Bet | 輕鬆遊戲 |
| **中波動度** | 100~500x Bet | Fortune Slots (100x) |
| **高波動度** | 500~2000x Bet | Megaways 遊戲 |
| **極高波動度** | >2000x Bet | Big Win 遊戲 |

**實現**：在計算最終獎金時，若超過上限則截斷至上限值。

### 7.5 RTP 驗證方法

**工具**：`rtp-verify.js`（Node.js）

**流程**：
1. 執行 500 萬次模擬 Spin
2. 累計總獲勝 & 總下注
3. 計算 RTP = 總獲勝 / 總下注 × 100%
4. 檢查是否落在目標 ±0.5% 範圍內

**命令**：
```bash
node rtp-verify.js
```

**輸出範例**：
```
=== RTP Verification Results ===
Total Spins: 5,000,000
Total Wagered: 50,000,000 credits
Total Winnings: 48,145,000 credits
RTP: 96.29%
Status: ✓ PASS (Target: 96.0% ±0.5%)
```

### 7.6 各機制 RTP 貢獻比例

設計多功能遊戲時，應規劃各機制的 RTP 貢獻：

| 機制 | 目標 RTP 貢獻 | 實現方式 |
|------|-------------|---------|
| Base Game 賠付線 | ~40% | 調整符號賠率與權重 |
| Base Game 特殊連線 | ~10~15% | Wild、Scatter 組合 |
| Free Spins 觸發 & 執行 | ~25~35% | 調整倍率（3x）與重觸發機率 |
| Bonus Game | ~5~15% | 調整寶箱獎金範圍 |
| Jackpot | ~0~5% | 調整種子 & 觸發機率 |
| Cascading 加成 | ~0~5% | 調整級聯倍率 |

### 7.7 調整注意事項

- **分別驗證各機制**：先驗證 Base Game，再加 Free Spins，最後加 Bonus
- **修改賠率與 Strip 平衡**：同時改兩者會導致 RTP 計算複雜，盡量只改其一
- **測試邊界情況**：確保 Max Win Cap 邏輯不影響 RTP 統計
- **考量時間因素**：某些機制（如 Jackpot 累積）跨越多日，需長期驗證

---

## 第八章：配色系統

（內容保留自 v1.0）

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

---

## 第九章～第十章

（內容保留自 v1.0，略）

---

## 第十一章：動畫規格

### 11.1~11.3 基本動畫

（內容保留自 v1.0，略）

### 11.4 Cascading Symbols 動畫

當 Cascade 機制觸發時：

1. **消失動畫**（150ms）：已中獎符號淡出或縮小
2. **下落動畫**（300~500ms）：上方符號垂直下落，速度逐漸加快
3. **著地效果**（100ms）：符號著地時輕微彈跳與音效
4. **新符號出現**（200ms）：頂部出現新符號，淡入或滑入

### 11.5 Expanding Wild 動畫

當 Expanding Wild 觸發時：

1. **延伸動畫**（300ms）：Wild 從單格逐漸擴張至整軸，邊框放大
2. **光環效果**：擴張期間加強發光強度
3. **完成效果**：整軸變為 Wild，添加特殊視覺標記

### 11.6 Walking Wild 動畫

每個 Spin 中 Walking Wild 的動畫：

1. **移動補間**（500ms）：Wild 從目前位置垂直平移一格
2. **指示方向**：方向箭頭或發光路徑指示移動方向
3. **消失/重置**：移出邊界時淡出或包裹至另一邊

### 11.7 Sticky Wild 動畫

Sticky Wild 在 Free Spins 中的視覺表現：

1. **持留標記**：邊框或背景色區分於普通 Wild
2. **脈衝效果**：輕微的持續脈衝，表示它會保留
3. **計時器**（可選）：顯示還將保留多少回合

---

## 第十二章：音效規格

### 12.1~12.3 基本音效

（內容保留自 v1.0，略）

### 12.4 音效主題設計框架

新遊戲可根據主題選擇或設計音效框架：

#### 主題框架選項

| 主題 | 特徵 | 適用遊戲 |
|------|------|---------|
| **古典歌劇** | 小提琴、鋼琴、弦樂 | 高級主題遊戲 |
| **電子合成** | 合成器、電子鼓、環境音效 | 科技/未來主題 |
| **民族風格** | 傳統樂器、打擊樂 | 地域主題遊戲 |
| **搖滾/流行** | 電吉他、貝斯、鼓組 | 青年向遊戲 |
| **放鬆環境音** | 自然聲音、鋼琴、琶音 | 放鬆向遊戲 |
| **奇幻/動作** | 管樂、打擊、弦樂混合 | 冒險主題遊戲 |

#### 音效設計清單

| 場景 | 音效需求 | Fortune Slots 方案 | 新遊戲方案 |
|------|---------|-----------------|----------|
| BGM（Base Game） | 4層程序化生成，100 BPM | ✓ | ___ |
| BGM（Free Spins） | 提速至 130 BPM，調性變化 | ✓ | ___ |
| Spin 開始 | 短促音效 | ✓ | ___ |
| Reel 停止 | 個別軸停止音 | ✓ | ___ |
| 小獲勝 | 輕快旋律 | ✓ | ___ |
| 大獲勝 | 勝利樂曲 | ✓ | ___ |
| Free Spins 觸發 | 特殊音效 + 轉場 | ✓ | ___ |
| Bonus Game 進入 | 戲劇化樂曲 | ✓ | ___ |
| Jackpot 觸發 | 獨特高潮音樂 | ✓ | ___ |

---

## 第十三章～第十五章

（內容保留自 v1.0，略）

---

## 附錄 A～C

（內容保留自 v1.0，略）

---

## 附錄 D：進階機制速查表

本速查表整理所有 v2.0 新增與擴展的遊戲機制，便於快速參考與選擇。

### D.1 賠付模式速查

| 機制名稱 | 一句話說明 | 適用波動度 | 參考章節 | 複雜度 |
|---------|-----------|----------|--------|-------|
| **Fixed Paylines** | 固定 20 條賠付線，左至右匹配 | 任何 | 2.2.1 | ★☆☆ |
| **243 Ways** | 5軸3列，相鄰位置任意匹配 | 中~高 | 2.2.2 | ★★☆ |
| **1024 Ways** | 5軸4列，ways係數更高 | 高 | 2.2.3 | ★★☆ |
| **Megaways** | 軸行數動態變化，每次 ways 不同 | 極高 | 2.2.4 | ★★★ |
| **Cluster Pays** | 5×5網格，相鄰符號群聚觸發 | 高~極高 | 2.2.5 | ★★★ |

### D.2 Wild 行為模式速查

| 機制名稱 | 一句話說明 | 適用波動度 | 參考章節 | 複雜度 |
|---------|-----------|----------|--------|-------|
| **Standard Wild** | 基礎替代能力，無特殊行為 | 任何 | 3.2 | ★☆☆ |
| **Sticky Wild** | Wild 保留到下一 Spin | 高 | 3.3.3 | ★★☆ |
| **Expanding Wild** | Wild 自動擴張至整軸 | 高 | 3.3.4 | ★★☆ |
| **Walking Wild** | Wild 每 Spin 移動一格 | 高 | 3.3.5 | ★★★ |
| **Multiplier Wild** | Wild 增加獲勝倍率 | 中~高 | 3.3.6 | ★★☆ |
| **Stacked Wild** | 多個 Wild 垂直堆疊 | 高 | 3.3.7 | ★★☆ |
| **Colossal Wild** | Wild 佔據多格（如 2×2） | 極高 | 3.3.8 | ★★★ |

### D.3 特殊功能速查

| 機制名稱 | 一句話說明 | 適用波動度 | 參考章節 | 複雜度 |
|---------|-----------|----------|--------|-------|
| **Free Spins** | 觸發後進入倍率增強回合 | 任何 | 6.2.1 | ★☆☆ |
| **Progressive FS** | Free Spins 期間倍率遞增 | 中~高 | 6.2.2 | ★★☆ |
| **Bonus Game** | 寶箱選擇遊戲，揭示獎金 | 中 | 6.3 | ★★☆ |
| **Jackpot** | 全局累積獎池，隨機觸發 | 任何 | 6.4 | ★★☆ |
| **Cascading** | 中獎符號消失，上方下落補位 | 高 | 6.5 | ★★☆ |
| **Hold and Spin** | 玩家持住符號後重新 Spin | 高 | 6.6 | ★★★ |
| **Gamble** | 獲勝後可賭博翻倍或失去 | 任何 | 6.7 | ★★☆ |
| **Buy Feature** | 花費額外 Bet 購買功能 | 任何 | 6.8 | ★★☆ |
| **Progressive Feature** | 跨越多 Spin 累積的功能 | 高 | 6.9 | ★★★ |

### D.4 機制組合建議

#### 低波動度遊戲
推薦組合：
- 賠付模式：Fixed Paylines
- Wild 模式：Standard Wild
- 特殊功能：Free Spins (1x倍率) + Gamble

#### 中波動度遊戲
推薦組合：
- 賠付模式：Fixed Paylines 或 243 Ways
- Wild 模式：Standard Wild 或 Sticky Wild
- 特殊功能：Free Spins (2~3x倍率) + Bonus Game + Jackpot

#### 高波動度遊戲
推薦組合：
- 賠付模式：1024 Ways 或 Megaways
- Wild 模式：Expanding Wild 或 Walking Wild
- 特殊功能：Free Spins (Progressive Multiplier) + Cascading + Bonus Game

#### 極高波動度遊戲
推薦組合：
- 賠付模式：Megaways 或 Cluster Pays
- Wild 模式：Colossal Wild 或 Stacked Wild
- 特殊功能：Free Spins (Progressive Multiplier) + Cascading + Hold and Spin + Jackpot

---

## 版本更新日誌

### v2.0（2026-03-21）

**新增內容**：
- 多種賠付模式（243 Ways、1024 Ways、Megaways、Cluster Pays）
- Wild 行為模式詳解（Sticky、Expanding、Walking、Multiplier、Stacked、Colossal）
- 擴展特殊功能（Cascading、Hold and Spin、Gamble、Buy Feature、Progressive）
- 模組化功能生命週期框架
- 進階動畫規格（Cascading、Expanding Wild、Walking Wild、Sticky Wild）
- 音效主題設計框架
- 完整的 RTP 數學模型（波動度、Hit Frequency、Max Win Cap）
- 機制組合規則與建議
- 附錄 D 進階機制速查表

**改進**：
- 統一表格格式與範例結構
- 新增波動度與最大獲勝倍數欄位至第一章
- 擴充第二、三、六、七章內容
- 新增第十一、十二章進階動畫與音效框架

### v1.0（2026-03-21）

初版發佈。

