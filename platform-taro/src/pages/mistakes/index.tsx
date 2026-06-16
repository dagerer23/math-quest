import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'

export default function Mistakes() {
  useLoad(() => {
    console.log('Mistakes page loaded.')
  })

  return (
    <View className='shell' style={{ padding: '16px' }}>
      <View style={{
        background: 'linear-gradient(135deg, #FF4B4B 0%, #CE82FF 100%)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '16px'
      }}>
        <Text style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>
          错题本
        </Text>
        <Text style={{
          display: 'block',
          color: 'rgba(255,255,255,0.9)',
          fontSize: '13px',
          marginTop: '6px'
        }}>
          温故知新，攻克薄弱知识点
        </Text>
      </View>

      <View style={{
        background: '#FFE4E4',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #FF4B4B'
      }}>
        <Text style={{ color: '#FF4B4B', fontSize: '16px', fontWeight: '600' }}>
          暂无错题记录
        </Text>
        <Text style={{ color: '#777', fontSize: '13px', marginTop: '8px' }}>
          继续保持！您今日没有新的错题记录。
        </Text>
      </View>

      <View style={{
        background: '#F9FAFB',
        borderRadius: '12px',
        padding: '20px',
        marginTop: '16px',
        border: '1px solid #E5E7EB'
      }}>
        <Text style={{ color: '#3C3C3C', fontSize: '16px', fontWeight: '600' }}>
          错题分类
        </Text>
        <View style={{ marginTop: '12px' }}>
          {[
            { type: '几何', count: 5, color: '#1CB0F6', bg: '#E0F4FF' },
            { type: '代数', count: 3, color: '#58CC02', bg: '#E8F9D8' },
            { type: '应用题', count: 8, color: '#FFC800', bg: '#FFF5D6' },
          ].map((item, index) => (
            <View key={index} style={{
              background: item.bg,
              borderRadius: '10px',
              padding: '14px 16px',
              marginTop: index > 0 ? '10px' : 0,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Text style={{ color: item.color, fontSize: '14px', fontWeight: '500' }}>
                {item.type}
              </Text>
              <View style={{
                background: item.color,
                borderRadius: '12px',
                padding: '4px 10px'
              }}>
                <Text style={{ color: '#fff', fontSize: '12px', fontWeight: '600' }}>
                  {item.count} 题
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}
