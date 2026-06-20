import { useState, useMemo } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useUserStore } from '@/store/useUserStore'
import { LEVELS } from '@/data/questionBank'
import type { Question } from '@/types/models'
import { Icon } from '@/components/Icon'
import { C, TOKEN, btnShadow } from '@/styles/theme'

const primaryLight = 'rgba(88,204,2,0.08)'

// hex -> rgba，用于半透明背景
function hexA(hex: string, a: number): string {
  const h = (hex || '#000000').replace('#', '')
  const r = parseInt(h.slice(0, 2), 16) || 0
  const g = parseInt(h.slice(2, 4), 16) || 0
  const b = parseInt(h.slice(4, 6), 16) || 0
  return `rgba(${r},${g},${b},${a})`
}

// 在扁平题库中查找题目
function findQuestion(id: string): Question | undefined {
  for (const level of LEVELS) {
    const found = level.questions.find((q) => q.id === id)
    if (found) return found
  }
  return undefined
}

export default function MistakesPage() {
  const user = useUserStore()
  const mistakeIds = user.mistakeIds || []
  const mistakeMastery = user.mistakeMastery || {}

  const mistakes: Question[] = useMemo(
    () => mistakeIds.map((id) => findQuestion(id)).filter(Boolean) as Question[],
    [mistakeIds]
  )

  const [selected, setSelected] = useState<Record<string, boolean>>({})

  const selectedCount = mistakes.filter((q) => selected[q.id]).length
  const allSelected = mistakes.length > 0 && selectedCount === mistakes.length

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = { ...prev }
      next[id] = !next[id]
      return next
    })
  }

  const toggleAll = () => {
    if (allSelected) {
      setSelected({})
    } else {
      const next: Record<string, boolean> = {}
      mistakes.forEach((q) => { next[q.id] = true })
      setSelected(next)
    }
  }

  // 单个复习：把该题存入临时缓存后跳转 battle
  const reviewSingle = (q: Question) => {
    Taro.setStorageSync('temp_reviewQuestions', JSON.stringify([q]))
    Taro.navigateTo({ url: '/pages/battle/index?mode=review&grade=1' })
  }

  // 批量复习：把选中错题存入临时缓存后跳转 battle
  const reviewBatch = () => {
    const selectedQs = mistakes.filter((q) => selected[q.id])
    if (selectedQs.length === 0) {
      Taro.showToast({ title: '请先选择错题', icon: 'none' })
      return
    }
    Taro.setStorageSync('temp_reviewQuestions', JSON.stringify(selectedQs))
    Taro.navigateTo({ url: '/pages/battle/index?mode=review&grade=1' })
  }

  const removeMistake = (id: string) => {
    user.clearMistake(id)
    setSelected((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    Taro.showToast({ title: '已移出错题本', icon: 'none' })
  }

  return (
    <View style={{ minHeight: '100vh', background: C.pageBg, paddingBottom: 80 }}>
      {/* 顶部渐变条 */}
      <View style={{ height: 4, background: `linear-gradient(to right, ${C.semantic.primary}, ${C.semantic.secondary}, ${C.semantic.primary})` }} />

      {/* 顶部导航 */}
      <View style={{ padding: '16px 16px 12px', paddingTop: 32, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', borderBottom: `1px solid ${C.semantic.border}` }}>
        <Text style={{ fontSize: 18, fontWeight: 700, color: C.semantic.foreground }}>错题本</Text>
        <Text style={{ fontSize: 12, color: C.semantic.mutedForeground }}>{mistakes.length} 题</Text>
      </View>

      <View style={{ padding: 16 }}>
        {/* 空状态 */}
        {mistakes.length === 0 ? (
          <View style={{ padding: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <Icon name="party" size={64} color={C.semantic.primary} />
            <Text style={{ fontSize: 17, fontWeight: 700, color: C.semantic.foreground, marginTop: 16 }}>太棒了，没有错题！</Text>
            <Text style={{ fontSize: 13, color: C.semantic.mutedForeground, marginTop: 6 }}>继续挑战更多关卡吧</Text>
          </View>
        ) : (
          <View>
            {/* 批量操作提示 */}
            <View style={{ marginBottom: 10, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 12, color: C.semantic.mutedForeground }}>勾选错题后可批量复习，答对 3 次自动移出错题本</Text>
              <Text style={{ fontSize: 12, color: C.semantic.primary, fontWeight: 600 }}>已选 {selectedCount}</Text>
            </View>

            {/* 错题列表 */}
            {mistakes.map((q, idx) => {
              const m = mistakeMastery[q.id] || 0
              const isSel = !!selected[q.id]
              const mastered = m >= 3
              return (
                <View
                  key={q.id}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: TOKEN.radius.lg,
                    padding: 14,
                    marginBottom: 12,
                    border: `1px solid ${mastered ? hexA(C.semantic.primary, 0.3) : isSel ? hexA(C.semantic.primary, 0.4) : C.semantic.border}`,
                    boxShadow: TOKEN.shadow.md,
                  }}
                >
                  <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                    {/* 选择框 */}
                    <View onClick={() => toggle(q.id)} style={{ marginTop: 2, width: 22, height: 22, borderRadius: 6, background: isSel ? C.semantic.primary : '#FFFFFF', border: `2px solid ${isSel ? C.semantic.primary : C.semantic.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isSel && <Icon name="check" size={14} color="#FFFFFF" />}
                    </View>

                    <View style={{ flex: 1 }}>
                      {/* 知识点 + 掌握度徽标 */}
                      <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 12, color: C.semantic.mutedForeground }}>第 {idx + 1} 题 · {q.knowledgePoint || '综合'}</Text>
                        {m > 0 && (
                          <View style={{ padding: '2px 6px', borderRadius: 999, background: mastered ? primaryLight : C.icon.iconGrayBg, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                            <Icon name="check" size={10} color={mastered ? C.semantic.primary : C.semantic.mutedForeground} />
                            <Text style={{ fontSize: 10, fontWeight: 700, color: mastered ? C.semantic.primary : C.semantic.mutedForeground, lineHeight: 12 }}>{m}/3</Text>
                          </View>
                        )}
                      </View>

                      {/* 题干 */}
                      <Text style={{ fontSize: 15, fontWeight: 600, color: C.semantic.foreground, lineHeight: 1.5, marginTop: 4 }}>{q.prompt}</Text>

                      {/* 正确答案 */}
                      <View style={{ marginTop: 8, background: primaryLight, borderRadius: TOKEN.radius.md, padding: 10 }}>
                        <Text style={{ fontSize: 10, fontWeight: 700, color: C.semantic.mutedForeground }}>正确答案</Text>
                        <Text style={{ fontSize: 16, fontWeight: 700, color: C.semantic.primary, marginTop: 2 }}>{String(q.answer)}</Text>
                        {q.explanation && (
                          <Text style={{ fontSize: 12, color: C.semantic.mutedForeground, marginTop: 4, lineHeight: 1.4 }}>{q.explanation}</Text>
                        )}
                      </View>

                      {/* 掌握度进度 */}
                      <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
                        <Text style={{ fontSize: 11, color: C.semantic.mutedForeground }}>掌握度</Text>
                        <View style={{ display: 'flex', flexDirection: 'row', gap: 4 }}>
                          {[0, 1, 2].map((i) => (
                            <View key={i} style={{ width: 10, height: 10, borderRadius: 999, background: i < m ? C.semantic.primary : C.semantic.border }} />
                          ))}
                        </View>
                        <Text style={{ fontSize: 11, color: mastered ? C.semantic.primary : C.semantic.mutedForeground, fontWeight: 600 }}>{mastered ? '已掌握' : `${m}/3`}</Text>
                      </View>

                      {/* 操作按钮 */}
                      <View style={{ display: 'flex', flexDirection: 'row', gap: 8, marginTop: 10 }}>
                        <View onClick={() => reviewSingle(q)} className="taro-btn-press" style={{ flex: 1, height: 38, borderRadius: TOKEN.radius.md, background: C.semantic.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: btnShadow(C.duolingo.greenDark) }}>
                          <Text style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>再练一次</Text>
                        </View>
                        <View onClick={() => removeMistake(q.id)} className="taro-btn-press" style={{ height: 38, padding: '0 14px', borderRadius: TOKEN.radius.md, background: C.icon.iconGrayBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 13, fontWeight: 600, color: C.semantic.mutedForeground }}>移除</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              )
            })}
          </View>
        )}
      </View>

      {/* 底部批量操作栏 */}
      {mistakes.length > 0 && (
        <View style={{ position: 'fixed', left: 0, right: 0, bottom: 0, background: '#FFFFFF', borderTop: `1px solid ${C.semantic.border}`, padding: '12px 16px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 -2px 8px rgba(0,0,0,0.04)' }}>
          <View onClick={toggleAll} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, padding: 4 }}>
            <View style={{ width: 22, height: 22, borderRadius: 6, background: allSelected ? C.semantic.primary : '#FFFFFF', border: `2px solid ${allSelected ? C.semantic.primary : C.semantic.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {allSelected && <Icon name="check" size={14} color="#FFFFFF" />}
            </View>
            <Text style={{ fontSize: 14, fontWeight: 600, color: C.semantic.foreground }}>全选</Text>
          </View>
          <View onClick={reviewBatch} className="taro-btn-press" style={{ height: 42, padding: '0 22px', borderRadius: TOKEN.radius.md, background: selectedCount > 0 ? C.semantic.primary : C.icon.iconGrayBg, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: selectedCount > 0 ? btnShadow(C.duolingo.greenDark) : 'none' }}>
            <Text style={{ fontSize: 14, fontWeight: 700, color: selectedCount > 0 ? '#FFFFFF' : C.semantic.mutedForeground }}>批量复习 ({selectedCount})</Text>
          </View>
        </View>
      )}
    </View>
  )
}
