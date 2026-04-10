# Slot Game — PR 歷史與 Bug 修復記錄

> 從 CLAUDE.md 分離的歷史紀錄，供查閱用。開發時以 CLAUDE.md 為主。

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
- PR #54: 修復再次進入遊戲 scrollTo 時機（移至 view-active 之後）+ 首次進入 BGM 不播放（_onBgmLoaded 補播機制）+ 手機版多餘垂直滾動空間（dvh 取代 vh + overflow:hidden）
- PR #55: 更新黑白龍狼傳 M1（黑白郎君）符號圖片
- PR #56: CLAUDE.md 瘦身（297→239 行，-42%）+ 新增 CHANGELOG.md（PR 歷史與 Bug 記錄分離）+ 移除過時文件（ARCHITECTURE.md、PAYLINE_VISUAL_DESIGN.md）
- PR #57: 黑白龍狼傳 Free Game 進場前先結算 Base Game 贏分（dw-main.js 時序重構：有贏線時先播 win cycle 再 Scatter 高亮再轉場）+ 兩款遊戲 Paytable 賠分根據 Bet 倍數動態調整（dw-ui.js: cfg.BASE_BET→State.getBet()、ui.js: sym.pay×betPerLine + 每次開啟重建）
- PR #58: Fortune Slots Win Cycle 重構為 event-driven（animations.js: showWinLines 加 onComplete callback + _showNextWinLine 逐線播完一輪後自動推進；main.js: 移除 timer-based showDuration，改由 callback 驅動；stopWinLines 清除 callback 防止手動結算後重複觸發）
- PR #59: 黑白龍狼傳 Free Game 轉場與氣功動畫全面升級
- PR #60: DW 轉場動畫人物放大 50% + 龍狼完全重疊合體效果
- PR #61: 更換黑白龍狼傳背景音樂（Normal + Free Game）
- PR #62: 黑白龍狼傳 Free Game 結束 popup 自動關閉機制
- PR #63: 修復 Free Game 結束後 Base BGM 未恢復播放
- PR #64: 黑白龍狼傳三項動畫調整（笑聲同步、百搭並行放置、疊加效果）
- PR #65: 初始餘額調整為 50,000 及低餘額充值 popup
- PR #66: DW free-bigwin 音效 fallback 升級，補 debug log
- PR #67: DW 四項動畫調整 — 龍狼融合/郎君強化/分級聚氣系統
- PR #69: DW 轉場動畫手機版修復 + 黑白郎君縮小 80%
- PR #70: DW 手機版 FS 轉場「免費遊戲」文字不顯示根因修復
- PR #71: DW FS 轉場文字不顯示 — 移除父容器 CSS animation 防 Safari GPU 合成干擾
- PR #72: DW FS 轉場文字不顯示 — will-change + isolation 強制獨立合成層
- PR #73: DW FS 轉場文字不顯示 — 移除重複 CSS animation 改 JS 控制 pulse/glow
- PR #74: DW FS 轉場最終修復 — CSS animation 回歸、class 控制、v=74 cache-busting
- PR #75: DW FS 轉場改純 CSS animation-delay — 修復 Safari/Chrome 手機版
- PR #76: DW FS 轉場父容器不動畫 opacity — 修復 iOS Safari 文字不顯示
- PR #77: DW FS 轉場加入可見 debug overlay
- PR #78: DW debug panel 改善 — 過濾噪音、觸控滾動、縮小字體
- PR #79: DW FS 轉場 Safari iOS 凍結 — filter 改 GPU compositable
- PR #80: DW 轉場金光效果修復 — img 不支援 ::after
- PR #81: 修復手機切換 App 回來時音樂音效消失
- PR #82: iOS 切換 App 回來後音樂不恢復 — user gesture fallback
- PR #83: iOS 切換 App 回來後音效不恢復 — 必定觸發 gesture fallback
- PR #84: iOS 切換 App 回來後 BGM 不恢復
- PR #85: iOS 切回 App 後 BGM 不恢復 — 根治三大根因
- PR #86: iOS 切回 App 後 BGM 不恢復（重新實作，根治三大根因）
- PR #87: 根治 iOS BGM 不恢復 — 重建 GainNode 取代 cancelScheduledValues
- PR #88: AUTO 模式切回 App 後 BGM 不恢復（spin 健康檢查 + 500ms 延遲）
- PR #89: 修復兩款遊戲 BGM 同時播放（PR #88 引入的迴歸 bug）
- PR #90: 黑白龍狼傳 Free Game 轉場優化 — 轉場動畫開始時停止 Base BGM（bgmStop + callback 改用 bgmStart('free')）+ 龍狼衝刺動畫放慢 50%（Phase 1 從 1s→2s，Phase 2~5 delay +1s，總時長 5.5s→6.5s）
- PR #91: 補充 CHANGELOG.md — PR #59~#89 歷史記錄（31 條新增）
- PR #92: CLAUDE.md 新增 iOS BGM 無法自動恢復的系統限制說明（勿重複嘗試）
- PR #93: 消除 DW FS 轉場龍狼消失到郎君出現的 1 秒空白（Phase 3 延遲從 2.8s→2.0s）
- PR #94: 手機 UX 優化 — 雙擊 zoom 防止（html/overlay 明確加 touch-action: manipulation）+ 橫向 CSS transform 強制直向鎖定（含左右兩方向，後被 PR #96 取代）
- PR #95: DW 聚氣音效 Tier 制 — 新增 qigong-1/2/3.mp3，依百搭數量（tier）播放對應音效（2s/4s/7s），fallback 至笑聲合成
- PR #96: 手機橫向改為直式 UI 自然裁切 — 移除 PR #94 的 body-rotation 旋轉方案，改由 overflow:hidden 自然裁切；保留 orientationchange reflow handler
- PR #97: CLAUDE.md 更新 — PR #90~#96 修改記錄、iOS 雙擊 zoom / 橫向處理防踩坑、DW FS 轉場時序、聚氣音效 Tier 制、audio/dragon_wolf 目錄說明
- PR #98: 補充 CHANGELOG.md — PR #91~#97 歷史記錄（7 條新增）
- PR #99: 更新 GAME_SPEC_dragon_wolf.md 至 v2.0（RTP 分配、賠率表、Reel Strip 數量對齊 PR #42 定版），刪除過時 REEL_STRIPS_dragon_wolf.md
- PR #100: 更新 README.md / README.zh-TW.md（標題改為「老虎機遊戲平台」、新增黑白龍狼傳介紹、Hash Routing 補 #game/dragon_wolf）+ GAME_SPEC_TEMPLATE / SLOT_GAME_REFERENCE 更新
- PR #101: 重構 GAME_SPEC_TEMPLATE.md v2.0 → v3.0（補 Fortune Slots vs 黑白龍狼傳比較欄、1024-Ways 賠率說明、Scatter 機制空白參數表）
- PR #102: 黑白龍狼傳 Free Game Retrigger 機率調高至 ~0.2%（Free Reel SC 數量 軸1/2 從 2→4、軸3 從 2→3；FREE_PAY 全面 ×1.066 補償；fixedSeed 機制確保普通符號排列不變）
- PR #103: 黑白龍狼傳 RTP 結構重組 — Base 60%→50%、Free 36%→46%（Total 96%）；M2=M3 黑龍白狼賠率統一（雙主角等強）；Free Reel SC:5/6/6（Retrigger ~0.83%）、M1 軸2:9→10/軸3:9→11（M1 trigger 12.5%）；FREE_PAY 全面重算；fixedSeed v2=[3321,3418,3518,3662,3824]。RTP 驗證：95.89%（Base 49.91% + Free 45.99%）
- PR #104: 更新黑白龍狼傳聚氣音效 qigong-1/2/3.mp3 至新版本（Tier1~3 對應 2s/4s/7s）
- PR #105: 加入 PWA 桌面圖示（images/icon-180/192/512.png + manifest.json + index.html apple-touch-icon / theme-color meta 標籤）
- PR #106: 修復 randomWilds 覆蓋 SC 導致 Free Game Retrigger 未觸發的 bug（dw-features.js applyRandomWilds available 排除條件加入 SC；同步修正 rtp-verify-dragon-wolf.js）RTP 驗證：95.70%（Base 49.91% + Free 45.79%）
- PR #107: 黑白龍狼傳 Scatter 高亮音效升級 — _sfxScatter 改為機械鬧鐘鈴聲（6 段 × 17Hz 雙頻交替，共 3 秒，音量 ×4）；高亮等待時間 2000ms → 3000ms（確保音效播畢再進入轉場）

## 已修復 Bug 完整記錄
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
30. **Fortune Slots Symbol 桌面版不置中（PR #44）**：`#reel-area` 的 `overflow: hidden` 與 `justify-content: center` 在部分瀏覽器有潛在衝突，reel grid 在寬容器中靠左 → 移除 `overflow: hidden`，`#reel-grid` 加 `margin: auto` 保底置中
31. **黑白龍狼傳 Symbol 靠左不置中（PR #44）**：`.dw-reel-strip` 為 block 容器，`.dw-symbol` 固定寬度小於 grid `1fr` 寬度，預設靠左 → `.dw-reel-strip` 加 `display: flex; flex-direction: column; align-items: center`
32. **黑白龍狼傳 BGM 換為 MP3 音檔（PR #51）**：原程序化 BGM 換成 AI 生成的中國武俠風 MP3 音檔，0.15s crossfade 切換，無縫循環
33. **黑白龍狼傳 Free Game BGM 過早切換（PR #52）**：`_endFreeSpins()` 中 `bgmSetMode('base')` 在 `playFSSummary()` 之前呼叫 → 移至 onComplete callback
34. **手機版進入遊戲未捲回頂部（PR #52）**：SPA view 切換不觸發捲動重置 → router.js 加入 `window.scrollTo(0, 0)`
35. **再次進入遊戲仍未捲回頂部（PR #54）**：scrollTo 在 view-hidden 時無效 → 改在 `classList.add('view-active')` 之後執行
36. **首次進入黑白龍狼傳 BGM 不播放（PR #54）**：非同步 XHR buffer 未載入時 bgmStart() 無效 → 新增 `_onBgmLoaded()` 回調補播
37. **手機版黑白龍狼傳多餘垂直滾動空間（PR #54）**：`100vh` 包含瀏覽器地址列高度 → 改用 `100dvh` + `overflow: hidden`
