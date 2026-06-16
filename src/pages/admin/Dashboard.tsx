/**
 * 仪表盘 - 总览数据 + 趋势图表
 */
import { useEffect, useState } from 'react'
import {
  Users,
  BookOpen,
  Target,
  CheckCircle,
  TrendingUp,
  Building2,
  Gamepad2,
  BarChart3,
  Zap,
  Loader2,
  Clock,
  ArrowUpRight,
} from 'lucide-react'
import { adminStatsApi } from '@/services/adminApi'
import { useToast } from '@/components/AdminLayout'

interface Summary {
  totalUsers: number
  totalQuestions: number
  totalLevels: number
  activeToday: number
  avgCorrectRate: number
  totalSessions: number
}

interface TrendPoint { date: string; count: number }
interface GradePoint { grade: number; count: number }

export default function Dashboard() {
  const toast = useToast()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [trend, setTrend] = useState<TrendPoint[]>([])
  const [grades, setGrades] = useState<GradePoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      adminStatsApi.summary(),
      adminStatsApi.dailyTrend(7),
      adminStatsApi.gradeDistribution(),
    ]).then(([s, t, g]) => {
      setSummary(s)
      setTrend(t)
      setGrades(g)
    }).catch(() => {
      toast('error', '加载仪表盘数据失败')
    }).finally(() => setLoading(false))
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

  const maxCount = Math.max(1, ...trend.map(t => t.count))
  const totalGrades = grades.reduce((s, g) => s + g.count, 0)

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">仪表盘</h1>
          <p className="admin-page-subtitle">系统总览与关键指标</p>
        </div>
        <div className="admin-page-actions">
          <span className="admin-tag admin-tag-gray" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={14} />
            {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
          </span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="admin-grid admin-grid-4" style={{ marginBottom: 20 }}>
        <StatCard icon={<Users size={22} />} label="注册用户" value={summary?.totalUsers ?? 0} suffix="人" trend="+本周" />
        <StatCard icon={<BookOpen size={22} />} label="题目总数" value={summary?.totalQuestions ?? 0} suffix="题" trend="+本月" />
        <StatCard icon={<Target size={22} />} label="今日活跃" value={summary?.activeToday ?? 0} suffix="人" trend="今日" />
        <StatCard icon={<CheckCircle size={22} />} label="平均正确率" value={summary?.avgCorrectRate ?? 0} suffix="%" trend="累计" />
      </div>

      {/* Charts row */}
      <div className="admin-grid admin-grid-2" style={{ marginBottom: 20 }}>
        <div className="admin-card">
          <h3 className="admin-card-title">
            <span>近 7 天答题趋势</span>
            <span className="admin-tag admin-tag-green">实时</span>
          </h3>
          {trend.every(t => t.count === 0) ? (
            <div className="admin-empty" style={{ padding: 40 }}>
              <div className="admin-empty-icon">
                <BarChart3 size={32} color="#58CC02" />
              </div>
              <div className="admin-empty-text">暂无答题数据</div>
            </div>
          ) : (
            <div className="admin-bar-chart">
              {trend.map(t => (
                <div className="admin-bar-col" key={t.date}>
                  <div className="admin-bar" style={{ height: `${(t.count / maxCount) * 140}px` }}>
                    <div className="admin-bar-value">{t.count}</div>
                  </div>
                  <div className="admin-bar-label">
                    {new Date(t.date).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="admin-card">
          <h3 className="admin-card-title">
            <span>各年级关卡分布</span>
          </h3>
          {grades.length === 0 ? (
            <div className="admin-empty" style={{ padding: 40 }}>
              <div className="admin-empty-icon">
                <BookOpen size={32} color="#58CC02" />
              </div>
              <div className="admin-empty-text">暂无关卡</div>
            </div>
          ) : (
            <GradeDistributionChart data={grades} total={totalGrades} />
          )}
        </div>
      </div>

      {/* Quick info */}
      <div className="admin-grid admin-grid-3">
        <InfoCard
          icon={<Gamepad2 size={22} color="#fff" />}
          label="总关卡数"
          value={summary?.totalLevels ?? 0}
          desc="已发布关卡"
        />
        <InfoCard
          icon={<BarChart3 size={22} color="#fff" />}
          label="累计答题"
          value={summary?.totalSessions ?? 0}
          desc="总完成次数"
        />
        <InfoCard
          icon={<Zap size={22} color="#fff" />}
          label="系统状态"
          value="正常"
          desc="所有服务运行良好"
        />
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, suffix, trend }: { icon: React.ReactNode; label: string; value: number | string; suffix?: string; trend: string }) {
  return (
    <div className="admin-stat-card">
      <div className="admin-stat-icon" style={{ color: '#10b981' }}>{icon}</div>
      <div className="admin-stat-label">{label}</div>
      <div className="admin-stat-value">
        {value}{suffix && <span style={{ fontSize: 16, color: '#666', marginLeft: 4 }}>{suffix}</span>}
      </div>
      <div className="admin-stat-trend up">↑ {trend}</div>
    </div>
  )
}

function InfoCard({ icon, label, value, desc }: { icon: React.ReactNode; label: string; value: number | string; desc: string }) {
  return (
    <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: 'linear-gradient(135deg, #58CC02 0%, #7ED321 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 12, color: '#666' }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2 }}>{value}</div>
        <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{desc}</div>
      </div>
    </div>
  )
}

function GradeDistributionChart({ data, total }: { data: GradePoint[]; total: number }) {
  const colors = ['#58CC02', '#1CB0F6', '#CE82FF', '#FFC800', '#FF4B4B', '#FF9600', '#00C2A8']
  return (
    <div>
      {data.map((g, idx) => {
        const pct = total > 0 ? (g.count / total) * 100 : 0
        return (
          <div key={g.grade} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ fontWeight: 500 }}>{g.grade} 年级</span>
              <span style={{ color: '#666' }}>{g.count} 关 · {pct.toFixed(0)}%</span>
            </div>
            <div className="admin-progress">
              <div
                className="admin-progress-bar high"
                style={{ width: `${pct}%`, background: colors[idx % colors.length] }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}