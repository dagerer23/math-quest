import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'

export default function Index() {
  useLoad(() => {
    console.log('Index page loaded.')
  })

  return (
    <View className='shell' style={{ padding: '20px' }}>
      <View style={{
        background: 'linear-gradient(135deg, #58CC02 0%, #1CB0F6 100%)',
        borderRadius: '16px',
        padding: '32px 24px',
        textAlign: 'center'
      }}>
        <Text style={{ color: '#fff', fontSize: '28px', fontWeight: 'bold' }}>
          Hello Math Quest
        </Text>
        <Text style={{
          display: 'block',
          color: 'rgba(255,255,255,0.9)',
          fontSize: '14px',
          marginTop: '8px'
        }}>
          数学思维训练平台
        </Text>
      </View>

      <View style={{
        marginTop: '24px',
        background: '#F9FAFB',
        borderRadius: '12px',
        padding: '16px'
      }}>
        <Text style={{ color: '#3C3C3C', fontSize: '16px', fontWeight: '600' }}>
          Theme Colors
        </Text>
        <View style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
          {[
            { bg: '#58CC02', label: 'Primary' },
            { bg: '#1CB0F6', label: 'Secondary' },
            { bg: '#FFC800', label: 'Accent' },
            { bg: '#FF4B4B', label: 'Destructive' },
            { bg: '#CE82FF', label: 'Purple' },
          ].map(item => (
            <View key={item.label} style={{
              width: '60px',
              height: '60px',
              background: item.bg,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingBottom: '4px'
            }}>
              <Text style={{ color: '#fff', fontSize: '10px' }}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}
