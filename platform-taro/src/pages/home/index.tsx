import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'

export default function Home() {
  useLoad(() => {
    console.log('Home page loaded.')
  })

  return (
    <View className='shell' style={{ padding: '16px' }}>
      <View style={{
        background: 'linear-gradient(135deg, #58CC02 0%, #1CB0F6 100%)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '16px'
      }}>
        <Text style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>
          首页
        </Text>
        <Text style={{
          display: 'block',
          color: 'rgba(255,255,255,0.9)',
          fontSize: '13px',
          marginTop: '6px'
        }}>
          欢迎来到数学思维训练
        </Text>
      </View>

      <View style={{
        background: '#F9FAFB',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #E5E7EB'
      }}>
        <Text style={{ color: '#3C3C3C', fontSize: '16px', fontWeight: '600' }}>
          功能入口
        </Text>
        <View style={{ marginTop: '16px' }}>
          {[
            { bg: '#E8F9D8', color: '#58CC02', title: '开始练习', desc: '每日数学题目' },
            { bg: '#E0F4FF', color: '#1CB0F6', title: '查看目标', desc: '学习进度追踪' },
            { bg: '#FFE4E4', color: '#FF4B4B', title: '错题本', desc: '巩固薄弱知识点' },
            { bg: '#FFF5D6', color: '#FFC800', title: '排行榜', desc: '与学习者竞争' },
          ].map((item, index) => (
            <View key={index} style={{
              background: item.bg,
              borderRadius: '10px',
              padding: '16px',
              marginTop: index > 0 ? '12px' : 0,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <View>
                <Text style={{ color: item.color, fontSize: '15px', fontWeight: '600' }}>
                  {item.title}
                </Text>
                <Text style={{ color: '#777', fontSize: '12px', marginTop: '2px' }}>
                  {item.desc}
                </Text>
              </View>
              <View style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: item.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Text style={{ color: '#fff', fontSize: '16px' }}>›</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}
