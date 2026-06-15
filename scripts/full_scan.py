"""
完整前端项目扫描脚本 - 模拟真实用户流程
"""
from playwright.sync_api import sync_playwright

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=500)
        context = browser.new_context(viewport={'width': 390, 'height': 844})
        page = context.new_page()

        # 访问登录页面
        page.goto("http://localhost:5173/login", timeout=15000)
        page.wait_for_load_state('networkidle', timeout=15000)
        page.wait_for_timeout(1000)

        print("="*60)
        print("步骤1: 登录页面")
        print(f"URL: {page.url}")

        # 点击游客模式
        guest_btn = page.locator('button:has-text("游客模式体验")')
        if guest_btn.count() > 0:
            print("点击游客模式体验")
            guest_btn.first.click()
            page.wait_for_timeout(1500)
            page.wait_for_load_state('networkidle', timeout=15000)

        # Onboarding流程
        step = 1
        while 'onboarding' in page.url and step <= 10:
            print(f"\n步骤{step}: Onboarding")
            page.wait_for_timeout(1000)

            # 查找并点击选项
            option_btns = page.locator('button:not(:has-text("下一步")):not(:has-text("开始测评"))')
            for i in range(min(option_btns.count(), 2)):
                try:
                    option_btns.nth(i).click()
                    page.wait_for_timeout(500)
                    break
                except:
                    pass

            # 点击下一步或开始测评
            next_btn = page.locator('button:has-text("下一步")')
            start_btn = page.locator('button:has-text("开始测评")')

            if next_btn.count() > 0 and next_btn.first.is_enabled():
                next_btn.first.click()
            elif start_btn.count() > 0:
                # 可能需要填写昵称
                nickname_input = page.locator('input[placeholder*="昵称"]')
                if nickname_input.count() > 0:
                    nickname_input.first.fill('测试用户')
                    page.wait_for_timeout(500)
                if start_btn.first.is_enabled():
                    start_btn.first.click()
                else:
                    # 尝试点击头像
                    avatar_btns = page.locator('button:has-text("🧒"), button:has-text("👧")')
                    if avatar_btns.count() > 0:
                        avatar_btns.first.click()
                        page.wait_for_timeout(500)
                    if start_btn.first.is_enabled():
                        start_btn.first.click()

            page.wait_for_timeout(1000)
            page.wait_for_load_state('networkidle', timeout=10000)
            step += 1

        # 测评流程
        print("\n步骤: 测评答题")
        
        # 先检查是否有"开始测评"按钮
        start_assessment = page.locator('button:has-text("开始测评")')
        if start_assessment.count() > 0 and start_assessment.first.is_enabled():
            print("  点击开始测评")
            start_assessment.first.click()
            page.wait_for_timeout(2000)
            page.wait_for_load_state('networkidle', timeout=15000)
        
        for i in range(15):
            if 'assessment' in page.url.lower():
                page.wait_for_timeout(500)
                
                # 尝试选择数字选项
                options = page.locator('button')
                selected = False
                for j in range(options.count()):
                    try:
                        text = options.nth(j).inner_text().strip()
                        if text.isdigit() and len(text) <= 2:
                            options.nth(j).click()
                            page.wait_for_timeout(300)
                            selected = True
                            break
                    except:
                        pass
                
                if not selected:
                    # 尝试填写输入框
                    page.evaluate("""
                        const inputs = document.querySelectorAll('input');
                        inputs.forEach(i => {
                            if (i.type === 'number' || i.placeholder?.includes('答案')) {
                                i.value = '4';
                                i.dispatchEvent(new Event('input', { bubbles: true }));
                            }
                        });
                    """)
                    page.wait_for_timeout(300)

                # 点击确认答案
                confirm_btn = page.locator('button:has-text("确认答案")')
                if confirm_btn.count() > 0 and confirm_btn.first.is_enabled():
                    confirm_btn.first.click()
                    page.wait_for_timeout(1000)
            else:
                break

        # 等待进入首页
        page.wait_for_timeout(3000)
        page.wait_for_load_state('networkidle', timeout=15000)

        # 扫描首页
        print("\n" + "="*60)
        print("扫描结果:")
        print(f"页面标题: {page.title()}")
        print(f"当前URL: {page.url}")
        print("="*60)

        # 检查按钮
        buttons = page.locator('button').all()
        print(f"\n【按钮列表】共 {len(buttons)} 个")
        for i, btn in enumerate(buttons[:20]):
            try:
                text = btn.inner_text().strip()[:40]
                enabled = btn.is_enabled()
                print(f"  [{i}] '{text}' | 可点击: {enabled}")
            except:
                pass

        # 检查页面结构
        print("\n" + "="*60)
        print("页面结构:")
        page_html = page.content()
        
        # 关卡卡片
        level_cards = page.locator('[class*="level"], [class*="card"]').all()
        print(f"  关卡卡片: {len(level_cards)} 个")
        
        # 底部导航
        nav_elements = page.locator('nav, [class*="BottomNav"]').all()
        print(f"  底部导航: {len(nav_elements)} 个")
        
        # 资源显示
        has_heart = '❤️' in page_html or 'heart' in page_html.lower()
        has_coins = '💰' in page_html or 'coins' in page_html.lower()
        has_diamonds = '💎' in page_html or 'gem' in page_html.lower()
        print(f"  ❤️ 心: {'存在' if has_heart else '缺失'}")
        print(f"  💰 金币: {'存在' if has_coins else '缺失'}")
        print(f"  💎 钻石: {'存在' if has_diamonds else '缺失'}")

        # 截图
        page.screenshot(path='/tmp/full_scan.png', full_page=True)
        print("\n✅ 截图已保存: /tmp/full_scan.png")

        browser.close()

if __name__ == '__main__':
    main()