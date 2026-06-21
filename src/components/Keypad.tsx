import { Delete } from 'lucide-react'
import clsx from 'clsx'
import { motion } from 'framer-motion'
import { useRef, useState } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  allowDecimal?: boolean
  allowSign?: boolean
  accentColor?: string
}

const NUMS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
const TAP = { scale: 0.95 }

export default function Keypad({ value, onChange, allowDecimal, allowSign, accentColor = '#FF4B4B' }: Props) {
  const longPressRef = useRef<NodeJS.Timeout | null>(null)
  const [pressedKey, setPressedKey] = useState<string | null>(null)

  const append = (k: string) => {
    if (k === '.' && value.includes('.')) return
    if (k === '-' && value.length > 0) return
    onChange(value + k)
  }
  const back = () => onChange(value.slice(0, -1))
  const clear = () => onChange('')

  const startLongPress = (action: () => void) => {
    if (longPressRef.current) clearTimeout(longPressRef.current)
    longPressRef.current = setTimeout(() => {
      action()
      if (longPressRef.current) clearTimeout(longPressRef.current)
    }, 500)
  }
  const cancelLongPress = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current)
      longPressRef.current = null
    }
  }

  const numBtn = (k: string) => (
    <motion.button
      key={k}
      whileTap={TAP}
      aria-label={`数字 ${k}`}
      className={clsx(
        'h-14 sm:h-16 rounded-2xl text-2xl font-bold text-foreground flex items-center justify-center transition-colors duration-150',
        pressedKey === k
          ? 'bg-gray-100 shadow-inner'
          : 'bg-white shadow-sm border border-gray-100 active:bg-gray-50',
      )}
      onClick={() => append(k)}
      onMouseDown={() => setPressedKey(k)}
      onMouseUp={() => setPressedKey(null)}
      onMouseLeave={() => setPressedKey(null)}
      onTouchStart={() => setPressedKey(k)}
      onTouchEnd={() => setPressedKey(null)}
    >
      {k}
    </motion.button>
  )

  const actionBtn = (
    children: React.ReactNode,
    onClick: () => void,
    onLongPress?: () => void,
    disabled = false,
    label?: string,
  ) => (
    <motion.button
      whileTap={!disabled ? TAP : undefined}
      aria-label={label}
      aria-disabled={disabled}
      className={clsx(
        'h-14 sm:h-16 rounded-2xl text-2xl font-bold text-white shadow-sm flex items-center justify-center transition-all duration-150',
        disabled && 'opacity-40',
      )}
      style={{ background: accentColor }}
      onClick={() => {
        cancelLongPress()
        if (!disabled) onClick()
      }}
      onMouseDown={() => onLongPress && startLongPress(onLongPress)}
      onMouseUp={cancelLongPress}
      onMouseLeave={cancelLongPress}
      onTouchStart={() => onLongPress && startLongPress(onLongPress)}
      onTouchEnd={cancelLongPress}
    >
      {children}
    </motion.button>
  )

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-t-3xl p-3 -mx-3 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
      <div className="grid grid-cols-3 gap-2.5 select-none">
        {NUMS.map((k) => numBtn(k))}

        {allowDecimal ? (
          <motion.button
            whileTap={TAP}
            aria-label="小数点"
            className={clsx(
              'h-14 sm:h-16 rounded-2xl text-2xl font-bold shadow-sm border flex items-center justify-center transition-colors duration-150',
              value.includes('.')
                ? 'bg-gray-100 text-gray-300 border-gray-100'
                : 'bg-white text-foreground border-gray-100 active:bg-gray-50',
            )}
            onClick={() => append('.')}
            disabled={value.includes('.')}
          >
            .
          </motion.button>
        ) : (
          actionBtn('清空', clear, undefined, false, '清空')
        )}

        {numBtn('0')}

        {actionBtn(<Delete size={22} />, back, clear, value.length === 0, '退格')}

        {allowSign && (
          <motion.button
            whileTap={TAP}
            aria-label="负号"
            className="h-14 sm:h-16 rounded-2xl bg-white text-2xl font-bold text-foreground shadow-sm border border-gray-100 flex items-center justify-center active:bg-gray-50"
            onClick={() => append('-')}
          >
            -
          </motion.button>
        )}
      </div>
    </div>
  )
}
