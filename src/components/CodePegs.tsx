import { COLOR_INFO } from '../solver/colors'
import type { Code } from '../solver/hitAndBlow'
import './CodePegs.css'

interface CodePegsProps {
  code: Code
  size?: 'sm' | 'md' | 'lg'
}

/** 以色塊呈現一組 4 格顏色。 */
export function CodePegs({ code, size = 'md' }: CodePegsProps) {
  return (
    <div className={`code-pegs code-pegs--${size}`}>
      {code.map((colorIndex, i) => {
        const info = COLOR_INFO[colorIndex]
        return (
          <span
            key={i}
            className={`peg${info.needsBorder ? ' peg--bordered' : ''}`}
            style={{ backgroundColor: info.hex }}
            title={info.label}
          />
        )
      })}
    </div>
  )
}
