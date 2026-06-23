import { View, Text } from '@tarojs/components'
import { Icon } from '@/components/Icon'
import { C } from '@/styles/theme'

interface ChoiceOptionsProps {
  options: string[]
  answer: string | number
  selectedOption: string | null
  feedback: 'correct' | 'wrong' | null
  onSelect: (option: string) => void
  themeAccent: string
  themeAccentSoft: string
  disabled?: boolean
  showHighlight?: boolean
}

export function ChoiceOptions({
  options,
  answer,
  selectedOption,
  feedback,
  onSelect,
  themeAccent,
  themeAccentSoft,
  disabled = false,
  showHighlight = false,
}: ChoiceOptionsProps) {
  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'center',
      }}
    >
      {options.map((option) => {
        const isPicked = selectedOption === option
        const isCorrectAnswer = String(option) === String(answer)
        const showCorrect = feedback === 'correct' && isPicked
        const showWrong = feedback === 'wrong' && isPicked && !isCorrectAnswer
        const showCorrectHighlight = feedback === 'wrong' && isCorrectAnswer && showHighlight

        let background = '#FFFFFF'
        let borderColor = '#E5E5E5'
        let color = '#4B4B4B'
        let shadow = '0 2px 8px rgba(0,0,0,0.04)'
        let opacity = feedback && !isPicked && !isCorrectAnswer ? 0.5 : 1

        if (showCorrect) {
          background = 'linear-gradient(135deg, rgba(88,204,2,0.25) 0%, rgba(88,204,2,0.12) 100%)'
          borderColor = C.semantic.primary
          color = C.duolingo.greenDark
          shadow = '0 0 16px rgba(88,204,2,0.4), 0 4px 12px rgba(88,204,2,0.2)'
        } else if (showCorrectHighlight) {
          background = 'linear-gradient(135deg, rgba(88,204,2,0.2) 0%, rgba(88,204,2,0.08) 100%)'
          borderColor = C.semantic.primary
          color = C.duolingo.greenDark
          shadow = '0 0 12px rgba(88,204,2,0.3)'
        } else if (showWrong) {
          background = 'linear-gradient(135deg, rgba(255,75,75,0.2) 0%, rgba(255,75,75,0.1) 100%)'
          borderColor = C.semantic.destructive
          color = '#E63A3A'
          shadow = '0 0 12px rgba(255,75,75,0.3)'
        } else if (isPicked && !feedback) {
          background = themeAccentSoft
          borderColor = themeAccent
          color = themeAccent
          shadow = `0 4px 12px ${themeAccentSoft}`
        }

        return (
          <View
            key={option}
            style={{
              flexBasis: 'calc(50% - 6px)',
              flexGrow: 0,
              flexShrink: 0,
            }}
          >
            <View
              className="taro-btn-press"
              onClick={() => !disabled && !feedback && onSelect(option)}
              style={{
                position: 'relative',
                height: 56,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background,
                borderWidth: 2,
                borderStyle: 'solid',
                borderColor,
                boxShadow: shadow,
                opacity,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color,
                  textAlign: 'center',
                }}
              >
                {option}
              </Text>

              {showCorrect && (
                <View
                  className="taro-pop-in"
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    background: C.semantic.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="check" size={20} color="#FFFFFF" />
                </View>
              )}

              {showWrong && (
                <View
                  className="taro-pop-in"
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    background: C.semantic.destructive,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="x" size={20} color="#FFFFFF" />
                </View>
              )}

              {showCorrectHighlight && (
                <View
                  className="taro-pop-in"
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    background: C.semantic.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="check" size={20} color="#FFFFFF" />
                </View>
              )}
            </View>
          </View>
        )
      })}
    </View>
  )
}
