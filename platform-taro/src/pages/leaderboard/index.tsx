import { View, Text } from '@tarojs/components'
import { useLoad } from '@tarojs/taro'

export default function Leaderboard() {
  useLoad(() => {
    console.log('Leaderboard page loaded.')
  })

  const rankList = [
    { rank: 1, name: '张小明', score: 9850, avatar: '🥇', color: '#FFC800' },
    { rank: 2, name: '李小红', score: 9720, avatar: '🥈', color: '#C0C0C0' },
    { rank: 3, name: '王小华', score: 9650, avatar: '🥉', color: '#CD7F32' },
    { rank: 4, name: '陈学习', score: 9400, avatar: '', color: '#777' },
    { rank: 5, name: '刘进步', score: 9250, avatar: '', color: '#777' },
  ]

  return (
    <View className='shell' style={{ padding: '16px' }}>
      <View style={{
        background: 'linear-gradient(135deg, #FFC800 0%, #CE82FF 100%)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '16px'
      }}>
        <Text style={{ color: '#fff', fontSize: '20px', fontWeight: 'bold' }}>
          排行榜
        </Text>
        <Text style={{
          display: 'block',
          color: 'rgba(255,255,255,0.9)',
          fontSize: '13px',
          marginTop: '6px'
        }}>
          与学习者一较高下
        </Text>
      </View>

      <View style={{
        background: '#F9FAFB',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #E5E7EB'
      }}>
        <Text style={{ color: '#3C3C3C', fontSize: '16px', fontWeight: '600' }}>
          本周排名
        </Text>
        <View style={{ marginTop: '16px' }}>
          {rankList.map((item, index) => (
            <View key={index} style={{
              background: index < 3 ? '#FFF5D6' : '#fff',
              borderRadius: '10px',
              padding: '14px 16px',
              marginTop: index > 0 ? '10px' : 0,
              display: 'flex',
              alignItems: 'center',
              border: index < 3 ? `1px solid ${item.color}` : '1px solid #E5E7EB'
            }}>
              <View style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: index < 3 ? item.color : '#E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '12px'
              }}>
                <Text style={{ color: '#fff', fontSize: index < 3 ? '16px' : '14px', fontWeight: 'bold' }}>
                  {item.avatar || item.rank}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#3C3C3C', fontSize: '14px', fontWeight: '500' }}>
                  {item.name}
                </Text>
              </View>
              <Text style={{ color: index < 3 ? item.color : '#777', fontSize: '15px', fontWeight: '600' }}>
                {item.score.toLocaleString()} 分
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}
