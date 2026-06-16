import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'

export default function DailyGoals() {
  useLoad(() => {
    console.log('DailyGoals page loaded.')
  })

  return (
    <View className='shell' style={{ padding: '16px' }}>
      <View style={{
        background: 'linear-gradient(135deg, #FFC800 0%, #FF4B4B 100%)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '16px'
      }}>
        <Text style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>
          每日目标
        </Text>
        <Text style={{
          display: 'block',
          color: 'rgba(255,255,255,0.9)',
          fontSize: '13px',
          marginTop: '6px'
        }}>
          坚持学习，成就更好的自己
        </Text>
      </View>

      <View style={{
        background: '#F9FAFB',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #E5E7EB'
      }}>
        <Text style={{ color: '#3C3C3C', fontSize: '16px', fontWeight: '600' }}>
          今日进度
        </Text>

        <View style={{ marginTop: '16px' }}>
          <View style={{
            background: '#fff',
            borderRadius: '10px',
            padding: '16px',
            border: '1px solid #E5E7EB'
          }}>
            <View style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <Text style={{ color: '#3C3C3C', fontSize: '14px' }}>练习题目</Text>
              <Text style={{ color: '#58CC02', fontSize: '14px', fontWeight: '600' }}>12/20</Text>
            </View>
            <View style={{ height: '8px', background: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
              <View style={{ width: '60%', height: '100%', background: '#58CC02', borderRadius: '4px' }} />
            </View>
          </View>

          <View style={{
            background: '#fff',
            borderRadius: '10px',
            padding: '16px',
            marginTop: '12px',
            border: '1px solid #E5E7EB'
          }}>
            <View style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <Text style={{ color: '#3C3C3C', fontSize: '14px' }}>学习时长</Text>
              <Text style={{ color: '#1CB0F6', fontSize: '14px', fontWeight: '600' }}>45/60 分钟</Text>
            </View>
            <View style={{ height: '8px', background: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
              <View style={{ width: '75%', height: '100%', background: '#1CB0F6', borderRadius: '4px' }} />
            </View>
          </View>

          <View style={{
            background: '#fff',
            borderRadius: '10px',
            padding: '16px',
            marginTop: '12px',
            border: '1px solid #E5E7EB'
          }}>
            <View style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <Text style={{ color: '#3C3C3C', fontSize: '14px' }}>连续打卡</Text>
              <Text style={{ color: '#FFC800', fontSize: '14px', fontWeight: '600' }}>7 天</Text>
            </View>
            <View style={{ height: '8px', background: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
              <View style={{ width: '70%', height: '100%', background: '#FFC800', borderRadius: '4px' }} />
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}
