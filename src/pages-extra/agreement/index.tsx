import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Card, Spacer } from '@/components/ui/Basic'

// ─── Markdown 渲染器 ────────────────────────────────────────────
function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // 空行 → 间距
    if (line.trim() === '') {
      elements.push(<View key={i} style={{ height: 8 }} />)
      continue
    }

    // ## h2
    if (line.startsWith('## ')) {
      elements.push(
        <Text key={i} style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginTop: 16, marginBottom: 4 }}>
          {line.slice(3)}
        </Text>
      )
      continue
    }

    // ### h3
    if (line.startsWith('### ')) {
      elements.push(
        <Text key={i} style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginTop: 12, marginBottom: 2 }}>
          {line.slice(4)}
        </Text>
      )
      continue
    }

    // 子级 bullet (以空格开头 + "- ")
    const subBulletMatch = line.match(/^(\s+)-\s(.+)$/)
    if (subBulletMatch) {
      elements.push(
        <View key={i} style={{ flexDirection: 'row', paddingLeft: 32, marginBottom: 2 }}>
          <Text style={{ fontSize: 14, color: '#4b5563', lineHeight: 22, marginRight: 6 }}>{'\u2022'}</Text>
          <Text style={{ fontSize: 14, color: '#4b5563', lineHeight: 22, flex: 1 }}>{renderInline(subBulletMatch[2])}</Text>
        </View>
      )
      continue
    }

    // bullet list ("- ")
    if (line.startsWith('- ')) {
      elements.push(
        <View key={i} style={{ flexDirection: 'row', paddingLeft: 16, marginBottom: 2 }}>
          <Text style={{ fontSize: 14, color: '#4b5563', lineHeight: 22, marginRight: 6 }}>{'\u2022'}</Text>
          <Text style={{ fontSize: 14, color: '#4b5563', lineHeight: 22, flex: 1 }}>{renderInline(line.slice(2))}</Text>
        </View>
      )
      continue
    }

    // numbered list ("1. ")
    const numberedMatch = line.match(/^(\d+)\.\s(.+)$/)
    if (numberedMatch) {
      elements.push(
        <View key={i} style={{ flexDirection: 'row', paddingLeft: 16, marginBottom: 2 }}>
          <Text style={{ fontSize: 14, color: '#4b5563', lineHeight: 22, marginRight: 6 }}>{numberedMatch[1]}.</Text>
          <Text style={{ fontSize: 14, color: '#4b5563', lineHeight: 22, flex: 1 }}>{renderInline(numberedMatch[2])}</Text>
        </View>
      )
      continue
    }

    // 普通段落
    elements.push(
      <Text key={i} style={{ fontSize: 14, color: '#4b5563', lineHeight: 22 }}>
        {renderInline(line)}
      </Text>
    )
  }

  return <View style={{ gap: 2 }}>{elements}</View>
}

/** 处理行内 **bold** 语法 */
function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const regex = /\*\*(.+?)\*\*/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let keyIdx = 0

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<Text key={keyIdx++}>{text.slice(lastIndex, match.index)}</Text>)
    }
    parts.push(<Text key={keyIdx++} style={{ fontWeight: 700 }}>{match[1]}</Text>)
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) {
    parts.push(<Text key={keyIdx++}>{text.slice(lastIndex)}</Text>)
  }
  return parts
}

// ─── 协议内容 ──────────────────────────────────────────────────
const userAgreement = `## 算力先锋用户协议

### 总则

1. 欢迎使用算力先锋（以下简称"本应用"）。本协议是您与算力先锋之间关于使用本应用服务所订立的协议。
2. 您在使用本应用服务之前，应当认真阅读并遵守本协议。一旦您使用本应用服务，即视为您已充分理解并同意本协议的全部内容。
3. 本应用有权根据需要不时修改本协议内容，修改后的协议一经公布即替代原协议。

### 服务内容

1. 本应用为用户提供数学学习、练习、测评等教育相关服务。
2. 本应用将不断优化和改进服务内容，为用户提供更优质的学习体验。
3. 本应用保留随时变更、中断或终止部分或全部服务的权利。

### 用户账号

1. 您在注册和使用本应用时，应提供真实、准确、完整的个人信息。
2. 您应妥善保管账号和密码，因您的原因导致账号被盗用或密码泄露的，由您自行承担相关责任。
3. 您不得将账号转让、出售或出借给他人使用。

### 用户行为规范

1. 您在使用本应用时，应遵守中华人民共和国相关法律法规。
2. 您不得利用本应用从事以下活动：
   - 违反宪法或法律法规的行为
   - 危害国家安全、泄露国家秘密的行为
   - 侵犯他人知识产权或其他合法权益的行为
   - 散布虚假信息、扰乱社会秩序的行为
   - 传播暴力、淫秽色情信息的行为
3. 您应对自己在使用本应用过程中的行为承担全部责任。

### 知识产权

1. 本应用所有内容，包括但不限于文字、图片、音频、视频、软件、界面设计等，均受中华人民共和国知识产权法律保护。
2. 未经本应用书面许可，任何人不得以任何形式复制、转载、摘编或传播本应用的任何内容。
3. 您在本应用中产生的学习数据，本应用有权在脱敏后用于改善服务质量。

### 免责声明

1. 本应用对服务不作任何类型的担保，包括但不限于服务的及时性、安全性、准确性。
2. 因不可抗力导致的服务中断，本应用不承担责任。
3. 因您自身原因导致的任何损失，本应用不承担责任。

### 协议修改

1. 本应用有权根据需要修改本协议条款。
2. 修改后的协议将在本应用内公布，自公布之日起生效。
3. 如您不同意修改后的协议，有权停止使用本应用服务。

### 联系方式

如您对本协议有任何疑问，请通过以下方式联系我们：

- 邮箱：support@suanli.com
- 客服电话：400-888-0000`

const privacyPolicy = `## 算力先锋隐私政策

### 收集信息

我们可能收集以下类型的信息：

1. **注册信息**：您注册账号时提供的手机号码、昵称等。
2. **学习数据**：您的学习进度、练习记录、测评结果等。
3. **设备信息**：设备型号、操作系统版本、唯一设备标识符等。
4. **日志信息**：访问时间、访问页面、操作记录等。

### 使用信息

我们收集的信息将用于以下目的：

1. 提供、维护和改善我们的服务。
2. 为您提供个性化的学习推荐和内容。
3. 开发新的服务和功能。
4. 保护服务安全，防止欺诈和违规行为。
5. 遵守法律法规的要求。

### 存储安全

1. 我们采用行业标准的安全措施保护您的个人信息。
2. 您的信息存储在中华人民共和国境内的服务器上。
3. 我们将采取合理措施保护您的信息不被未经授权的访问、使用或泄露。
4. 在我们终止服务后，我们将按规定删除或匿名化处理您的个人信息。

### 信息共享

我们不会向第三方出售您的个人信息。仅在以下情况下，我们可能会共享您的信息：

1. 获得您的明确同意后。
2. 根据法律法规的要求或政府部门的强制性要求。
3. 与我们的关联公司共享，但仅限于本隐私政策所述的目的。
4. 与授权合作伙伴共享，仅用于为我们提供服务支持。

### 用户权利

您对您的个人信息享有以下权利：

1. **访问权**：您有权访问您的个人信息。
2. **更正权**：您有权要求我们更正不准确的个人信息。
3. **删除权**：在特定情况下，您有权要求我们删除您的个人信息。
4. **撤回同意权**：您有权撤回之前给予的同意。
5. **注销权**：您有权注销您的账号。

### 未成年人保护

1. 我们高度重视对未成年人个人信息的保护。
2. 若您是未满14周岁的未成年人，应在监护人指导下使用本应用。
3. 我们收集未成年人信息前，将征得其监护人的同意。
4. 我们不会公开未成年人个人信息，并会对相关信息进行严格保密。

### 隐私政策更新

1. 我们可能会不时更新本隐私政策。
2. 更新后的隐私政策将在本应用内公布。
3. 对于重大变更，我们将通过应用内通知或其他方式提醒您。
4. 继续使用本应用即视为您同意更新后的隐私政策。

### 联系我们

如您对本隐私政策有任何疑问或建议，请通过以下方式联系我们：

- 邮箱：privacy@suanli.com
- 客服电话：400-888-0000
- 办公地址：北京市海淀区中关村科技园`

// ─── 页面组件 ──────────────────────────────────────────────────
type TabKey = 'agreement' | 'privacy'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'agreement', label: '用户协议' },
  { key: 'privacy', label: '隐私政策' },
]

const contentMap: Record<TabKey, string> = {
  agreement: userAgreement,
  privacy: privacyPolicy,
}

export default function AgreementPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('agreement')

  return (
    <View style={{ minHeight: '100vh', background: '#FAFAFA' }}>
      {/* 顶部渐变条 */}
      <View style={{
        height: 8,
        background: 'linear-gradient(90deg, #58CC02, #46a302)',
      }} />

      {/* 导航栏 */}
      <View style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        padding: '12px 16px',
        background: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        borderStyle: 'solid',
      }}>
        <View
          onClick={() => Taro.navigateBack()}
          style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}
        >
          <Text style={{ fontSize: 18, color: '#58CC02' }}>{'‹'}</Text>
          <Text style={{ fontSize: 15, color: '#58CC02', fontWeight: 500 }}>返回</Text>
        </View>
      </View>

      {/* Tab 切换 */}
      <View style={{
        display: 'flex',
        flexDirection: 'row',
        padding: '12px 16px',
        gap: 12,
        background: '#FFFFFF',
      }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <View
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 40,
                borderRadius: 12,
                background: isActive ? '#58CC02' : '#F3F4F6',
                boxShadow: isActive ? '0 2px 8px rgba(88,204,2,0.3)' : 'none',
              }}
            >
              <Text style={{
                fontSize: 15,
                fontWeight: 600,
                color: isActive ? '#FFFFFF' : '#9CA3AF',
              }}>
                {tab.label}
              </Text>
            </View>
          )
        })}
      </View>

      <Spacer size={12} />

      {/* 内容区 */}
      <View style={{ padding: '0 16px 32px' }}>
        <Card padding={20}>
          <MarkdownRenderer content={contentMap[activeTab]} />
        </Card>
      </View>
    </View>
  )
}
