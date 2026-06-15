import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  value: number
  show: boolean
}

export default function ComboNumber({ value, show }: Props) {
  return (
    <AnimatePresence>
      {show && value > 1 && (
        <motion.div
          key={value}
          initial={{ y: 0, scale: 0.6, opacity: 0 }}
          animate={{ y: -40, scale: 1.3, opacity: 1 }}
          exit={{ y: -80, scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute left-1/2 -translate-x-1/2 -top-2 pointer-events-none z-30"
        >
          <div className="font-pixel text-3xl glow-yellow text-neon-yellow whitespace-nowrap">
            COMBO ×{value}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
