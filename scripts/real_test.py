"""
最精确测试 - 先设置状态再访问首页
"""
from playwright.sync_api import sync_playwright
import time

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=200)
        context = browser.new_context(viewport={'width': 390, 'height': 844})
        page = context.new_page()

        # 1. 先访问页面
        page.goto("http://localhost:5173/", timeout=15000)
        time.sleep(1)

        # 2. 用eval设置完成状态 - 模拟已完成onboarding和测评
        page.evaluate("""
            () => {
                // 构造用户状态
                const state = {
                    profile: { nickname: '测试', avatar: '🧒', learningStage: 'primary', learningGoal: 'consolidation', targetGrade: 1 },
                    grade: 1,
                    xp: 0,
                    coins: 80,
                    diamonds: 5,
                    hearts: 5,
                    maxHearts: 5,
                    streak: 1,
                    comboMax: 0,
                    rank: '青铜',
                    unlockedLevels: ['g1-L1', 'g1-L2', 'g1-L3'],
                    completedLevels: {},
                    mistakeIds: [],
                    mistakeMastery: {},
                    achievements: [],
                    achievementsMeta: [],
                    systemConfigs: { 'assessment.reward_xp': '100', 'assessment.reward_coins': '50', 'heart.recover_minutes': '30' },
                    settings: { sound: true, vibration: true },
                    lastActiveDate: '2024-01-01',
                    lastCheckInDate: undefined,
                    assessment: { id: 'test', completedAt: Date.now(), score: 80, recommendedDifficulty: 2, answers: {} },
                    dailyGoals: [],
                    dailyGoalDate: undefined,
                    dailyXp: 0,
                    dailyQuestions: 0,
                    isLoggedIn: true,
                    userId: 'test_user',
                    learningStats: { totalQuestions: 0, correctQuestions: 0, totalDays: 1, weeklyStreak: 1, knowledgeProgress: {} },
                    hasCompletedOnboarding: true,
                    lastLoginAt: Date.now()
                };
                // 保存到localStorage (zustand persist格式)
                localStorage.setItem('mathquest.user.v1', JSON.stringify({ state: state, version: 0 }));
                localStorage.setItem('mq_token', 'test_token_12345');
            }
        """)
        time.sleep(0.5)

        # 3. 刷新页面
        page.goto("http://localhost:5173/", timeout=5000)
        time.sleep(2.5)
        page.screenshot(path='/tmp/real_1_home.png')
        print("1️⃣  首页 URL:", page.url)

        # 4. 检查首页内容
        info = page.evaluate("""
            () => {
                const html = document.body.innerHTML;
                const btns = [];
                for (let b of document.querySelectorAll('button')) {
                    if (b.offsetParent !== null) {
                        btns.push({ text: b.textContent.trim().substring(0, 25), disabled: b.disabled });
                    }
                }
                const links = [];
                for (let a of document.querySelectorAll('a')) {
                    if (a.offsetParent !== null) {
                        links.push(a.textContent.trim().substring(0, 15));
                    }
                }
                return {
                    url: location.pathname,
                    buttons: btns.slice(0, 30),
                    links: [...new Set(links)].slice(0, 10),
                    htmlSize: html.length
                };
            }
        """)
        print(f"   HTML大小: {info['htmlSize']}字")
        print(f"   按钮数: {len(info['buttons'])}")
        print(f"   链接数: {len(info['links'])}")

        print("\n   按钮:")
        for i, b in enumerate(info['buttons']):
            if b['text']:
                status = '启用' if not b['disabled'] else '禁用'
                print(f"     [{i}] {b['text']} - {status}")

        if info['links']:
            print("\n   链接(导航):")
            for i, l in enumerate(info['links']):
                print(f"     [{i}] {l}")

        # 5. 测试导航
        print("\n2️⃣  测试底部导航:")
        for name, path in [('地图', '/'), ('目标', '/daily-goals'), ('错题', '/mistakes'), ('榜单', '/leaderboard'), ('我的', '/profile')]:
            # 直接用URL跳转
            page.goto(f"http://localhost:5173{path}", timeout=5000)
            time.sleep(1.5)
            page.screenshot(path=f'/tmp/real_page_{name}.png')
            btn_count = page.evaluate("() => document.querySelectorAll('button').length")
            page_title = page.evaluate("() => document.title")
            print(f"   ✅ {name}页 - {btn_count}个按钮")

        # 6. 测试Battle页面
        print("\n3️⃣  测试关卡答题:")
        page.goto("http://localhost:5173/", timeout=5000)
        time.sleep(1.5)

        # 点击第一个可点击的关卡按钮
        result = page.evaluate("""
            () => {
                const btns = document.querySelectorAll('button');
                for (let b of btns) {
                    const t = b.textContent.trim();
                    if (!b.disabled && b.offsetParent !== null && t.length > 0) {
                        b.click();
                        return t.substring(0, 20);
                    }
                }
                return 'not-found';
            }
        """)
        time.sleep(2)
        page.screenshot(path='/tmp/real_2_battle.png')
        print(f"   点击结果: {result}")
        print(f"   当前URL: {page.url}")

        # 7. 回到首页
        page.goto("http://localhost:5173/", timeout=5000)
        time.sleep(2)
        page.screenshot(path='/tmp/real_3_home2.png')

        print("\n" + "="*50)
        print("✅ 完成！截图: /tmp/real_*.png")
        print("="*50)

        browser.close()

if __name__ == '__main__':
    main()
