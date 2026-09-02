# Hit &amp; Blow 解題工具

一個猜色碼（Mastermind 類型）推理輔助工具。你在遊戲裡出一手猜測，把遊戲回報的
Hit / Blow 數字輸進來，它會即時列出所有仍然可能的答案，並依 Knuth minimax
演算法建議下一步該猜什麼。

規則為 **4 格、6 色、最多 8 次機會**，並支援「答案顏色可否重複」兩種變體。

## 功能

- **候選集即時收斂**：每輸入一輪提示，就把不符合的答案全部剔除，剩幾種一目了然
- **最佳猜測建議**：以最壞情況剩餘候選數最小為準則挑選下一手，並顯示該手的最壞情況值
- **兩種規則**：不可重複（6 × 5 × 4 × 3 = 360 種）與可重複（6⁴ = 1296 種）
- **矛盾偵測**：若沒有任何答案符合所有提示，會提示你檢查輸入是否有誤
- **復原上一輪**：輸錯提示可直接回退，不必重來
- **輸入防呆**：擋掉不合法的提示組合（Hit + Blow > 4，或 3 Hit + 1 Blow）

## 玩法

1. 開啟後先選本局規則：答案的 4 格顏色**可否重複**
2. 用色塊選出你這一輪實際猜的 4 格顏色（或按「套用」直接帶入建議的猜測）
3. 從遊戲畫面讀出結果，填入 **Hit**（顏色與位置皆正確）與 **Blow**（顏色對、位置錯）
4. 按「送出這一輪」，右側的可能答案數量就會縮小
5. 重複到剩下唯一答案為止

## 開發

```bash
npm install
npm run dev      # 啟動開發伺服器
npm run build    # 型別檢查 + 產出 production build
npm run lint     # Oxlint
npm run test     # Vitest 單元測試
```

## 專案結構

```
src/
├── App.tsx                  # 主畫面：規則選擇、輪次流程、候選集顯示
├── solver/
│   ├── hitAndBlow.ts        # 解題核心：候選產生、提示計算、過濾、minimax 建議
│   ├── hitAndBlow.test.ts   # 核心邏輯的單元測試
│   └── colors.ts            # 顏色索引對應的顯示資訊（標籤、色碼）
└── components/
    ├── GuessInput.tsx       # 一輪輸入：4 格顏色選擇 + Hit / Blow 填寫
    └── CodePegs.tsx         # 以色塊呈現一組 4 格顏色
```

## 核心演算法

`solver/hitAndBlow.ts` 不依賴任何 UI，可獨立測試：

| 函式 | 用途 |
| --- | --- |
| `generateCandidates(allowDuplicates)` | 依規則列出全部可能答案（360 或 1296 種） |
| `computeFeedback(guess, answer)` | 算出某猜測對某答案的 Hit / Blow |
| `filterCandidates(candidates, guess, feedback)` | 只留下會產生相同提示的候選 |
| `isFeedbackValid(feedback)` | 檢查提示組合是否合法 |
| `suggestBestGuess(candidates)` | Knuth minimax：挑最壞情況剩餘候選最少的一手 |

`suggestBestGuess` 的猜測來源限定在目前候選集內，因此每一步都保證會收斂，複雜度為
O(n²)。並列時偏好本身仍是候選的猜測（有機會直接命中）。

## 技術

React 19 · TypeScript · Vite · Vitest · Oxlint

## 授權與免責聲明

本工具為獨立開發的通用解題程式，實作的是公開的 Mastermind 類型推理演算法，
與任何商業遊戲產品無關，亦未使用其素材、商標或名稱。
