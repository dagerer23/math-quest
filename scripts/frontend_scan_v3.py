"""
前端项目全面扫描测试 v3 - 完整登录流程 + 各页面检测
"""
from playwright.sync_api import sync_playwright
import json

issues = {
    "缺陷 (Bug)": [],
    "未实现功能": [],
    "UI/体验问题": [],
    "功能异常": []
}

def add_issue(category, title, description, severity="medium"):
    issues[category].append({
        "title": title,
        "description": description,
        "severity": severity
    })

def login_and_setup(page):
    """完整登录流程"""
    print("\n🔐 执行完整登录流程...")

    # 方法1: 游客模式
    page.goto("http://localhost:5173/login", timeout=15000)
    page.wait_for_load_state('networkidle', timeout=15000)
    page.wait_for_timeout(1000)

    guest_btn = page.locator('button:has-text("游客"), button:has-text("游客模式")')
    if guest_btn.count() > 0:
        print("  点击游客模式...")
        guest_btn.first.click()
        page.wait_for_timeout(2000)
        page.wait_for_load_state('networkidle', timeout=10000)
        print(f"  当前URL: {page.url}")

    # 如果跳转到 onboarding，完成它
    if 'onboarding' in page.url:
        print("  检测到 onboarding 页面，完成引导...")
        page.wait_for_timeout(1000)
        for _ in range(5):
            next_btn = page.locator('button:has-text("下一步"), button:has-text("跳过"), button:has-text("开始"), button:has-text("继续")')
            if next_btn.count() > 0:
                try:
                    next_btn.first.click()
                    page.wait_for_timeout(800)
                    print(f"    点击了按钮，当前URL: {page.url}")
                except:
                    pass
            else:
                break
        page.wait_for_timeout(1000)
        page.wait_for_load_state('networkidle', timeout=10000)
        print(f"  onboarding完成后URL: {page.url}")

    # 方法2: 如果还在登录页，用测试手机号登录
    if 'login' in page.url:
        print("  仍在登录页，尝试测试手机号登录...")
        phone_input = page.locator('input[type="tel"], input[placeholder*="手机"]')
        if phone_input.count() > 0:
            phone_input.first.fill('13800138000')
            page.wait_for_timeout(500)
            send_btn = page.locator('button:has-text("发送"), button:has-text("获取")')
            if send_btn.count() > 0:
                send_btn.first.click()
                page.wait_for_timeout(2000)
                code_input = page.locator('input[type="text"]:not([type="tel"]), input[placeholder*="验证码"]')
                if code_input.count() > 0:
                    code_input.first.fill('123456')
                    page.wait_for_timeout(500)
                    login_btn = page.locator('button:has-text("登录"), button:has-text("确认")')
                    if login_btn.count() > 0:
                        login_btn.first.click()
                        page.wait_for_timeout(3000)
                        page.wait_for_load_state('networkidle', timeout=10000)
                        print(f"  登录后URL: {page.url}")

    # 方法3: 直接设置 localStorage
    if 'login' in page.url or 'onboarding' in page.url:
        print("  通过localStorage强制设置登录状态...")
        page.goto("http://localhost:5173", timeout=10000)
        page.evaluate("""
            var userData = {
                profile: { nickname: '数学小达人', avatar: '🧮', grade: 1, phone: '13800138000' },
                xp: 500, hearts: 5, maxHearts: 5, coins: 100, diamonds: 10, streak: 3,
                lastCheckInDate: '', dailyXp: 50, dailyQuestions: 3,
                dailyGoalDate: new Date().toISOString().split('T')[0],
                knowledgeProgress: {}, dailyGoals: [],
                systemConfigs: { 'heart.recover_minutes': '30' },
                hasCompletedOnboarding: true,
                assessmentAnswers: { g1: 1, g2: 1, g3: 1 },
                isLoggedIn: true, userId: 'test_user_001', rank: { level: 5, title: '数学小达人' },
                unlockedLevels: ['g1-L1', 'g1-L2', 'g1-L3'],
                completedLevels: { 'g1-L1': { stars: 3, bestXp: 100, attempts: 1, completedAt: Date.now() } },
                mistakeIds: [], mistakeMastery: {}, settings: {},
                learningStats: { totalQuestions: 10, correctQuestions: 8, totalXp: 500, totalSessions: 5 },
                achievementsMeta: [], lastLoginAt: Date.now()
            };
            var persistData = { state: userData, version: 0 };
            localStorage.setItem('mathquest.user.v1', JSON.stringify(persistData));
            localStorage.setItem('mq_token', 'test_token_12345');
            localStorage.setItem('lastPhone', '13800138000');
        """)
        page.goto("http://localhost:5173", timeout=10000)
        page.wait_for_load_state('networkidle', timeout=15000)
        page.wait_for_timeout(2000)
        print(f"  设置后URL: {page.url}")

    print(f"  最终URL: {page.url}")
    return 'login' not in page.url and 'onboarding' not in page.url


def scan_and_screenshot(page, name, url):
    """通用页面扫描"""
    print(f"\n{'='*50}")
    print(f"📄 {name}")
    print(f"{'='*50}")
    try:
        page.goto(url, timeout=15000)
        page.wait_for_load_state('networkidle', timeout=15000)
        page.wait_for_timeout(2000)

        # 获取页面文本
        body = page.locator('body').inner_text()[:500]
        print(f"  内容预览: {body[:150]}...")

        # 统计关键元素
        buttons = page.locator('button')
        inputs = page.locator('input')
        svgs = page.locator('svg')
        imgs = page.locator('img')

        print(f"  元素统计: 按钮={buttons.count()}, 输入框={inputs.count()}, SVG={svgs.count()}, 图片={imgs.count()}")

        # 截图
        safe = name.replace('/', '_').replace(' ', '_')
        page.screenshot(path=f'/tmp/{safe}.png', full_page=True)
        print(f"  📸 截图已保存")

        return True

    except Exception as e:
        print(f"  ❌ 错误: {str(e)[:100]}")
        add_issue("缺陷 (Bug)", f"{name} - 加载失败", str(e), "high")
        return False


def test_resource_popup(page):
    """测试资源弹窗"""
    print(f"\n{'='*50}")
    print("🎯 测试资源弹窗")
    print(f"{'='*50}")

    page.goto("http://localhost:5173", timeout=10000)
    page.wait_for_load_state('networkidle', timeout=15000)
    page.wait_for_timeout(2000)

    # 列出所有按钮
    buttons = page.locator('button').all()
    print(f"  首页按钮数: {len(buttons)}")

    for i, btn in enumerate(buttons):
        try:
            text = btn.inner_text().strip()[:30]
            html = btn.inner_html()
            if text or len(html) < 200:
                print(f"  [{i}] {text or html[:50]}")

                # 检查是否是资源按钮
                if any(x in html for x in ['FF4B4B', 'E5A13B', '5B8DEF', 'heart', 'coins', 'gem']):
                    print(f"      ⭐ 可能是资源按钮!")
                    btn.click()
                    page.wait_for_timeout(1000)

                    popup = page.locator('h3, [class*="popup"], [class*="modal"], [class*="sheet"]')
                    if popup.count() > 0:
                        print(f"      ✅ 弹窗打开!")
                        page.screenshot(path='/tmp/resource_popup.png')

                    page.keyboard.press('Escape')
                    page.wait_for_timeout(500)

        except Exception as e:
            pass


def test_battle_flow(page):
    """测试答题流程"""
    print(f"\n{'='*50}")
    print("🎮 测试答题流程")
    print(f"{'='*50}")

    page.goto("http://localhost:5173", timeout=10000)
    page.wait_for_load_state('networkidle', timeout=15000)
    page.wait_for_timeout(2000)

    # 查找可点击的关卡
    clickables = page.locator('[class*="cursor"], button, [role="button"]').all()
    print(f"  可点击元素: {len(clickables)} 个")

    start_found = False
    for i, el in enumerate(clickables):
        try:
            text = el.inner_text().strip()
            html = el.inner_html()[:100]

            # 查找开始/练习按钮
            if any(kw in text for kw in ['开始', '练习', '闯关', '挑战', 'GO', 'Start', 'Play']):
                print(f"  ⭐ 找到开始按钮 [{i}]: {text[:30]}")
                el.click()
                page.wait_for_timeout(3000)
                page.wait_for_load_state('networkidle', timeout=10000)

                current_url = page.url
                print(f"    点击后URL: {current_url}")

                if 'battle' in current_url or 'game' in current_url or 'play' in current_url:
                    print(f"  ✅ 进入答题页面!")
                    page.screenshot(path='/tmp/battle_page.png')

                    # 检查题目
                    question = page.locator('text=/第.*题|题号|Question/')
                    if question.count() > 0:
                        print(f"    ✅ 找到题目指示器")

                    # 检查选项
                    opts = page.locator('button').all()
                    print(f"    选项按钮数: {len(opts)}")
                    for j, opt in enumerate(opts[:6]):
                        try:
                            print(f"      [{j+1}] {opt.inner_text().strip()[:40]}")
                        except:
                            pass

                    start_found = True
                    break

        except Exception as e:
            pass

    if not start_found:
        print(f"  ⚠️ 未找到可点击的关卡入口")
        add_issue("未实现功能", "答题入口缺失", "首页没有可点击的关卡入口按钮", "high")
        page.screenshot(path='/tmp/home_no_start.png')


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 390, 'height': 844},
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)'
        )
        page = context.new_page()

        # 收集控制台错误
        console_errors = []
        def handle_console(msg):
            if msg.type == 'error':
                console_errors.append(msg.text)
        page.on('console', handle_console)

        # 登录
        logged_in = login_and_setup(page)

        if not logged_in:
            print("\n❌ 登录失败，无法继续扫描")
            browser.close()
            return

        # 等待网络空闲后开始扫描
        page.wait_for_timeout(2000)

        # 扫描各页面
        scan_and_screenshot(page, "首页_地图", "http://localhost:5173")
        scan_and_screenshot(page, "每日目标", "http://localhost:5173/daily-goals")
        scan_and_screenshot(page, "错题本", "http://localhost:5173/wrong-questions")
        scan_and_screenshot(page, "排行榜", "http://localhost:5173/leaderboard")
        scan_and_screenshot(page, "个人中心", "http://localhost:5173/profile")

        # 功能测试
        test_resource_popup(page)
        test_battle_flow(page)

        # 控制台错误汇总
        if console_errors:
            print(f"\n{'='*50}")
            print(f"🔴 控制台错误 ({len(console_errors)}条)")
            print(f"{'='*50}")
            for err in console_errors[:10]:
                print(f"  - {err[:120]}")
                add_issue("缺陷 (Bug)", "控制台错误", err[:150], "high")

        browser.close()

        # 汇总
        print(f"\n\n{'='*50}")
        print("📋 扫描结果汇总")
        print(f"{'='*50}")

        total = 0
        for cat, items in issues.items():
            if items:
                print(f"\n【{cat}】({len(items)}项)")
                for item in items:
                    sev_icon = {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "⚪"}.get(item['severity'], "⚪")
                    print(f"  {sev_icon} {item['title']}")
                    print(f"     {item['description'][:100]}")
                total += len(items)

        print(f"\n{'='*50}")
        print(f"共发现 {total} 个问题")
        print(f"{'='*50}")

        with open('/tmp/scan_report_v3.json', 'w', encoding='utf-8') as f:
            json.dump(issues, f, ensure_ascii=False, indent=2)
        print(f"\n📄 报告: /tmp/scan_report_v3.json")
        print(f"📸 截图: /tmp/*.png")

if __name__ == '__main__':
    main()