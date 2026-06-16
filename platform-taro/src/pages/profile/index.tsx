import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'

export default function Profile() {
  useLoad(() => {
    console.log('Profile page loaded.')
  })

  return (
    <View className='shell' style={{ padding: '16px' }}>
      <View style={{
        background: 'linear-gradient(135deg, #CE82FF 0%, #1CB0F6 100%)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '16px'
      }}>
        <View style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '12px'
        }}>
          <Text style={{ fontSize: '32px' }}>👤</Text>
        </View>
        <Text style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>
          我的
        </Text>
        <Text style={{
          display: 'block',
          color: 'rgba(255,255,255,0.9)',
          fontSize: '13px',
          marginTop: '6px'
        }}>
          个人中心
        </Text>
      </View>

      <View style={{
        background: '#F9FAFB',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #E5E7EB'
      }}>
        <Text style={{ color: '#3C3C3C', fontSize: '16px', fontWeight: '600' }}>
          学习统计
        </Text>
        <View style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
          {[
            { label: '总学习时长', value: '128h', bg: '#E8F9D8', color: '#58CC02' },
            { label: '完成题目', value: '2,450', bg: '#E0F4FF', color: '#1CB0F6' },
            { label: '正确率', value: '87%', bg: '#FFF5D6', color: '#FFC800' },
            { label: '连续打卡', value: '15天', bg: '#F3E8FF', color: '#CE82FF' },
          ].map((item, index) => (
            <View key={index} style={{
              width: 'calc(50% - 6px)',
              background: item.bg,
              borderRadius: '10px',
              padding: '16px'
            }}>
              <Text style={{ color: item.color, fontSize: '20px', fontWeight: 'bold' }}>
                {item.value}
              </Text>
              <Text style={{ color: '#777', fontSize: '12px', marginTop: '4px' }}>
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{
        background: '#F9FAFB',
        borderRadius: '12px',
        padding: '20px',
        marginTop: '16px',
        border: '1px solid #E5E7EB'
      }}>
        <Text style={{ color: '#3C3C3C', fontSize: '16px', fontWeight: '600' }}>
          设置
        </Text>
        <View style={{ marginTop: '12px' }}>
          {['学习提醒', '消息通知', '隐私设置', '关于我们'].map((item, index) => (
            <View key={index} style={{
              background: '#fff',
              borderRadius: '10px',
              padding: '14px 16px',
              marginTop: index > 0 ? '8px' : 0,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid #E5E7EB'
            }}>
              <Text style={{ color: '#3C3C3C', fontSize: '14px' }}>
                {item}
              </Text>
              <Text style={{ color: '#9CA3AF', fontSize: '16px' }}>›</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}
