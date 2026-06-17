export default defineAppConfig({
  pages: [
    'pages/login/index',
    'pages/home/index',
    'pages/daily-goals/index',
    'pages/mistakes/index',
    'pages/leaderboard/index',
    'pages/profile/index'
  ],
  subPackages: [
    {
      root: 'pages-game',
      pages: [
        'assessment/index',
        'battle/index',
        'result/index'
      ]
    },
    {
      root: 'pages-extra',
      pages: [
        'onboarding/index',
        'agreement/index',
        'stats/index'
      ]
    }
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FFFFFF',
    navigationBarTitleText: '数学探险',
    navigationBarTextStyle: 'black',
    backgroundColor: '#F8FAF5'
  },
  tabBar: {
    color: '#777777',
    selectedColor: '#58CC02',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black',
    list: [
      { pagePath: 'pages/home/index', text: '首页', iconPath: 'assets/tab-home.png', selectedIconPath: 'assets/tab-home-active.png' },
      { pagePath: 'pages/daily-goals/index', text: '目标', iconPath: 'assets/tab-goal.png', selectedIconPath: 'assets/tab-goal-active.png' },
      { pagePath: 'pages/mistakes/index', text: '错题', iconPath: 'assets/tab-mistake.png', selectedIconPath: 'assets/tab-mistake-active.png' },
      { pagePath: 'pages/leaderboard/index', text: '榜单', iconPath: 'assets/tab-rank.png', selectedIconPath: 'assets/tab-rank-active.png' },
      { pagePath: 'pages/profile/index', text: '我的', iconPath: 'assets/tab-profile.png', selectedIconPath: 'assets/tab-profile-active.png' }
    ]
  }
})
