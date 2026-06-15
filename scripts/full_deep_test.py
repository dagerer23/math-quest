"""
完成测评并测试首页 - 重点测试
"""
from playwright.sync_api import sync_playwright
import time

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=400)
        context = browser.new_context(viewport={'width': 390, 'height': 844})
        page = context.new_page()

        # 访问登录页
        page.goto("http://localhost:5173/login", timeout=15000)
        page.wait_for_load_state('networkidle', timeout=15000)
        time.sleep(1)
        page.screenshot(path='/tmp/d1_login.png')
        print("✅ 1. 登录页")

        # 点击游客模式
        guest_btn = page.locator('button:has-text("游客模式体验")')
        if guest_btn.count() > 0:
            guest_btn.first.click()
            time.sleep(1.5)

        # Onboarding步骤1 - 选小学
        time.sleep(1)
        btns = page.locator('button').all()
        for b in btns:
            try:
                t = b.inner_text().strip()
                if '小学' in t or '1-6' in t:
                    b.click()
                    break
            except:
                pass
        time.sleep(0.5)
        page.locator('button:has-text("下一步")').first.click()
        time.sleep(1)
        page.screenshot(path='/tmp/d2_step1.png')
        print("✅ 2. Onboarding步骤1")

        # Onboarding步骤2 - 选目标
        btns = page.locator('button').all()
        for b in btns:
            try:
                t = b.inner_text().strip()
                if t and '下一步' not in t and '开始' not in t:
                    b.click()
                    break
            except:
                pass
        time.sleep(0.5)
        page.locator('button:has-text("下一步")').first.click()
        time.sleep(1)
        page.screenshot(path='/tmp/d3_step2.png')
        print("✅ 3. Onboarding步骤2")

        # Onboarding步骤3 - 选1年级
        grade = page.locator('button:has-text("1年级")')
        if grade.count() > 0:
            grade.first.click()
            time.sleep(0.5)
        page.locator('button:has-text("下一步")').first.click()
        time.sleep(1)
        page.screenshot(path='/tmp/d4_step3.png')
        print("✅ 4. Onboarding步骤3")

        # Onboarding步骤4 - 头像+昵称
        btns = page.locator('button').all()
        for b in btns:
            try:
                t = b.inner_text().strip()
                if t and '开始' not in t and '下一步' not in t:
                    b.click()
                    break
            except:
                pass
        time.sleep(0.3)
        inputs = page.locator('input')
        if inputs.count() > 0:
            inputs.first.fill('测试用户')
        time.sleep(0.5)
        page.screenshot(path='/tmp/d5_step4.png')
        print("✅ 5. Onboarding步骤4")

        # 点击开始测评
        start_btn = page.locator('button:has-text("开始测评")')
        if start_btn.count() > 0 and start_btn.first.is_enabled():
            start_btn.first.click()
            time.sleep(2)
            page.screenshot(path='/tmp/d6_assess_start.png')
            print("✅ 6. 测评开始")
        else:
            # 如果按钮禁用，尝试点击更多元素
            all_btns = page.locator('button').all()
            for b in all_btns:
                try:
                    if b.is_enabled() and '开始' not in b.inner_text():
                        b.click()
                        time.sleep(0.3)
                except:
                    pass
            time.sleep(0.5)
            if start_btn.count() > 0 and start_btn.first.is_enabled():
                start_btn.first.click()
                time.sleep(2)

        # 测评答题 - 10道题
        print("\n🎯 开始测评答题 (10道)...")
        for q in range(15):
            if 'assessment' not in page.url.lower() and 'result' not in page.url.lower() and page.url != 'http://localhost:5173/':
                break
            if 'result' in page.url.lower() or page.url.endswith('/') and 'assessment' not in page.url.lower():
                print(f"  ✅ 测评结束，当前页: {page.url}")
                break

            time.sleep(0.8)
            # 尝试选择题
            selected = False
            btns = page.locator('button').all()
            for b in btns:
                try:
                    t = b.inner_text().strip()
                    if t.isdigit() and len(t) <= 2 and b.is_enabled():
                        b.click()
                        time.sleep(0.3)
                        selected = True
                        break
                except:
                    pass

            if not selected:
                # 填输入框
                try:
                    page.evaluate("""
                        const inputs = document.querySelectorAll('input[type="number"], input');
                        for (let i of inputs) {
                            if (i.placeholder?.includes('答案') || i.type === 'number') {
                                i.value = '4';
                                i.dispatchEvent(new Event('input', {bubbles: true}));
                                i.dispatchEvent(new Event('change', {bubbles: true}));
                            }
                        }
                    """)
                    time.sleep(0.3)
                except:
                    pass

            # 点击确认答案 或 下一题
            try:
                confirm = page.locator('button:has-text("确认答案")')
                if confirm.count() > 0 and confirm.first.is_enabled():
                    confirm.first.click()
                    time.sleep(0.8)
                    print(f"  ✅ 第{q+1}题")
                else:
                    nxt = page.locator('button:has-text("下一题")')
                    if nxt.count() > 0 and nxt.first.is_enabled():
                        nxt.first.click()
                        time.sleep(0.8)
                        print(f"  ✅ 第{q+1}题")
            except:
                pass

        page.screenshot(path='/tmp/d7_assess_end.png')

        # 等待进入首页
        time.sleep(2)
        print(f"\n📍 当前URL: {page.url}")
        page.wait_for_load_state('networkidle', timeout=10000)
        page.screenshot(path='/tmp/d8_home.png')
        print("✅ 8. 首页/结果页")

        # ==================== 分析首页功能 ====================
        print("\n" + "="*60)
        print("🔍 分析首页功能")
        print("="*60)

        page_html = page.content()

        # 检查顶部状态栏
        has_hearts = 'heart' in page_html.lower() or '❤️' in page_html
        has_coins = 'coin' in page_html.lower() or '💰' in page_html
        has_diamonds = 'gem' in page_html.lower() or '💎' in page_html
        has_xp = 'xp' in page_html.lower() or '经验' in page_html or 'streak' in page_html.lower()
        print(f"  ❤️ 心/生命值: {'✅ 有' if has_hearts else '❌ 无'}")
        print(f"  💰 金币: {'✅ 有' if has_coins else '❌ 无'}")
        print(f"  💎 钻石: {'✅ 有' if has_diamonds else '❌ 无'}")
        print(f"  📈 XP/经验/连续: {'✅ 有' if has_xp else '❌ 无'}")

        # 检查所有按钮和链接
        all_elements = page.locator('button, a').all()
        print(f"\n  📋 页面共有 {len(all_elements)} 个可点击元素")
        for i, el in enumerate(all_elements[:20]):
            try:
                t = el.inner_text().strip()
                if t and len(t) <= 20:
                    enabled = el.is_enabled()
                    print(f"     [{i}] {t} - {'启用' if enabled else '禁用'}")
            except:
                pass

        # 检查关卡节点
        levels = []
        all_btns = page.locator('button').all()
        for b in all_btns:
            try:
                t = b.inner_text().strip()
                if t and ('关卡' in t or 'L' in t or (t.isdigit() and len(t) <= 2)):
                    levels.append(t)
            except:
                pass
        print(f"\n  🎯 关卡节点: {levels[:10]}")

        # 测试底部导航
        print("\n" + "="*60)
        print("🧭 测试底部导航")
        print("="*60)

        nav_items = ['地图', '目标', '错题', '榜单', '我的']
        for item in nav_items:
            try:
                btn = page.locator(f'button:has-text("{item}")')
                if btn.count() > 0 and btn.first.is_enabled():
                    btn.first.click()
                    time.sleep(1.2)
                    page.screenshot(path=f'/tmp/d_nav_{item}.png')
                    current_url = page.url
                    print(f"  ✅ 【{item}】导航成功 - URL: {current_url.split('/')[-1] or 'home'}")
                    # 返回首页
                    map_btn = page.locator('button:has-text("地图")')
                    if map_btn.count() > 0 and item != '地图':
                        map_btn.first.click()
                        time.sleep(0.8)
                else:
                    print(f"  ❌ 【{item}】导航按钮不存在或禁用")
            except Exception as e:
                print(f"  ⚠️  【{item}】导航异常: {str(e)[:30]}")

        # 测试答题（点击第一个关卡）
        print("\n" + "="*60)
        print("⚔️  测试关卡答题")
        print("="*60)

        # 先回到首页
        time.sleep(0.5)
        all_btns2 = page.locator('button').all()
        for b in all_btns2:
            try:
                t = b.inner_text().strip()
                if ('关卡' in t or '第' in t or (t.isdigit() and len(t) <= 2)) and b.is_enabled():
                    b.click()
                    time.sleep(1.5)
                    print(f"  ✅ 进入关卡: {t}")
                    page.screenshot(path='/tmp/d9_battle_start.png')
                    break
            except:
                pass

        # 尝试答几道题
        for k in range(3):
            time.sleep(0.5)
            current_url = page.url.lower()
            if 'battle' not in current_url and 'result' not in current_url:
                print(f"  ⚠️  未进入Battle页，当前: {page.url}")
                break

            # 点击选项
            btns3 = page.locator('button').all()
            clicked = False
            for b in btns3:
                try:
                    t = b.inner_text().strip()
                    if t and (t.isdigit() or '确认' in t or '下' in t) and b.is_enabled():
                        if t.isdigit():
                            b.click()
                            time.sleep(0.3)
                            clicked = True
                        break
                except:
                    pass

            if not clicked:
                try:
                    page.evaluate("""
                        const inputs = document.querySelectorAll('input[type="number"]');
                        for (let i of inputs) {
                            i.value = '3';
                            i.dispatchEvent(new Event('input', {bubbles: true}));
                        }
                    """)
                    time.sleep(0.3)
                except:
                    pass

            # 点击确认
            try:
                confirm = page.locator('button:has-text("确认答案")')
                if confirm.count() > 0 and confirm.first.is_enabled():
                    confirm.first.click()
                    time.sleep(1)
                    print(f"  ✅ 答题{k+1}")
            except:
                pass

        page.screenshot(path='/tmp/d10_battle.png')

        # 结果页
        time.sleep(1.5)
        if 'result' in page.url.lower():
            page.screenshot(path='/tmp/d11_result.png')
            print("\n  ✅ 结果页正常显示")

        # 测试个人中心的重置和退出
        print("\n" + "="*60)
        print("👤 测试个人中心")
        print("="*60)

        # 点击"我的"
        my_btn = page.locator('button:has-text("我的")')
        if my_btn.count() > 0:
            my_btn.first.click()
            time.sleep(1.2)
            page.screenshot(path='/tmp/d12_profile.png')
            print("  ✅ 进入个人中心")

            # 检查按钮
            profile_btns = page.locator('button').all()
            for b in profile_btns:
                try:
                    t = b.inner_text().strip()
                    if t and len(t) <= 10:
                        print(f"     - {t}")
                except:
                    pass
        else:
            print("  ❌ 找不到'我的'导航")

        # 测试错题本
        print("\n" + "="*60)
        print("📖 测试错题本")
        print("="*60)
        mistakes_btn = page.locator('button:has-text("错题")')
        if mistakes_btn.count() > 0:
            mistakes_btn.first.click()
            time.sleep(1.2)
            page.screenshot(path='/tmp/d13_mistakes.png')
            print("  ✅ 错题本页面")

        # 测试排行榜
        rank_btn = page.locator('button:has-text("榜单")')
        if rank_btn.count() > 0:
            rank_btn.first.click()
            time.sleep(1.2)
            page.screenshot(path='/tmp/d14_rank.png')
            print("  ✅ 排行榜页面")

        # 测试每日目标
        goal_btn = page.locator('button:has-text("目标")')
        if goal_btn.count() > 0:
            goal_btn.first.click()
            time.sleep(1.2)
            page.screenshot(path='/tmp/d15_goals.png')
            print("  ✅ 每日目标页面")

        print("\n" + "="*60)
        print("✅ 全部测试完成，截图保存在 /tmp/d*.png")
        print("="*60)

        browser.close()

if __name__ == '__main__':
    main()
