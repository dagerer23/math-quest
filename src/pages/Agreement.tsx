import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

const TABS = [
  { key: 'agreement', label: '用户协议' },
  { key: 'privacy', label: '隐私政策' },
] as const

type TabKey = (typeof TABS)[number]['key']

const AGREEMENT_CONTENT = `
## 算力先锋用户协议

**更新日期：2025年1月1日**

### 一、总则

欢迎使用算力先锋（以下简称"本应用"）。本协议是您与算力先锋之间关于使用本应用所订立的协议。请您仔细阅读本协议，在确认充分理解并同意后再开始使用。

### 二、服务内容

1. 本应用为用户提供小学数学学习辅导服务，包括但不限于：数学题目练习、知识点测评、学习进度跟踪、排行榜等功能。
2. 本应用通过游戏化的方式帮助用户提升数学能力，所有题目内容均基于国家课程标准设计。
3. 我们将不断优化服务内容，为用户提供更好的学习体验。

### 三、用户账号

1. 用户需通过手机号注册账号，并设置个人信息后即可使用本应用的完整功能。
2. 用户应妥善保管账号信息，因用户个人原因导致账号泄露所引起的损失由用户自行承担。
3. 用户不得将账号转让、出售或出借给他人使用。

### 四、用户行为规范

1. 用户应遵守中华人民共和国相关法律法规，不得利用本应用从事任何违法违规活动。
2. 用户不得通过任何方式破坏或试图破坏本应用的正常运行。
3. 用户不得使用任何自动化工具或脚本访问本应用。

### 五、知识产权

1. 本应用的所有内容，包括但不限于文字、图片、音频、视频、软件、界面设计等，均受知识产权法律保护。
2. 未经书面授权，任何人不得复制、修改、传播本应用的任何内容。

### 六、免责声明

1. 本应用仅供学习参考使用，不构成任何形式的教育承诺或保证。
2. 因不可抗力导致的服务中断，本应用不承担任何责任。

### 七、协议修改

我们有权根据需要修改本协议条款，修改后的协议将在应用内公示。继续使用本应用即视为同意修改后的协议。

### 八、联系方式

如有任何问题，请通过应用内反馈功能与我们联系。
`.trim()

const PRIVACY_CONTENT = `
## 算力先锋隐私政策

**更新日期：2025年1月1日**

### 一、我们收集的信息

1. **注册信息**：手机号码（用于账号注册和登录验证）。
2. **个人信息**：昵称、头像、学习阶段、学习目标、年级等（由用户自愿提供）。
3. **学习数据**：答题记录、测评结果、学习进度、错题记录、成就数据等。
4. **设备信息**：设备型号、操作系统版本等（用于优化应用体验）。

### 二、我们如何使用信息

1. 提供、维护和改进我们的服务。
2. 个性化推荐学习内容和题目难度。
3. 生成学习报告和统计数据。
4. 防止欺诈和保障应用安全。

### 三、信息存储与安全

1. 我们采用业界通用的安全技术保护您的个人信息。
2. 您的数据存储在安全的服务器上，采取加密传输和存储措施。
3. 我们制定了严格的数据访问权限控制，仅授权人员可访问用户数据。

### 四、信息共享

1. 我们不会将您的个人信息出售给任何第三方。
2. 以下情况除外：
   - 获得您的明确同意；
   - 根据法律法规或政府主管部门的强制性要求；
   - 为维护应用及用户的合法权益。

### 五、您的权利

1. 您有权访问、更正、删除您的个人信息。
2. 您有权撤回授权同意。
3. 您有权注销账号，账号注销后我们将删除您的个人信息。

### 六、未成年人保护

1. 我们高度重视未成年人个人信息保护。
2. 对于不满14周岁的未成年人，我们会在其监护人同意的前提下收集和使用信息。
3. 我们不会将未成年人信息用于任何商业推广目的。

### 七、隐私政策更新

我们可能会不时更新本隐私政策。更新后的政策将在应用内公示，继续使用即表示同意更新后的政策。

### 八、联系我们

如您对本隐私政策有任何疑问，请通过应用内反馈功能与我们联系。
`.trim()

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n')
  return (
    <div className="space-y-3">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-lg font-bold text-foreground mt-6 first:mt-0">{line.slice(3)}</h2>
        }
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-base font-bold text-foreground mt-4">{line.slice(4)}</h3>
        }
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} className="text-sm text-muted-foreground font-bold">{line.slice(2, -2)}</p>
        }
        if (line.match(/^\d+\.\s\*\*/)) {
          const match = line.match(/^(\d+\.\s)\*\*(.+?)\*\*(.*)$/)
          if (match) {
            return (
              <p key={i} className="text-sm text-muted-foreground leading-relaxed pl-2">
                {match[1]}<strong>{match[2]}</strong>{match[3]}
              </p>
            )
          }
        }
        if (line.match(/^\d+\.\s/)) {
          return <p key={i} className="text-sm text-muted-foreground leading-relaxed pl-2">{line}</p>
        }
        if (line.startsWith('   - ') || line.startsWith('- ')) {
          return <p key={i} className="text-sm text-muted-foreground leading-relaxed pl-6">• {line.replace(/^[\s-]+\s/, '')}</p>
        }
        if (line.trim() === '') {
          return <div key={i} className="h-1" />
        }
        return <p key={i} className="text-sm text-muted-foreground leading-relaxed">{line}</p>
      })}
    </div>
  )
}

export default function Agreement() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') === 'privacy' ? 'privacy' : 'agreement'
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab)

  return (
    <motion.div
      className="min-h-screen bg-white flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="h-1 bg-gradient-to-r from-primary via-[#1CB0F6] to-primary" />

      <div className="flex-1 flex flex-col">
        {/* 返回按钮 */}
        <div className="px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">返回</span>
          </button>
        </div>

        {/* Tab 切换 */}
        <div className="flex px-6 gap-2 mb-4">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.key
                  ? 'bg-primary text-white shadow-[0_3px_0_#46a302]'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 内容 */}
        <div className="flex-1 px-6 pb-8 overflow-y-auto">
          <div className="bg-card rounded-2xl p-6 shadow-sm">
            <MarkdownRenderer
              content={activeTab === 'agreement' ? AGREEMENT_CONTENT : PRIVACY_CONTENT}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
