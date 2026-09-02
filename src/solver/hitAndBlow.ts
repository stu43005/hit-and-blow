// Hit & Blow (Mastermind) 解題核心邏輯
// 規則：4 格、6 色、8 次機會。

/** 6 種顏色，以索引 0-5 表示。 */
export const COLORS = ['blue', 'red', 'green', 'yellow', 'purple', 'white'] as const

export type Color = (typeof COLORS)[number]

/** 顏色數量與格數。 */
export const NUM_COLORS = COLORS.length
export const NUM_SLOTS = 4

/** 一組密碼 / 猜測：長度固定為 NUM_SLOTS 的顏色索引陣列。 */
export type Code = number[]

/** 系統提示：hits = 顏色與位置皆正確；blows = 顏色正確但位置錯誤。 */
export interface Feedback {
  hits: number
  blows: number
}

/** 一次歷史紀錄：使用者的猜測與遊戲回饋。 */
export interface GuessRecord {
  guess: Code
  feedback: Feedback
}

/**
 * 依規則產生所有可能答案。
 * @param allowDuplicates 答案是否允許重複顏色。
 *   - false：6P4 = 360 種
 *   - true：6^4 = 1296 種
 */
export function generateCandidates(allowDuplicates: boolean): Code[] {
  const result: Code[] = []
  const current: number[] = []

  const backtrack = (): void => {
    if (current.length === NUM_SLOTS) {
      result.push([...current])
      return
    }
    for (let color = 0; color < NUM_COLORS; color++) {
      if (!allowDuplicates && current.includes(color)) continue
      current.push(color)
      backtrack()
      current.pop()
    }
  }

  backtrack()
  return result
}

/**
 * 計算某個猜測對某個答案的提示。
 * hits：同位置同色；blows：扣掉 hits 後，顏色配對得上但位置不同的數量。
 */
export function computeFeedback(guess: Code, answer: Code): Feedback {
  let hits = 0
  const guessCount = new Array<number>(NUM_COLORS).fill(0)
  const answerCount = new Array<number>(NUM_COLORS).fill(0)

  for (let i = 0; i < NUM_SLOTS; i++) {
    if (guess[i] === answer[i]) {
      hits++
    } else {
      guessCount[guess[i]]++
      answerCount[answer[i]]++
    }
  }

  let blows = 0
  for (let c = 0; c < NUM_COLORS; c++) {
    blows += Math.min(guessCount[c], answerCount[c])
  }

  return { hits, blows }
}

/** 兩個提示是否相等。 */
export function feedbackEquals(a: Feedback, b: Feedback): boolean {
  return a.hits === b.hits && a.blows === b.blows
}

/**
 * 從候選集中，保留「若它是答案，會產生與實際回饋相同提示」的候選。
 * 這是解題的核心過濾步驟。
 */
export function filterCandidates(
  candidates: Code[],
  guess: Code,
  feedback: Feedback,
): Code[] {
  return candidates.filter((answer) =>
    feedbackEquals(computeFeedback(guess, answer), feedback),
  )
}

/** 提示的合法組合上限：hits + blows 不得超過格數。 */
export function isFeedbackValid(feedback: Feedback): boolean {
  const { hits, blows } = feedback
  if (hits < 0 || blows < 0) return false
  if (hits + blows > NUM_SLOTS) return false
  // hits = NUM_SLOTS - 1 不可能，因為剩下一格必然也正確。
  if (hits === NUM_SLOTS - 1 && blows === 1) return false
  return true
}

export interface Suggestion {
  guess: Code
  /** 此猜測在最壞情況下，剩餘候選會被切到多大（越小越好）。 */
  worstCaseRemaining: number
  /** 此猜測本身是否仍在候選集中（可能一擊命中）。 */
  isCandidate: boolean
}

/**
 * 以 Knuth minimax 精神挑選下一步最佳猜測：
 * 對每個候選猜測，依所有可能提示把剩餘候選分桶，取最大桶（最壞情況），
 * 選出最壞情況最小者。並列時偏好「本身仍是候選」的猜測。
 *
 * 為兼顧效能，猜測來源使用目前候選集（保證每步都能收斂，且複雜度 O(n^2)）。
 */
export function suggestBestGuess(candidates: Code[]): Suggestion | null {
  if (candidates.length === 0) return null
  if (candidates.length === 1) {
    return { guess: candidates[0], worstCaseRemaining: 1, isCandidate: true }
  }

  let best: Suggestion | null = null

  for (const guess of candidates) {
    // 用提示的組合當 key 做分桶：key = hits * (NUM_SLOTS + 1) + blows
    const buckets = new Map<number, number>()
    for (const answer of candidates) {
      const fb = computeFeedback(guess, answer)
      const key = fb.hits * (NUM_SLOTS + 1) + fb.blows
      buckets.set(key, (buckets.get(key) ?? 0) + 1)
    }

    let worst = 0
    for (const size of buckets.values()) {
      if (size > worst) worst = size
    }

    if (
      best === null ||
      worst < best.worstCaseRemaining ||
      // 並列時，本身是候選者優先（此處猜測皆為候選，恆真，保留語意）
      (worst === best.worstCaseRemaining && !best.isCandidate)
    ) {
      best = { guess, worstCaseRemaining: worst, isCandidate: true }
    }
  }

  return best
}
