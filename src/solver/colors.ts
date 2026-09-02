import type { Color } from './hitAndBlow'
import { COLORS } from './hitAndBlow'

export interface ColorInfo {
  color: Color
  label: string
  hex: string
  /** 白色等淺色需要邊框才看得清楚。 */
  needsBorder: boolean
}

/** 顏色索引對應的顯示資訊，順序與 COLORS 一致。 */
export const COLOR_INFO: ColorInfo[] = [
  { color: 'blue', label: '藍', hex: '#3b82f6', needsBorder: false },
  { color: 'red', label: '紅', hex: '#ef4444', needsBorder: false },
  { color: 'green', label: '綠', hex: '#22c55e', needsBorder: false },
  { color: 'yellow', label: '黃', hex: '#eab308', needsBorder: false },
  { color: 'purple', label: '紫', hex: '#a855f7', needsBorder: false },
  { color: 'white', label: '白', hex: '#f8fafc', needsBorder: true },
]

// 開發期健全性檢查：顯示資訊需與顏色定義對齊。
if (COLOR_INFO.length !== COLORS.length) {
  throw new Error('COLOR_INFO 與 COLORS 數量不一致')
}
