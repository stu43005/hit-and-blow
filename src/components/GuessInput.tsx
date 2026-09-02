import { COLOR_INFO } from '../solver/colors'
import {
  isFeedbackValid,
  NUM_SLOTS,
  type Code,
  type Feedback,
} from '../solver/hitAndBlow'
import './GuessInput.css'

interface GuessInputProps {
  guess: Code
  feedback: Feedback
  disabled: boolean
  onChangeGuess: (guess: Code) => void
  onChangeFeedback: (feedback: Feedback) => void
  onSubmit: () => void
}

/** 一輪輸入：4 格顏色選擇 + hits / blows 提示輸入。 */
export function GuessInput({
  guess,
  feedback,
  disabled,
  onChangeGuess,
  onChangeFeedback,
  onSubmit,
}: GuessInputProps) {
  const setSlotColor = (slot: number, colorIndex: number) => {
    const next = [...guess]
    next[slot] = colorIndex
    onChangeGuess(next)
  }

  const feedbackValid = isFeedbackValid(feedback)

  return (
    <div className="guess-input">
      <div className="guess-input__slots">
        {guess.map((selected, slot) => (
          <div key={slot} className="slot">
            <span className="slot__label">第 {slot + 1} 格</span>
            <div className="slot__swatches">
              {COLOR_INFO.map((info, colorIndex) => (
                <button
                  key={info.color}
                  type="button"
                  className={
                    'swatch' +
                    (selected === colorIndex ? ' swatch--selected' : '') +
                    (info.needsBorder ? ' swatch--bordered' : '')
                  }
                  style={{ backgroundColor: info.hex }}
                  title={info.label}
                  aria-label={`第 ${slot + 1} 格 選 ${info.label}`}
                  aria-pressed={selected === colorIndex}
                  onClick={() => setSlotColor(slot, colorIndex)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="guess-input__feedback">
        <label className="feedback-field">
          <span>
            位置正確數 <span className="feedback-field__tag feedback-field__tag--hit">Hit</span>
          </span>
          <select
            value={feedback.hits}
            onChange={(e) =>
              onChangeFeedback({ ...feedback, hits: Number(e.target.value) })
            }
          >
            {Array.from({ length: NUM_SLOTS + 1 }, (_, n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <label className="feedback-field">
          <span>
            僅顏色正確數{' '}
            <span className="feedback-field__tag feedback-field__tag--blow">Blow</span>
          </span>
          <select
            value={feedback.blows}
            onChange={(e) =>
              onChangeFeedback({ ...feedback, blows: Number(e.target.value) })
            }
          >
            {Array.from({ length: NUM_SLOTS + 1 }, (_, n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="submit-btn"
          disabled={disabled || !feedbackValid}
          onClick={onSubmit}
        >
          送出這一輪
        </button>
      </div>

      {!feedbackValid && (
        <p className="guess-input__warning">
          提示不合法：Hit + Blow 不可超過 {NUM_SLOTS}，且 {NUM_SLOTS - 1} 個 Hit 時不可能有 Blow。
        </p>
      )}
    </div>
  )
}
