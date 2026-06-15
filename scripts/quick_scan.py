"""
快速扫描首页 - 直接设置完整用户状态
"""
from playwright.sync_api import sync_playwright
import json

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 390, 'height': 844})
        page = context.new_page()

        # 先访问登录页面获取 localStorage 权限
        page.goto("http://localhost:5173/login", timeout=15000)
        page.wait_for_load_state('networkidle', timeout=15000)
        page.wait_for_timeout(500)

        # 设置完整用户状态
        user_data = {
            "profile": {
                "nickname": "数学小达人",
                "avatar": "🧮",
                "learningStage": "primary",
                "learningGoal": "consolidation",
                "targetGrade": 1
            },
            "grade": 1,
            "xp": 500,
            "coins": 100,
            "diamonds": 10,
            "hearts": 5,
            "maxHearts": 5,
            "streak": 3,
            "comboMax": 0,
            "rank": "青铜",
            "unlockedLevels": ["g1-L1", "g1-L2", "g1-L3", "g1-L4", "g1-L5"],
            "completedLevels": {
                "g1-L1": {"stars": 3, "bestXp": 100, "attempts": 1, "completedAt": 1704067200000}
            },
            "mistakeIds": [],
            "mistakeMastery": {},
            "achievements": [],
            "achievementsMeta": [],
            "systemConfigs": {"heart.recover_minutes": "30"},
            "settings": {"sound": True, "vibration": True},
            "lastActiveDate": "2024-01-01",
            "lastCheckInDate": "2024-01-01",
            "assessment": {
                "id": "test-assessment",
                "completedAt": 1704067200000,
                "score": 80,
                "recommendedDifficulty": 3,
                "answers": {"q1": 1, "q2": 2, "q3": 3}
            },
            "dailyGoals": [],
            "dailyGoalDate": "2024-01-01",
            "dailyXp": 50,
            "dailyQuestions": 3,
            "isLoggedIn": True,
            "userId": "test_user_123",
            "learningStats": {
                "totalQuestions": 10,
                "correctQuestions": 8,
                "totalDays": 5,
                "weeklyStreak": 3,
                "knowledgeProgress": {}
            },
            "hasCompletedOnboarding": True,
            "lastLoginAt": 1704067200000
        }

        user_json = json.dumps({"state": user_data, "version": 0})
        
        page.evaluate(f"""
            localStorage.setItem('mathquest.user.v1', '{user_json}');
            localStorage.setItem('mq_token', 'test_token_12345');
        """)

        # 刷新到首页
        page.goto("http://localhost:5173/", timeout=15000)
        page.wait_for_load_state('networkidle', timeout=15000)
        page.wait_for_timeout(3000)

        print("="*60)
        print("页面标题:", page.title())
        print("当前URL:", page.url)
        print("="*60)

        # 检查所有按钮
        all_buttons = page.locator('button').all()
        print(f"\n【按钮列表】共 {len(all_buttons)} 个按钮")
        for i, btn in enumerate(all_buttons[:30]):
            try:
                text = btn.inner_text().strip()[:50]
                is_enabled = btn.is_enabled()
                is_visible = btn.is_visible()
                print(f"  [{i}] 文本: '{text}' | 可见: {is_visible} | 可点击: {is_enabled}")
            except Exception as e:
                print(f"  [{i}] 获取失败: {str(e)[:30]}")

        # 检查关卡相关元素
        print("\n" + "="*60)
        print("【关卡入口检查】")
        level_cards = page.locator('[class*="level-card"], [class*="map-node"], [role="button"]').all()
        print(f"找到 {len(level_cards)} 个关卡卡片元素")

        # 检查底部导航
        print("\n" + "="*60)
        print("【底部导航检查】")
        bottom_nav = page.locator('nav, [class*="BottomNav"], [class*="bottom-nav"]').first
        if bottom_nav.is_visible():
            nav_items = bottom_nav.locator('button, a').all()
            print(f"底部导航按钮: {len(nav_items)} 个")
            for i, item in enumerate(nav_items):
                try:
                    text = item.inner_text().strip()
                    print(f"  [{i}] {text}")
                except:
                    pass
        else:
            print("底部导航未找到")

        # 检查资源按钮
        print("\n" + "="*60)
        print("【资源按钮检查】")
        page_html = page.content()
        has_heart = '❤️' in page_html or 'heart' in page_html.lower() or 'FF4B4B' in page_html
        has_coins = '💰' in page_html or 'coins' in page_html.lower() or 'gold' in page_html.lower() or 'E5A13B' in page_html
        has_diamonds = '💎' in page_html or 'gem' in page_html.lower() or 'diamond' in page_html.lower() or '5B8DEF' in page_html
        print(f"  ❤️ 心按钮: {'存在' if has_heart else '缺失'}")
        print(f"  💰 金币按钮: {'存在' if has_coins else '缺失'}")
        print(f"  💎 钻石按钮: {'存在' if has_diamonds else '缺失'}")

        # 保存页面源码
        html_content = page.content()
        with open('/tmp/home_final_scan.html', 'w', encoding='utf-8') as f:
            f.write(html_content)

        # 截图
        page.screenshot(path='/tmp/home_final_scan.png', full_page=True)
        print("\n✅ 截图已保存: /tmp/home_final_scan.png")
        print("✅ HTML源码已保存: /tmp/home_final_scan.html")

        browser.close()

if __name__ == '__main__':
    main()