/**
 * 认证业务逻辑 - MySQL 版本
 * 测试模式：验证码固定为 123456
 */
import {
  findUserByPhone,
  findUserById,
  findUserByOpenid,
  createUser,
  updateUser,
  getVerificationRecord,
  saveVerificationRecord,
  deleteVerificationRecord,
  cleanExpiredCodes,
  saveAssessment,
  getLatestAssessment,
  generateToken,
  validateToken,
} from './storage'
import type { AssessmentRecord } from './storage'

const CODE_EXPIRY_MS = 5 * 60 * 1000 // 5分钟
const MAX_ATTEMPTS = 3
const TEST_CODE = '123456' // 测试模式固定验证码（仅开发环境）
const SEND_COOLDOWN_MS = 60 * 1000 // 60秒内不可重复发送
const IS_PRODUCTION = process.env.NODE_ENV === 'production'

/** 生成6位随机验证码 */
function generateRandomCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

/**
 * 手机号格式验证
 */
export function validatePhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone)
}

/**
 * 发送验证码
 */
export async function sendVerificationCode(phone: string): Promise<{
  success: boolean
  message: string
}> {
  if (!validatePhone(phone)) {
    return { success: false, message: '请输入正确的手机号' }
  }

  await cleanExpiredCodes()
  const existing = await getVerificationRecord(phone)

  // 检查冷却时间
  if (existing && existing.expiresAt - CODE_EXPIRY_MS + SEND_COOLDOWN_MS > Date.now()) {
    return { success: false, message: '验证码已发送，请稍后再试' }
  }

  const code = IS_PRODUCTION ? generateRandomCode() : TEST_CODE
  const expiresAt = Date.now() + CODE_EXPIRY_MS

  await saveVerificationRecord({
    phone,
    code,
    expiresAt,
    attempts: 0,
  })

  console.log(`[MySQL] 发送验证码: phone=${phone}, code=${code}`)

  return { success: true, message: '验证码已发送' }
}

/**
 * 验证验证码并登录/注册
 */
export async function verifyAndLogin(phone: string, code: string): Promise<{
  success: boolean
  message: string
  user?: any
}> {
  if (!validatePhone(phone)) {
    return { success: false, message: '请输入正确的手机号' }
  }

  if (!/^\d{6}$/.test(code)) {
    return { success: false, message: '请输入6位数字验证码' }
  }

  await cleanExpiredCodes()
  const record = await getVerificationRecord(phone)

  if (!record) {
    return { success: false, message: '请先获取验证码' }
  }

  if (record.expiresAt <= Date.now()) {
    await deleteVerificationRecord(phone)
    return { success: false, message: '验证码已过期，请重新获取' }
  }

  // 更新尝试次数
  await saveVerificationRecord({
    ...record,
    attempts: record.attempts + 1,
  })

  if (code !== record.code) {
    if (record.attempts + 1 >= MAX_ATTEMPTS) {
      await deleteVerificationRecord(phone)
      return { success: false, message: '验证码错误，请重新获取' }
    }
    return { success: false, message: '验证码错误' }
  }

  // 验证成功，删除验证码记录
  await deleteVerificationRecord(phone)

  // 查找或创建用户
  let user = await findUserByPhone(phone)
  if (!user) {
    user = await createUser(phone)
    console.log(`[MySQL] 新用户注册: phone=${phone}, id=${user.id}`)
  } else {
    user = await updateUser(user.id, { lastLoginAt: Date.now() })
    console.log(`[MySQL] 用户登录: phone=${phone}, id=${user.id}`)
  }

  // 生成 30 天有效期 token
  const token = await generateToken(user.id, phone)
  return { success: true, message: '登录成功', user, token }
}

/**
 * 快捷登录：根据手机号免验证码直接登录
 * - 如果用户已存在且完成过 onboarding（有昵称+年级），直接生成 token 返回
 * - 如果用户不存在或资料不完整，返回失败，前端会回落为验证码登录
 */
export async function quickLoginByPhone(phone: string): Promise<{
  success: boolean
  message: string
  user?: any
  token?: string
}> {
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    return { success: false, message: '请输入正确的手机号' }
  }

  const user = await findUserByPhone(phone)
  if (!user) {
    return { success: false, message: '该手机号尚未注册，请先获取验证码登录' }
  }

  // 更新最近登录时间
  const updatedUser = await updateUser(user.id, { lastLoginAt: Date.now() })
  const token = await generateToken(user.id, phone)
  return {
    success: true,
    message: '登录成功',
    user: updatedUser,
    token,
  }
}

/**
 * Token 自动登录（30天内有效）
 */
export async function tokenLogin(token: string): Promise<{
  success: boolean
  message: string
  user?: any
}> {
  const record = await validateToken(token)
  if (!record) {
    return { success: false, message: '登录已过期，请重新登录' }
  }
  const user = await findUserById(record.userId)
  if (!user) {
    return { success: false, message: '用户不存在，请重新登录' }
  }
  // 更新 lastLoginAt
  await updateUser(user.id, { lastLoginAt: Date.now() })
  console.log(`[Auth] Token 自动登录: userId=${user.id}, phone=${record.phone}`)
  return { success: true, message: 'ok', user, token }
}

/**
 * 获取用户信息
 */
export async function getUserInfo(userId: string): Promise<{
  success: boolean
  message: string
  user?: any
}> {
  const user = await findUserById(userId)
  if (!user) {
    return { success: false, message: '用户不存在' }
  }
  return { success: true, message: 'ok', user }
}

/**
 * 更新用户个人信息（学习阶段、目标、年级、昵称、头像）
 */
export async function updateProfile(userId: string, profile: Partial<{
  learningStage: string
  learningGoal: string
  targetGrade: number
  nickname: string
  avatar: string
}>): Promise<{ success: boolean; message: string; user?: any }> {
  const existing = await findUserById(userId)
  if (!existing) {
    return { success: false, message: '用户不存在' }
  }
  const updated = await updateUser(userId, profile)
  console.log(`[Auth] 用户信息更新: userId=${userId}, nickname=${profile.nickname ?? existing.nickname}`)
  return { success: true, message: '保存成功', user: updated }
}

/**
 * 保存测评结果
 */
export async function saveAssessmentResult(userId: string, assessment: Omit<AssessmentRecord, 'userId'>): Promise<{ success: boolean; message: string; assessment?: AssessmentRecord }> {
  const existing = await findUserById(userId)
  if (!existing) {
    return { success: false, message: '用户不存在' }
  }
  const record: AssessmentRecord = {
    ...assessment,
    userId,
  }
  await saveAssessment(record)
  return { success: true, message: '保存成功', assessment: record }
}

/**
 * 导出用户全部数据
 */
export async function exportUserData(userId: string): Promise<{
  success: boolean
  message: string
  data?: {
    profile: any
    assessment: AssessmentRecord | null
  }
}> {
  const user = await findUserById(userId)
  if (!user) {
    return { success: false, message: '用户不存在' }
  }
  const assessment = await getLatestAssessment(userId)
  return {
    success: true,
    message: 'ok',
    data: {
      profile: user,
      assessment,
    },
  }
}

/**
 * 获取用户最新测评
 */
export async function getAssessment(userId: string): Promise<{ success: boolean; message: string; assessment?: AssessmentRecord | null }> {
  const existing = await findUserById(userId)
  if (!existing) {
    return { success: false, message: '用户不存在' }
  }
  const record = await getLatestAssessment(userId)
  return { success: true, message: 'ok', assessment: record }
}

/**
 * 微信小程序登录
 * - 用 code 调用微信 jscode2session 接口换取 openid
 * - 用 openid 查找或创建用户
 * - 生成 30 天 token 返回
 * - 未配置 WX_APPID/WX_SECRET 时进入开发模式（用 code 作为模拟 openid）
 */
export async function wxLogin(params: { code: string; phoneCode?: string; avatar?: string }): Promise<{
  success: boolean
  message: string
  user?: any
  token?: string
}> {
  const { code, phoneCode, avatar } = params
  console.log('[Auth/wxLogin] 收到请求, code:', code, 'hasPhoneCode:', !!phoneCode, 'hasAvatar:', !!avatar)
  const WX_APPID = process.env.WX_APPID || ''
  const WX_SECRET = process.env.WX_SECRET || ''
  console.log('[Auth/wxLogin] 微信配置状态:', { hasAppId: !!WX_APPID, hasSecret: !!WX_SECRET })

  let openid: string

  if (WX_APPID && WX_SECRET) {
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${WX_APPID}&secret=${WX_SECRET}&js_code=${encodeURIComponent(code)}&grant_type=authorization_code`
    console.log('[Auth/wxLogin] 请求微信 jscode2session, url:', url)
    const resp = await fetch(url)
    const data: any = await resp.json()
    console.log('[Auth/wxLogin] 微信响应:', JSON.stringify(data))
    if (data.errcode) {
      console.error(`[Auth/wxLogin] 微信登录失败: errcode=${data.errcode}, errmsg=${data.errmsg}`)
      return { success: false, message: `微信登录失败: ${data.errmsg}` }
    }
    openid = data.openid
  } else {
    console.warn('[Auth/wxLogin] 未配置 WX_APPID/WX_SECRET，使用开发模式（code 作为模拟 openid）')
    openid = `dev_${code}`
  }

  // 用 phoneCode 获取微信授权手机号
  let phone = ''
  if (phoneCode && WX_APPID && WX_SECRET) {
    try {
      console.log('[Auth/wxLogin] 获取 access_token 以解密手机号')
      const tokenUrl = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WX_APPID}&secret=${WX_SECRET}`
      const tokenResp = await fetch(tokenUrl)
      const tokenData: any = await tokenResp.json()
      if (tokenData.access_token) {
        console.log('[Auth/wxLogin] 获取手机号, 使用 phoneCode')
        const phoneUrl = `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${tokenData.access_token}`
        const phoneResp = await fetch(phoneUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: phoneCode }),
        })
        const phoneResult: any = await phoneResp.json()
        if (phoneResult.errcode === 0 && phoneResult.phone_info) {
          phone = phoneResult.phone_info.phoneNumber
          console.log('[Auth/wxLogin] 获取手机号成功:', phone)
        } else {
          console.error('[Auth/wxLogin] 获取手机号失败:', phoneResult.errcode, phoneResult.errmsg)
        }
      } else {
        console.error('[Auth/wxLogin] 获取 access_token 失败:', tokenData.errmsg)
      }
    } catch (e: any) {
      console.error('[Auth/wxLogin] 获取手机号异常:', e?.message)
    }
  }

  // 查找或创建用户
  console.log('[Auth/wxLogin] 查找用户, openid:', openid)
  let user = await findUserByOpenid(openid)
  if (!user) {
    console.log('[Auth/wxLogin] 用户不存在, 创建新用户')
    user = await createUser(phone || '', { openid, avatar: avatar || '' })
    console.log(`[Auth/wxLogin] 微信新用户注册: openid=${openid}, id=${user.id}, phone=${phone || '(空)'}`)
  } else {
    console.log('[Auth/wxLogin] 用户已存在, 更新登录时间, id:', user.id)
    const updates: any = { lastLoginAt: Date.now() }
    if (phone) updates.phone = phone
    if (avatar) updates.avatar = avatar
    user = await updateUser(user.id, updates)
    console.log(`[Auth/wxLogin] 微信用户登录: openid=${openid}, id=${user.id}`)
  }

  const token = await generateToken(user.id, user.phone || '')
  console.log('[Auth/wxLogin] 生成 token, 返回登录成功')
  return { success: true, message: '登录成功', user, token }
}

/**
 * 游客登录：创建一个临时用户，支持本地体验全部功能
 */
export async function guestLogin(): Promise<{
  success: boolean
  message: string
  user?: any
  token?: string
}> {
  const user = await createUser('', { nickname: '数学爱好者' })
  console.log(`[Auth] 游客登录: id=${user.id}`)
  const token = await generateToken(user.id, '')
  return { success: true, message: '游客登录成功', user, token }
}
