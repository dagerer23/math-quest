let audioCtx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const Ctor = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined
    if (!Ctor) return null
    audioCtx = new Ctor()
  }
  return audioCtx
}

export type SoundName = 'tap' | 'correct' | 'wrong' | 'combo' | 'levelup' | 'star' | 'unlock'

interface Note { freq: number; dur: number; type?: OscillatorType; gain?: number; delay?: number }

function playNotes(notes: Note[], volume = 0.18) {
  const ctx = getCtx()
  if (!ctx) return
  const start = ctx.currentTime
  notes.forEach((n) => {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = n.type ?? 'square'
    osc.frequency.setValueAtTime(n.freq, start + (n.delay ?? 0))
    g.gain.setValueAtTime(0, start + (n.delay ?? 0))
    g.gain.linearRampToValueAtTime((n.gain ?? 1) * volume, start + (n.delay ?? 0) + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, start + (n.delay ?? 0) + n.dur)
    osc.connect(g)
    g.connect(ctx.destination)
    osc.start(start + (n.delay ?? 0))
    osc.stop(start + (n.delay ?? 0) + n.dur)
  })
}

const SONGS: Record<SoundName, Note[]> = {
  tap: [{ freq: 880, dur: 0.05, type: 'square' }],
  correct: [
    { freq: 523, dur: 0.08, type: 'square' },
    { freq: 784, dur: 0.12, type: 'square', delay: 0.05 },
  ],
  wrong: [
    { freq: 220, dur: 0.15, type: 'sawtooth' },
    { freq: 165, dur: 0.2, type: 'sawtooth', delay: 0.12 },
  ],
  combo: [
    { freq: 660, dur: 0.07, type: 'square' },
    { freq: 880, dur: 0.07, type: 'square', delay: 0.06 },
    { freq: 1320, dur: 0.12, type: 'square', delay: 0.12 },
  ],
  levelup: [
    { freq: 523, dur: 0.1, type: 'square' },
    { freq: 659, dur: 0.1, type: 'square', delay: 0.1 },
    { freq: 784, dur: 0.1, type: 'square', delay: 0.2 },
    { freq: 1046, dur: 0.25, type: 'square', delay: 0.3 },
  ],
  star: [
    { freq: 1320, dur: 0.12, type: 'triangle' },
    { freq: 1760, dur: 0.18, type: 'triangle', delay: 0.1 },
  ],
  unlock: [
    { freq: 784, dur: 0.1, type: 'triangle' },
    { freq: 988, dur: 0.1, type: 'triangle', delay: 0.1 },
    { freq: 1175, dur: 0.2, type: 'triangle', delay: 0.2 },
  ],
}

export function playSound(name: SoundName, enabled: boolean) {
  if (!enabled) return
  try {
    playNotes(SONGS[name], 0.12)
  } catch {
    // ignore
  }
}

export function unlockAudio() {
  const ctx = getCtx()
  if (ctx && ctx.state === 'suspended') ctx.resume()
}
