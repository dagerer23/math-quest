"""
重点测试：完成10道测评题进入首页
"""
from playwright.sync_api import sync_playwright
import time

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=500)
        context = browser.new_context(viewport={'width': 390, 'height': 844})
        page = context.new_page()

        # 访问登录页
        page.goto("http://localhost:5173/login", timeout=15000)
        page.wait_for_load_state('networkidle', timeout=15000)
        time.sleep(1)

        # 点击游客模式
        guest_btn = page.locator('button:has-text("游客模式体验")')
        if guest_btn.count() > 0:
            guest_btn.first.click()
            time.sleep(1.5)

        # 步骤1: 小学
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

        # 步骤2: 目标
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

        # 步骤3: 1年级
        grade = page.locator('button:has-text("1年级")')
        if grade.count() > 0:
            grade.first.click()
            time.sleep(0.5)
        page.locator('button:has-text("下一步")').first.click()
        time.sleep(1)

        # 步骤4: 头像+昵称
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
            inputs.first.fill('测试')
        time.sleep(0.5)

        # 点击开始测评
        start_btn = page.locator('button:has-text("开始测评")')
        if start_btn.count() > 0 and start_btn.first.is_enabled():
            start_btn.first.click()
            time.sleep(2)
        page.screenshot(path='/tmp/s1_start.png')
        print("✅ 进入测评页面")

        # 关键改进：完成10道测评题
        print("\n🎯 开始答题...")
        for q in range(12):
            time.sleep(0.5)
            
            # 检查是否已完成测评
            current_url = page.url.lower()
            if 'assessment' not in current_url and current_url.endswith('/'):
                print(f"  ✅ 测评完成！进入首页")
                break
            if 'result' in current_url:
                print(f"  ✅ 测评完成，进入结果页")
                break

            # 先看当前页面有什么按钮
            try:
                page_html = page.content()
                print(f"  第{q+1}题 - URL: {page.url.split('/')[-1]}")
            except:
                pass

            # 找数字选项按钮
            btns = page.locator('button').all()
            clicked_option = False
            for b in btns:
                try:
                    if not b.is_visible() or not b.is_enabled():
                        continue
                    t = b.inner_text().strip()
                    if t.isdigit() and len(t) <= 2:
                        b.click()
                        time.sleep(0.3)
                        clicked_option = True
                        print(f"    - 选择选项: {t}")
                        break
                except:
                    pass

            if not clicked_option:
                # 填空
                try:
                    page.evaluate("""
                        const inputs = document.querySelectorAll('input');
                        for (let i of inputs) {
                            if (i.type === 'number' || i.placeholder?.includes('答案')) {
                                i.value = '4';
                                i.dispatchEvent(new Event('input', {bubbles: true}));
                                i.dispatchEvent(new Event('change', {bubbles: true}));
                            }
                        }
                    """)
                    time.sleep(0.3)
                    print("    - 填写输入框答案")
                except:
                    pass

            time.sleep(0.3)

            # 点击确认答案 / 下一题 / 开始测评
            for btn_text in ['确认答案', '下一题', '开始测评']:
                try:
                    btn = page.locator(f'button:has-text("{btn_text}")')
                    if btn.count() > 0 and btn.first.is_enabled():
                        btn.first.click()
                        time.sleep(0.8)
                        print(f"    - 点击: {btn_text}")
                        break
                except:
                    pass

        page.screenshot(path='/tmp/s2_after_assess.png')
        print(f"\n📍 测评后URL: {page.url}")

        # 如果还在测评页，尝试更暴力的方式
        if 'assessment' in page.url.lower():
            print("⚠️  仍在测评页，尝试跳过...")
            # 快速点击
            for _ in range(5):
                try:
                    btns = page.locator('button').all()
                    for b in btns:
                        try:
                            if b.is_enabled():
                                t = b.inner_text().strip()
                                if t.isdigit() and len(t) <= 2:
                                    b.click()
                                    time.sleep(0.2)
                                    break
                        except:
                            pass
                    time.sleep(0.2)
                    confirm = page.locator('button:has-text("确认答案")')
                    if confirm.count() > 0 and confirm.first.is_enabled():
                        confirm.first.click()
                        time.sleep(0.5)
                except:
                    pass
            page.screenshot(path='/tmp/s2b_force.png')

        time.sleep(2)

        # ==================== 首页测试 ====================
        print(f"\n📍 最终URL: {page.url}")
        page.screenshot(path='/tmp/s3_home.png')

        page_html = page.content()

        # 检查顶部状态栏
        has_hearts = 'hearts' in page_html.lower() or '❤️' in page_html or 'heart' in page_html.lower()
        has_coins = 'coin' in page_html.lower() or '💰' in page_html or 'coins' in page_html.lower()
        has_diamonds = 'gem' in page_html.lower() or '💎' in page_html or 'diamond' in page_html.lower()
        has_xp = 'xp' in page_html.lower() or '经验' in page_html or 'streak' in page_html.lower()
        print(f"\n  顶部状态栏:")
        print(f"    ❤️ 心/生命值: {'✅ 有' if has_hearts else '❌ 无'}")
        print(f"    💰 金币: {'✅ 有' if has_coins else '❌ 无'}")
        print(f"    💎 钻石: {'✅ 有' if has_diamonds else '❌ 无'}")
        print(f"    📈 XP/经验: {'✅ 有' if has_xp else '❌ 无'}")

        # 检查关卡
        all_btns = page.locator('button').all()
        print(f"\n  📋 页面按钮/元素 ({len(all_btns)}个):")
        for i, b in enumerate(all_btns[:25]):
            try:
                t = b.inner_text().strip()
                if t and len(t) <= 20:
                    enabled = b.is_enabled()
                    visible = b.is_visible()
                    print(f"    [{i}] {t} - 可见:{visible} 启用:{enabled}")
            except:
                pass

        # 检查底部导航
        print(f"\n  🧭 底部导航检测:")
        nav_keywords = ['地图', '目标', '错题', '榜单', '我的', '首页', '学习', '关卡']
        found_nav = []
        for kw in nav_keywords:
            btn = page.locator(f'button:has-text("{kw}")')
            if btn.count() > 0:
                found_nav.append(kw)
                print(f"    ✅ 找到: {kw} ({btn.count()}个)")

        if not found_nav:
            print("    ❌ 未找到任何底部导航按钮")

        # 测试导航
        print(f"\n  🚀 测试导航跳转:")
        for kw in ['地图', '目标', '错题', '榜单', '我的']:
            btn = page.locator(f'button:has-text("{kw}")')
            if btn.count() > 0 and btn.first.is_enabled():
                try:
                    btn.first.click()
                    time.sleep(1.2)
                    page.screenshot(path=f'/tmp/s_nav_{kw}.png')
                    print(f"    ✅ {kw} - 跳转后URL: {page.url.split('/')[-1] or 'home'}")
                    # 返回
                    back = page.locator('button:has-text("地图")')
                    if back.count() > 0 and kw != '地图':
                        back.first.click()
                        time.sleep(0.5)
                except Exception as e:
                    print(f"    ❌ {kw} - 错误: {str(e)[:40]}")
            else:
                print(f"    ❌ {kw} - 未找到/禁用")

        # 测试点击关卡进入答题
        print(f"\n  ⚔️  测试进入关卡答题:")
        for b in all_btns:
            try:
                t = b.inner_text().strip()
                if ('关卡' in t or '第' in t or (t.isdigit() and len(t) <= 2)) and b.is_enabled() and b.is_visible():
                    current = page.url
                    b.click()
                    time.sleep(1.5)
                    new_url = page.url
                    if current != new_url:
                        print(f"    ✅ 点击关卡[{t}] 跳转: {new_url.split('/')[-1]}")
                        page.screenshot(path='/tmp/s4_battle.png')

                        # 测试3道题
                        for k in range(3):
                            if 'battle' not in page.url.lower():
                                break
                            time.sleep(0.5)
                            options = page.locator('button').all()
                            for opt in options:
                                try:
                                    ot = opt.inner_text().strip()
                                    if ot.isdigit() and len(ot) <= 3 and opt.is_enabled():
                                        opt.click()
                                        time.sleep(0.3)
                                        break
                                except:
                                    pass
                            confirm = page.locator('button:has-text("确认答案"), button:has-text("下一题")')
                            if confirm.count() > 0 and confirm.first.is_enabled():
                                confirm.first.click()
                                time.sleep(0.8)
                                print(f"      ✅ 答题{k+1}")
                        page.screenshot(path='/tmp/s5_result.png')
                        break
                    else:
                        print(f"    ⚠️  点击[{t}] 未跳转")
            except:
                pass

        # 测试个人中心
        print(f"\n  👤 测试个人中心:")
        my_btn = page.locator('button:has-text("我的")')
        if my_btn.count() > 0:
            my_btn.first.click()
            time.sleep(1.2)
            page.screenshot(path='/tmp/s6_profile.png')
            profile_btns = page.locator('button').all()
            print(f"    ✅ 进入个人中心，共{len(profile_btns)}个按钮")
            for pb in profile_btns:
                try:
                    pt = pb.inner_text().strip()
                    if pt and len(pt) <= 12:
                        print(f"      - {pt}")
                except:
                    pass

        print("\n" + "="*60)
        print("✅ 测试完成，截图: /tmp/s*.png")
        print("="*60)

        browser.close()

if __name__ == '__main__':
    main()
