import { motion } from 'framer-motion'

interface Props {
  trigger: number
  color?: string
}

export default function ParticleBurst({ trigger, color = '#FFD23F' }: Props) {
  if (!trigger) return null
  const count = 14
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {Array.from({ length: count }).map((_, i) => {
        const angle = (i / count) * Math.PI * 2
        const dist = 80 + Math.random() * 50
        const x = Math.cos(angle) * dist
        const y = Math.sin(angle) * dist
        return (
          <motion.span
            key={`${trigger}-${i}`}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x, y, opacity: 0, scale: 0.3 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="absolute w-2.5 h-2.5 rounded-sm"
            style={{ background: color, boxShadow: `0 0 12px ${color}` }}
          />
        )
      })}
    </div>
  )
}
