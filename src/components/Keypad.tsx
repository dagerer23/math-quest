import { Delete } from 'lucide-react'
import clsx from 'clsx'
import { motion } from 'framer-motion'

interface Props {
  value: string
  onChange: (v: string) => void
  allowDecimal?: boolean
  allowSign?: boolean
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

export default function Keypad({ value, onChange, allowDecimal, allowSign }: Props) {
  const append = (k: string) => {
    if (k === '.' && value.includes('.')) return
    if (k === '-' && value.length > 0) return
    onChange(value + k)
  }
  const back = () => onChange(value.slice(0, -1))
  const clear = () => onChange('')

  return (
    <div className="grid grid-cols-3 gap-2 select-none">
      {KEYS.map((k) => (
        <motion.button
          key={k}
          whileTap={{ scale: 0.92 }}
          className="btn-3d h-14 text-2xl display-num bg-gradient-to-b from-space-700 to-space-800 text-ink"
          onClick={() => append(k)}
        >
          {k}
        </motion.button>
      ))}
      {allowSign && (
        <motion.button
          whileTap={{ scale: 0.92 }}
          className="btn-3d h-14 text-2xl display-num bg-gradient-to-b from-space-700 to-space-800 text-ink"
          onClick={() => append('-')}
        >
          -
        </motion.button>
      )}
      <motion.button
        whileTap={{ scale: 0.92 }}
        className="btn-3d h-14 text-2xl display-num bg-gradient-to-b from-space-700 to-space-800 text-ink"
        onClick={() => append('0')}
      >
        0
      </motion.button>
      {allowDecimal ? (
        <motion.button
          whileTap={{ scale: 0.92 }}
          className={clsx(
            'btn-3d h-14 text-2xl display-num bg-gradient-to-b from-space-700 to-space-800 text-ink',
            value.includes('.') && 'opacity-50',
          )}
          onClick={() => append('.')}
        >
          .
        </motion.button>
      ) : (
        <motion.button
          whileTap={{ scale: 0.92 }}
          className="btn-3d h-14 bg-gradient-to-b from-neon-pink to-[#CC2E54] text-white flex items-center justify-center"
          onClick={back}
        >
          <Delete size={22} />
        </motion.button>
      )}
      {allowDecimal && (
        <motion.button
          whileTap={{ scale: 0.92 }}
          className="btn-3d h-14 bg-gradient-to-b from-neon-pink to-[#CC2E54] text-white flex items-center justify-center"
          onClick={back}
        >
          <Delete size={22} />
        </motion.button>
      )}
      <motion.button
        whileTap={{ scale: 0.92 }}
        className="col-span-3 btn-3d h-10 text-sm pixel-text text-ink/70 bg-space-800"
        onClick={clear}
      >
        清空
      </motion.button>
    </div>
  )
}
