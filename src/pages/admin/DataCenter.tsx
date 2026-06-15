/**
 * 数据中心 - 用户学习分析
 */
import { useEffect, useState } from 'react'
import {
  GraduationCap,
  BarChart3,
  Trophy,
  Target,
  XCircle,
  PartyPopper,
  Users,
  Loader2,
  BookOpen,
} from 'lucide-react'
import { adminStatsApi } from '@/services/adminApi'

interface KpStat { knowledgePoint: string; totalAttempts: number; mastery: number; mistakeRate: number }
interface TopMistake {
  id: string; prompt: string; knowledgePoint: string; answer: string
  difficulty: number; chapter: string; grade: number; mistakeCount: number
}
interface UserRank {
  rank: number; userId: string; nickname: string; avatar: string
  targetGrade: number; totalXp: number; totalSessions: number; correctRate: number
}

export default function DataCenter() {
  const [kpStats, setKpStats] = useState<KpStat[]>([])
  const [topMistakes, setTopMistakes] = useState<TopMistake[]>([])
  const [userRanking, setUserRanking] = useState<UserRank[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      adminStatsApi.knowledgePoints(),
      adminStatsApi.topMistakes(15),
      adminStatsApi.userRanking(20),
    ]).then(([kp, tm, ur]) => {
      setKpStats(kp)
      setTopMistakes(tm)
      setUserRanking(ur)
    }).catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="admin-empty">
        <div className="admin-empty-icon">
          <Loader2 className="animate-spin" size={32} color="#58CC02" />
        </div>
        <div className="admin-empty-text">加载中...</div>
      </div>
    )
  }

  const lowMastery = [...kpStats].sort((a, b) => a.mastery - b.mastery).slice(0, 10)
  const totalAttempts = kpStats.reduce((s, k) => s + k.totalAttempts, 0)

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">数据中心</h1>
          <p className="admin-page-subtitle">用户学习行为与知识掌握度分析</p>
        </div>
      </div>

      {/* Top stat row */}
      <div className="admin-grid admin-grid-3" style={{ marginBottom: 20 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ color: '#10b981' }}>
            <GraduationCap size={22} />
          </div>
          <div className="admin-stat-label">覆盖知识点</div>
          <div className="admin-stat-value">{kpStats.length}</div>
          <div className="admin-stat-trend up">↑ 知识体系</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ color: '#10b981' }}>
            <BarChart3 size={22} />
          </div>
          <div className="admin-stat-label">累计练习</div>
          <div className="admin-stat-value">{totalAttempts}</div>
          <div className="admin-stat-trend up">↑ 题次</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ color: '#10b981' }}>
            <Trophy size={22} />
          </div>
          <div className="admin-stat-label">活跃用户</div>
          <div className="admin-stat-value">{userRanking.length}</div>
          <div className="admin-stat-trend up">↑ 排名用户</div>
        </div>
      </div>

      <div className="admin-grid admin-grid-2" style={{ marginBottom: 20 }}>
        {/* Knowledge mastery */}
        <div className="admin-card">
          <h3 className="admin-card-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Target size={16} />
              知识点掌握度排行（低→高）
            </span>
            <span className="admin-tag admin-tag-gray">Top 10</span>
          </h3>
          {lowMastery.length === 0 ? (
            <div className="admin-empty">
              <div className="admin-empty-icon">
                <BookOpen size={32} color="#58CC02" />
              </div>
              <div className="admin-empty-text">暂无数据</div>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>知识点</th>
                  <th>题数</th>
                  <th>掌握度</th>
                </tr>
              </thead>
              <tbody>
                {lowMastery.map(k => (
                  <tr key={k.knowledgePoint}>
                    <td>{k.knowledgePoint}</td>
                    <td style={{ color: '#666' }}>{k.totalAttempts}</td>
                    <td style={{ width: 140 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="admin-progress" style={{ flex: 1 }}>
                          <div
                            className={`admin-progress-bar ${k.mastery < 50 ? 'low' : k.mastery < 80 ? 'mid' : 'high'}`}
                            style={{ width: `${k.mastery}%` }}
                          />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600, minWidth: 36 }}>{k.mastery}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Top mistakes */}
        <div className="admin-card">
          <h3 className="admin-card-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <XCircle size={16} />
              高频错题 Top 15
            </span>
          </h3>
          {topMistakes.length === 0 ? (
            <div className="admin-empty">
              <div className="admin-empty-icon">
                <PartyPopper size={32} color="#58CC02" />
              </div>
              <div className="admin-empty-text">暂无错题记录</div>
            </div>
          ) : (
            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              {topMistakes.map((m, idx) => (
                <div key={m.id} style={{
                  padding: '10px 0',
                  borderBottom: '1px solid #f3f3f5',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                    background: idx < 3 ? 'rgba(255,75,75,0.15)' : '#f0f0f3',
                    color: idx < 3 ? '#FF4B4B' : '#666',
                    fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{idx + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 4 }}>{m.prompt}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>
                      {m.grade && `${m.grade}年级`} {m.chapter} · {m.knowledgePoint} · 答错 <b style={{ color: '#FF4B4B' }}>{m.mistakeCount}</b> 次
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* User ranking */}
      <div className="admin-card">
        <h3 className="admin-card-title">
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Trophy size={16} />
            用户 XP 排行榜
          </span>
          <span className="admin-tag admin-tag-gray">Top 20</span>
        </h3>
        {userRanking.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">
              <Users size={32} color="#58CC02" />
            </div>
            <div className="admin-empty-text">暂无用户数据</div>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>排名</th>
                <th>用户</th>
                <th>年级</th>
                <th>累计 XP</th>
                <th>完成关卡</th>
                <th>正确率</th>
              </tr>
            </thead>
            <tbody>
              {userRanking.map(u => (
                <tr key={u.userId}>
                  <td>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 28, height: 22, borderRadius: 6,
                      background: u.rank <= 3 ? 'rgba(255,200,0,0.2)' : '#f0f0f3',
                      color: u.rank <= 3 ? '#C89A3D' : '#666',
                      fontSize: 12, fontWeight: 700,
                    }}>
                      {u.rank}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="admin-avatar">{u.nickname?.[0] || 'U'}</span>
                      <span style={{ fontWeight: 500 }}>{u.nickname}</span>
                    </div>
                  </td>
                  <td>{u.targetGrade ? `${u.targetGrade}年级` : '-'}</td>
                  <td style={{ fontWeight: 700, color: '#46A302' }}>{u.totalXp}</td>
                  <td>{u.totalSessions}</td>
                  <td>
                    <span className={`admin-tag ${u.correctRate >= 80 ? 'admin-tag-green' : u.correctRate >= 60 ? 'admin-tag-gold' : 'admin-tag-red'}`}>
                      {u.correctRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}