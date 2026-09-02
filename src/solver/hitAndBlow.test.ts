import { describe, expect, it } from 'vitest'
import {
  computeFeedback,
  filterCandidates,
  generateCandidates,
  isFeedbackValid,
  suggestBestGuess,
  type Code,
} from './hitAndBlow'

describe('generateCandidates', () => {
  it('不可重複時共 6P4 = 360 種', () => {
    const list = generateCandidates(false)
    expect(list).toHaveLength(360)
    // 每組皆 4 格且顏色互異
    for (const code of list) {
      expect(code).toHaveLength(4)
      expect(new Set(code).size).toBe(4)
    }
  })

  it('可重複時共 6^4 = 1296 種', () => {
    const list = generateCandidates(true)
    expect(list).toHaveLength(1296)
  })

  it('產生的組合不重複', () => {
    const list = generateCandidates(true)
    const keys = new Set(list.map((c) => c.join(',')))
    expect(keys.size).toBe(1296)
  })
})

describe('computeFeedback', () => {
  it('完全命中：4 hit 0 blow', () => {
    expect(computeFeedback([0, 1, 2, 3], [0, 1, 2, 3])).toEqual({ hits: 4, blows: 0 })
  })

  it('全錯位：0 hit 4 blow', () => {
    expect(computeFeedback([0, 1, 2, 3], [1, 0, 3, 2])).toEqual({ hits: 0, blows: 4 })
  })

  it('部分命中部分錯位', () => {
    // guess 0,1,2,3 vs answer 0,2,1,4
    // 位置0 命中(0)；位置1 guess=1 answer=2；位置2 guess=2 answer=1；位置3 guess=3 answer=4
    // 顏色1、2 在錯位中互相配對 → 2 blow
    expect(computeFeedback([0, 1, 2, 3], [0, 2, 1, 4])).toEqual({ hits: 1, blows: 2 })
  })

  it('重複顏色以 min 計數，不會超計', () => {
    // guess 全藍(0000)，answer 只有一格藍 → 1 hit 0 blow
    expect(computeFeedback([0, 0, 0, 0], [0, 1, 2, 3])).toEqual({ hits: 1, blows: 0 })
    // g=[0,0,1,1] a=[0,1,1,1] → 位0/位2/位3 皆 hit (3 hit)；
    // 剩 g:0 a:1 無法配對 → 0 blow
    expect(computeFeedback([0, 0, 1, 1], [0, 1, 1, 1])).toEqual({ hits: 3, blows: 0 })
    // g=[0,0,1,2] a=[0,1,1,3] → 位0/位2 hit；剩 g:0,2 a:1,3 無配對 → 0 blow
    expect(computeFeedback([0, 0, 1, 2], [0, 1, 1, 3])).toEqual({ hits: 2, blows: 0 })
    // g=[0,0,2,2] a=[2,2,0,0] → 0 hit；藍2紅... 顏色0配2個、顏色2配2個 → 4 blow
    expect(computeFeedback([0, 0, 2, 2], [2, 2, 0, 0])).toEqual({ hits: 0, blows: 4 })
  })

  it('feedback 對稱性：交換 guess/answer 的 hit 相同', () => {
    const a: Code = [0, 1, 2, 3]
    const b: Code = [3, 1, 0, 5]
    const f1 = computeFeedback(a, b)
    const f2 = computeFeedback(b, a)
    expect(f1.hits).toBe(f2.hits)
    expect(f1.blows).toBe(f2.blows)
  })
})

describe('filterCandidates', () => {
  it('答案必定符合它自己給出的提示', () => {
    const answer: Code = [2, 4, 0, 5]
    const all = generateCandidates(true)
    for (const guess of [
      [0, 1, 2, 3],
      [2, 4, 0, 5],
      [5, 5, 5, 5],
    ] as Code[]) {
      const fb = computeFeedback(guess, answer)
      const filtered = filterCandidates(all, guess, fb)
      expect(filtered.some((c) => c.join(',') === answer.join(','))).toBe(true)
    }
  })

  it('4 hit 提示會把候選縮到唯一', () => {
    const all = generateCandidates(false)
    const filtered = filterCandidates(all, [1, 2, 3, 4], { hits: 4, blows: 0 })
    expect(filtered).toHaveLength(1)
    expect(filtered[0]).toEqual([1, 2, 3, 4])
  })
})

describe('isFeedbackValid', () => {
  it('合法提示', () => {
    expect(isFeedbackValid({ hits: 4, blows: 0 })).toBe(true)
    expect(isFeedbackValid({ hits: 0, blows: 4 })).toBe(true)
    expect(isFeedbackValid({ hits: 2, blows: 2 })).toBe(true)
  })

  it('hit+blow 超過格數不合法', () => {
    expect(isFeedbackValid({ hits: 3, blows: 2 })).toBe(false)
  })

  it('3 hit 1 blow 不可能', () => {
    expect(isFeedbackValid({ hits: 3, blows: 1 })).toBe(false)
  })

  it('負數不合法', () => {
    expect(isFeedbackValid({ hits: -1, blows: 0 })).toBe(false)
  })
})

describe('suggestBestGuess', () => {
  it('候選唯一時回傳該候選', () => {
    const s = suggestBestGuess([[0, 1, 2, 3]])
    expect(s?.guess).toEqual([0, 1, 2, 3])
    expect(s?.worstCaseRemaining).toBe(1)
  })

  it('空候選回傳 null', () => {
    expect(suggestBestGuess([])).toBeNull()
  })

  it('端到端：模擬一局，最終收斂到唯一答案且不超過 8 輪', () => {
    const answer: Code = [4, 1, 5, 2]
    let candidates = generateCandidates(false)
    let rounds = 0
    while (candidates.length > 1 && rounds < 8) {
      const suggestion = suggestBestGuess(candidates)
      expect(suggestion).not.toBeNull()
      const guess = suggestion!.guess
      const fb = computeFeedback(guess, answer)
      candidates = filterCandidates(candidates, guess, fb)
      rounds++
    }
    expect(candidates).toHaveLength(1)
    expect(candidates[0]).toEqual(answer)
  })
})
