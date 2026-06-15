"""
深度前端测试脚本 - 发现bug和未实现功能
"""
from playwright.sync_api import sync_playwright
import time

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=300)
        context = browser.new_context(viewport={'width': 390, 'height': 844})
        page = context.new_page()

        bugs = []
        unimplemented = []

        def log_bug(desc):
            bugs.append(desc)
            print(f"  🐛 BUG: {desc}")

        def log_unimpl(desc):
            unimplemented.append(desc)
            print(f"  ⚠️  未实现: {desc}")

        def take_screenshot(name):
            page.screenshot(path=f'/tmp/test_{name}.png', full_page=True)
            print(f"  📸 截图: test_{name}.png")

        # ==================== 1. 登录页测试 ====================
        print("\n" + "="*60)
        print("🧪 测试1: 登录页面")
        print("="*60)

        page.goto("http://localhost:5173/login", timeout=15000)
        page.wait_for_load_state('networkidle', timeout=15000)
        time.sleep(1)

        # 检查页面元素
        page_html = page.content()

        # 检查按钮是否可点击
        guest_btn = page.locator('button:has-text("游客模式体验")')
        if guest_btn.count() > 0 and guest_btn.first.is_enabled():
            print("  ✅ 游客模式按钮可点击")
        else:
            log_bug("游客模式按钮禁用或不存在")

        # 检查验证码登录
        verify_btn = page.locator('button:has-text("验证码登录")')
        if verify_btn.count() > 0:
            if verify_btn.first.is_enabled():
                print("  ✅ 验证码登录按钮可点击")
            else:
                print("  ℹ️  验证码登录按钮初始禁用（需要输入手机号）")
        else:
            log_bug("找不到验证码登录按钮")

        take_screenshot("1_login")

        # ==================== 2. 游客模式+Onboarding测试 ====================
        print("\n" + "="*60)
        print("🧪 测试2: 游客模式 + Onboarding流程")
        print("="*60)

        guest_btn.first.click()
        time.sleep(1.5)

        # 步骤1: 选择学习阶段
        if 'onboarding' in page.url:
            print("  ✅ 成功进入Onboarding页面")

            # 测试选项点击
            primary_btn = page.locator('button:has-text("小学")')
            if primary_btn.count() > 0:
                primary_btn.first.click()
                time.sleep(0.5)
                print("  ✅ 可以选择小学学段")
            else:
                log_bug("找不到小学学段按钮")

            # 点击下一步
            next_btn = page.locator('button:has-text("下一步")')
            if next_btn.count() > 0 and next_btn.first.is_enabled():
                next_btn.first.click()
                time.sleep(1)
                print("  ✅ 下一步按钮可用")
            else:
                log_bug("选择学段后下一步按钮未启用")

            take_screenshot("2_onboarding_step1")

            # 步骤2: 学习目标
            print("  ℹ️  当前在学习目标选择页")
            # 点击第一个选项
            option_btns = page.locator('button')
            # 排除"下一步"按钮
            for i in range(option_btns.count()):
                try:
                    text = option_btns.nth(i).inner_text().strip()
                    if text and '下一步' not in text:
                        option_btns.nth(i).click()
                        time.sleep(0.5)
                        break
                except:
                    pass

            next_btn = page.locator('button:has-text("下一步")')
            if next_btn.count() > 0 and next_btn.first.is_enabled():
                next_btn.first.click()
                time.sleep(1)
                print("  ✅ 学习目标选择完成")

            take_screenshot("3_onboarding_step2")

            # 步骤3: 年级选择
            print("  ℹ️  当前在年级选择页")
            grade_btn = page.locator('button:has-text("1年级")')
            if grade_btn.count() > 0:
                grade_btn.first.click()
                time.sleep(0.5)
                print("  ✅ 可以选择1年级")

            next_btn = page.locator('button:has-text("下一步")')
            if next_btn.count() > 0 and next_btn.first.is_enabled():
                next_btn.first.click()
                time.sleep(1)
                print("  ✅ 年级选择完成")

            take_screenshot("4_onboarding_step3")

            # 步骤4: 头像+昵称
            print("  ℹ️  当前在头像/昵称选择页")
            avatar_btns = page.locator('button')
            found_avatar = False
            for i in range(avatar_btns.count()):
                try:
                    text = avatar_btns.nth(i).inner_text().strip()
                    if text and '开始测评' not in text and '下一步' not in text:
                        avatar_btns.nth(i).click()
                        time.sleep(0.3)
                        found_avatar = True
                        break
                except:
                    pass
            if found_avatar:
                print("  ✅ 可以选择头像")

            # 输入昵称
            nickname_input = page.locator('input[placeholder*="昵称"]')
            if nickname_input.count() > 0:
                nickname_input.first.fill('测试小朋友')
                time.sleep(0.5)
                print("  ✅ 可以输入昵称")
            else:
                log_bug("找不到昵称输入框")

            take_screenshot("5_onboarding_step4")

            # 点击开始测评
            start_btn = page.locator('button:has-text("开始测评")')
            if start_btn.count() > 0 and start_btn.first.is_enabled():
                start_btn.first.click()
                time.sleep(2)
                print("  ✅ 开始测评按钮可用")
            else:
                log_bug("填写信息后开始测评按钮未启用")

        # ==================== 3. 测评页面测试 ====================
        print("\n" + "="*60)
        print("🧪 测试3: 测评答题页面")
        print("="*60)

        # 如果有"开始测评"按钮先点击
        start_assessment = page.locator('button:has-text("开始测评")')
        if start_assessment.count() > 0 and start_assessment.first.is_enabled():
            start_assessment.first.click()
            time.sleep(2)
            print("  ✅ 点击开始测评")

        take_screenshot("6_assessment_start")

        # 答题循环
        completed_questions = 0
        for i in range(12):
            if 'assessment' not in page.url.lower():
                break

            time.sleep(0.5)
            page_html_now = page.content()

            # 选择数字选项
            options = page.locator('button')
            clicked = False
            for j in range(options.count()):
                try:
                    text = options.nth(j).inner_text().strip()
                    if text.isdigit() and len(text) <= 2 and options.nth(j).is_enabled():
                        options.nth(j).click()
                        time.sleep(0.3)
                        clicked = True
                        break
                except:
                    pass

            if not clicked:
                # 尝试填输入框
                try:
                    page.evaluate("""
                        const inputs = document.querySelectorAll('input');
                        for (let i of inputs) {
                            if (i.type === 'number' || i.placeholder?.includes('答案')) {
                                i.value = '5';
                                i.dispatchEvent(new Event('input', {bubbles: true}));
                            }
                        }
                    """)
                    time.sleep(0.3)
                except:
                    pass

            # 点击确认答案
            confirm_btn = page.locator('button:has-text("确认答案")')
            if confirm_btn.count() > 0 and confirm_btn.first.is_enabled():
                confirm_btn.first.click()
                time.sleep(1)
                completed_questions += 1
            elif 'result' in page.url.lower() or '/' == page.url.lower():
                break

        print(f"  ✅ 完成测评题目: {completed_questions}道")
        take_screenshot("7_assessment_end")

        # ==================== 4. 首页/地图页测试 ====================
        print("\n" + "="*60)
        print("🧪 测试4: 首页/学习地图")
        print("="*60)

        time.sleep(2)
        page.wait_for_load_state('networkidle', timeout=10000)

        print(f"  📍 当前页面URL: {page.url}")

        # 检查首页元素
        page_html = page.content()

        # 检查关卡卡片
        level_cards = page.locator('button').all()
        print(f"  ℹ️  页面按钮数量: {len(level_cards)}")

        # 检查顶部状态栏
        has_hearts = '❤️' in page_html or 'heart' in page_html.lower()
        has_coins = '💰' in page_html or 'coin' in page_html.lower()
        has_diamond = '💎' in page_html or 'gem' in page_html.lower()
        print(f"  ❤️ 心: {'有' if has_hearts else '无'}")
        print(f"  💰 金币: {'有' if has_coins else '无'}")
        print(f"  💎 钻石: {'有' if has_diamond else '无'}")

        take_screenshot("8_home_page")

        # ==================== 5. 底部导航测试 ====================
        print("\n" + "="*60)
        print("🧪 测试5: 底部导航")
        print("="*60)

        # 找底部导航按钮
        nav_texts = []
        all_btns = page.locator('button').all()
        for btn in all_btns:
            try:
                text = btn.inner_text().strip()
                if text and len(text) <= 4:
                    nav_texts.append(text)
            except:
                pass

        print(f"  📋 找到的导航项: {list(set(nav_texts))[:10]}")

        # 测试导航切换（如果有"地图"、"错题"、"榜单"、"我的"等）
        nav_keywords = ['地图', '错题', '榜单', '我的', '目标', '首页']
        for keyword in nav_keywords:
            try:
                nav_btn = page.locator(f'button:has-text("{keyword}")')
                if nav_btn.count() > 0 and nav_btn.first.is_enabled():
                    nav_btn.first.click()
                    time.sleep(1)
                    print(f"  ✅ 可以切换到【{keyword}】页")
                    take_screenshot(f"nav_{keyword}")
                    # 返回首页
                    back_btn = page.locator('button:has-text("地图")')
                    if back_btn.count() > 0:
                        back_btn.first.click()
                        time.sleep(0.5)
            except:
                pass

        # ==================== 6. 开始关卡测试 ====================
        print("\n" + "="*60)
        print("🧪 测试6: 关卡/答题功能")
        print("="*60)

        # 尝试点击关卡（寻找可点击的大按钮）
        clickable_buttons = []
        for btn in all_btns:
            try:
                if btn.is_visible() and btn.is_enabled():
                    text = btn.inner_text().strip()
                    if text and '关卡' in text or '第' in text or text.isdigit():
                        clickable_buttons.append(text)
            except:
                pass

        print(f"  🎯 可点击的关卡: {clickable_buttons[:5]}")

        # 尝试点击第一个关卡
        first_level_clicked = False
        all_btns2 = page.locator('button').all()
        for btn in all_btns2:
            try:
                if btn.is_visible() and btn.is_enabled():
                    text = btn.inner_text().strip()
                    if text and ('关卡' in text or '第' in text):
                        btn.click()
                        time.sleep(2)
                        print(f"  ✅ 成功进入关卡: {text}")
                        first_level_clicked = True
                        take_screenshot("9_level_entry")
                        break
            except:
                pass

        if first_level_clicked and 'battle' in page.url.lower():
            print("  ✅ 进入Battle页面")
            # 测试答题
            for k in range(5):
                if 'battle' not in page.url.lower():
                    break
                time.sleep(0.5)
                options = page.locator('button')
                for j in range(options.count()):
                    try:
                        text = options.nth(j).inner_text().strip()
                        if text.isdigit() and len(text) <= 3 and options.nth(j).is_enabled():
                            options.nth(j).click()
                            time.sleep(0.3)
                            break
                    except:
                        pass

                confirm_btn = page.locator('button:has-text("确认答案"), button:has-text("下一题")')
                if confirm_btn.count() > 0 and confirm_btn.first.is_enabled():
                    confirm_btn.first.click()
                    time.sleep(1)

            print("  ✅ Battle答题测试完成")
            take_screenshot("10_battle")

        # ==================== 7. 结果页测试 ====================
        if 'result' in page.url.lower():
            print("\n" + "="*60)
            print("🧪 测试7: 结果页面")
            print("="*60)
            take_screenshot("11_result_page")
            print("  ✅ 结果页正常显示")

        # ==================== 8. 个人中心测试 ====================
        print("\n" + "="*60)
        print("🧪 测试8: 个人中心/设置")
        print("="*60)

        # 导航到个人中心
        profile_btn = page.locator('button:has-text("我的"), button:has-text("个人")')
        if profile_btn.count() > 0:
            try:
                profile_btn.first.click()
                time.sleep(1.5)
                print("  ✅ 进入个人中心")
                take_screenshot("12_profile")

                # 检查重置存档按钮
                reset_btn = page.locator('button:has-text("重置"), button:has-text("重置存档")')
                if reset_btn.count() > 0:
                    print(f"  ℹ️  有{reset_btn.count()}个重置按钮")

                # 检查退出登录
                logout_btn = page.locator('button:has-text("退出")')
                if logout_btn.count() > 0:
                    print("  ✅ 有退出登录按钮")
            except:
                pass

        # ==================== 输出测试报告 ====================
        print("\n" + "="*60)
        print("📊 测试报告汇总")
        print("="*60)
        print(f"\n🐛 发现的Bug数量: {len(bugs)}")
        for i, b in enumerate(bugs, 1):
            print(f"  {i}. {b}")

        print(f"\n⚠️  未实现/待完善功能: {len(unimplemented)}")
        for i, u in enumerate(unimplemented, 1):
            print(f"  {i}. {u}")

        print("\n" + "="*60)
        print("✅ 测试完成")
        print("="*60)

        browser.close()

if __name__ == '__main__':
    main()
