import { useMemo, useState } from 'react'
import { CodePegs } from './components/CodePegs'
import { GuessInput } from './components/GuessInput'
import { COLOR_INFO } from './solver/colors'
import {
  filterCandidates,
  generateCandidates,
  NUM_SLOTS,
  suggestBestGuess,
  type Code,
  type Feedback,
  type GuessRecord,
} from './solver/hitAndBlow'
import './App.css'

const MAX_ROUNDS = 8
const MAX_CANDIDATES_SHOWN = 60

type Phase = 'rule' | 'solving'

function App() {
  const [phase, setPhase] = useState<Phase>('rule')
  const [allowDuplicates, setAllowDuplicates] = useState(false)
  const [history, setHistory] = useState<GuessRecord[]>([])

  // 目前這一輪的輸入。
  const [guess, setGuess] = useState<Code>([0, 1, 2, 3])
  const [feedback, setFeedback] = useState<Feedback>({ hits: 0, blows: 0 })

  // 依規則與歷史推導出目前的候選集。
  const candidates = useMemo(() => {
    let list = generateCandidates(allowDuplicates)
    for (const record of history) {
      list = filterCandidates(list, record.guess, record.feedback)
    }
    return list
  }, [allowDuplicates, history])

  // 依候選集算出建議的下一步猜測。
  const suggestion = useMemo(() => suggestBestGuess(candidates), [candidates])

  const totalSpace = allowDuplicates ? 6 ** NUM_SLOTS : 6 * 5 * 4 * 3
  const solved = candidates.length === 1
  const contradiction = candidates.length === 0
  const roundsUsed = history.length
  const outOfRounds = roundsUsed >= MAX_ROUNDS

  const startSolving = (dup: boolean) => {
    setAllowDuplicates(dup)
    setHistory([])
    setGuess([0, 1, 2, 3])
    setFeedback({ hits: 0, blows: 0 })
    setPhase('solving')
  }

  const submitRound = () => {
    setHistory((prev) => [...prev, { guess: [...guess], feedback: { ...feedback } }])
    setFeedback({ hits: 0, blows: 0 })
  }

  const undo = () => {
    setHistory((prev) => prev.slice(0, -1))
  }

  const applySuggestion = () => {
    if (suggestion) setGuess([...suggestion.guess])
  }

  if (phase === 'rule') {
    return <RuleScreen onStart={startSolving} />
  }

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1>Hit &amp; Blow 解題工具</h1>
          <p className="app__subtitle">猜色碼推理 · 4 格 6 色 8 次</p>
        </div>
        <button type="button" className="ghost-btn" onClick={() => setPhase('rule')}>
          重新開始 / 換規則
        </button>
      </header>

      <div className="app__grid">
        <section className="panel">
          <div className="panel__head">
            <h2>輸入這一輪</h2>
            <span className="badge">
              第 {Math.min(roundsUsed + 1, MAX_ROUNDS)} / {MAX_ROUNDS} 輪
            </span>
          </div>

          {suggestion && !solved && !contradiction && (
            <div className="suggestion">
              <div className="suggestion__text">
                <span className="suggestion__label">建議猜測</span>
                <CodePegs code={suggestion.guess} size="sm" />
                <span className="suggestion__meta">
                  最壞情況剩 {suggestion.worstCaseRemaining} 種
                </span>
              </div>
              <button type="button" className="ghost-btn" onClick={applySuggestion}>
                套用
              </button>
            </div>
          )}

          <GuessInput
            guess={guess}
            feedback={feedback}
            disabled={outOfRounds || contradiction || solved}
            onChangeGuess={setGuess}
            onChangeFeedback={setFeedback}
            onSubmit={submitRound}
          />

          {history.length > 0 && (
            <div className="history">
              <div className="history__head">
                <h3>歷史</h3>
                <button type="button" className="link-btn" onClick={undo}>
                  ↩ 復原上一輪
                </button>
              </div>
              <ol className="history__list">
                {history.map((record, i) => (
                  <li key={i} className="history__item">
                    <span className="history__round">#{i + 1}</span>
                    <CodePegs code={record.guess} size="sm" />
                    <span className="history__fb">
                      <b className="fb-hit">{record.feedback.hits}</b> Hit ·{' '}
                      <b className="fb-blow">{record.feedback.blows}</b> Blow
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel__head">
            <h2>可能的答案</h2>
            <span className="badge badge--count">
              {candidates.length} / {totalSpace}
            </span>
          </div>

          {solved && (
            <div className="status status--solved">
              🎉 答案唯一確定！
              <div className="status__answer">
                <CodePegs code={candidates[0]} size="lg" />
              </div>
            </div>
          )}

          {contradiction && (
            <div className="status status--error">
              ⚠️ 沒有任何答案符合所有提示。請檢查是否輸入了錯誤的 Hit / Blow，或用「復原上一輪」修正。
            </div>
          )}

          {outOfRounds && !solved && !contradiction && (
            <div className="status status--warn">
              已用滿 {MAX_ROUNDS} 次機會，仍有 {candidates.length} 種可能。
            </div>
          )}

          {!solved && !contradiction && <CandidateList candidates={candidates} />}
        </section>
      </div>

      <Legend />
    </div>
  )
}

function RuleScreen({ onStart }: { onStart: (allowDuplicates: boolean) => void }) {
  return (
    <div className="app app--center">
      <div className="rule-card">
        <h1>Hit &amp; Blow 解題工具</h1>
        <p className="app__subtitle">猜色碼推理</p>
        <p className="rule-card__desc">
          先選擇本局規則 —— 答案的 4 格顏色是否可以重複？
        </p>
        <div className="rule-card__options">
          <button type="button" className="rule-option" onClick={() => onStart(false)}>
            <span className="rule-option__title">不可重複</span>
            <span className="rule-option__count">6 × 5 × 4 × 3 = 360 種</span>
            <span className="rule-option__hint">4 格顏色皆不同</span>
          </button>
          <button type="button" className="rule-option" onClick={() => onStart(true)}>
            <span className="rule-option__title">可以重複</span>
            <span className="rule-option__count">6⁴ = 1296 種</span>
            <span className="rule-option__hint">同色可出現多次</span>
          </button>
        </div>
        <Legend />
      </div>
    </div>
  )
}

function CandidateList({ candidates }: { candidates: Code[] }) {
  const shown = candidates.slice(0, MAX_CANDIDATES_SHOWN)
  const hidden = candidates.length - shown.length
  return (
    <div className="candidates">
      <div className="candidates__grid">
        {shown.map((code, i) => (
          <div key={i} className="candidates__item">
            <CodePegs code={code} size="sm" />
          </div>
        ))}
      </div>
      {hidden > 0 && (
        <p className="candidates__more">…另有 {hidden} 種未顯示（請再猜幾輪縮小範圍）</p>
      )}
    </div>
  )
}

function Legend() {
  return (
    <div className="legend">
      {COLOR_INFO.map((info) => (
        <span key={info.color} className="legend__item">
          <span
            className={'legend__dot' + (info.needsBorder ? ' legend__dot--bordered' : '')}
            style={{ backgroundColor: info.hex }}
          />
          {info.label}
        </span>
      ))}
    </div>
  )
}

export default App
