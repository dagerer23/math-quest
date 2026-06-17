import { defineConfig, presetUno, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetIcons({
      scale: 1.2,
      warn: true,
    }),
  ],
  theme: {
    colors: {
      primary: '#58CC02',
      secondary: '#1CB0F6',
      accent: '#FFC800',
      destructive: '#FF4B4B',
      'duolingo-green': '#58CC02',
      'duolingo-blue': '#1CB0F6',
      'duolingo-red': '#FF4B4B',
      'duolingo-gold': '#FFC800',
      'duolingo-purple': '#CE82FF',
      'duolingo-gray': '#777777',
      'duolingo-gray-dark': '#3C3C3C',
      'duolingo-gray-light': '#F4F4F4',
    },
  },
  shortcuts: {
    'icon-container': 'size-8 rounded-[10px] flex items-center justify-center',
    'page-container': 'min-h-screen bg-[#F8FAF5]',
    'card-base': 'bg-white rounded-2xl border border-[#E5E7EB] shadow-xs',
  },
})
