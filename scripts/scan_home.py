"""
完整的前端项目扫描脚本
模拟完整的游客登录和 onboarding 流程
"""
from playwright.sync_api import sync_playwright

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 390, 'height': 844})
        page = context.new_page()

        # 访问登录页面
        page.goto("http://localhost:5173/login", timeout=15000)
        page.wait_for_load_state('networkidle', timeout=15000)
        page.wait_for_timeout(1000)

        print("="*60)
        print("步骤1: 在登录页面")
        print(f"当前URL: {page.url}")

        # 点击游客模式体验
        guest_btn = page.locator('button:has-text("游客模式体验")')
        if guest_btn.count() > 0:
            print("点击游客模式体验按钮...")
            guest_btn.first.click()
            page.wait_for_timeout(1500)
            page.wait_for_load_state('networkidle', timeout=15000)
            print(f"点击后URL: {page.url}")

        # 处理 onboarding 流程
        step = 1
        while 'onboarding' in page.url and step <= 10:
            print(f"\n步骤{step}: 在 onboarding 页面")
            
            # 等待页面稳定
            page.wait_for_timeout(1000)
            
            # 检查当前页面有哪些按钮
            all_btns = page.locator('button').all()
            btn_texts = []
            for btn in all_btns:
                try:
                    text = btn.inner_text().strip()
                    enabled = btn.is_enabled()
                    btn_texts.append((text, enabled))
                except:
                    pass
            
            print(f"  页面按钮: {[(t[:20], e) for t, e in btn_texts]}")

            # 查找下一步按钮
            next_btn = page.locator('button:has-text("下一步")')
            start_btn = page.locator('button:has-text("开始测评")')
            
            # 如果有下一步按钮且可用，点击它
            if next_btn.count() > 0 and next_btn.first.is_enabled():
                print("  点击下一步...")
                next_btn.first.click()
                page.wait_for_timeout(1000)
                page.wait_for_load_state('networkidle', timeout=10000)
            # 如果没有下一步，检查是否需要选择选项
            elif next_btn.count() > 0 and not next_btn.first.is_enabled():
                # 需要选择某个选项才能启用下一步
                # 尝试点击各种选项按钮
                option_buttons = page.locator('button:not(:has-text("下一步")):not(:has-text("开始测评"))')
                for i in range(min(option_buttons.count(), 3)):
                    try:
                        option_buttons.nth(i).click()
                        page.wait_for_timeout(500)
                        if next_btn.first.is_enabled():
                            print(f"  选择选项 {i} 后按钮已启用")
                            break
                    except:
                        pass
                
                # 如果启用了，点击下一步
                if next_btn.first.is_enabled():
                    print("  点击下一步...")
                    next_btn.first.click()
                    page.wait_for_timeout(1000)
                    page.wait_for_load_state('networkidle', timeout=10000)
            # 检查开始测评按钮
            elif start_btn.count() > 0:
                if start_btn.first.is_enabled():
                    print("  点击开始测评...")
                    start_btn.first.click()
                    page.wait_for_timeout(3000)
                    page.wait_for_load_state('networkidle', timeout=15000)
                else:
                    # 可能需要填写昵称
                    nickname_input = page.locator('input[placeholder*="昵称"]')
                    if nickname_input.count() > 0:
                        print("  填写昵称...")
                        nickname_input.first.fill('数学小达人')
                        page.wait_for_timeout(500)
                        # 再次检查是否启用
                        if start_btn.first.is_enabled():
                            print("  点击开始测评...")
                            start_btn.first.click()
                            page.wait_for_timeout(3000)
                            page.wait_for_load_state('networkidle', timeout=15000)
            
            step += 1

        # 测评答题阶段
        print("\n步骤: 测评答题")
        
        # 检查是否在测评开始页面
        start_assessment = page.locator('button:has-text("开始测评")')
        if start_assessment.count() > 0 and start_assessment.first.is_enabled():
            print("  点击开始测评...")
            start_assessment.first.click()
            page.wait_for_timeout(2000)
            page.wait_for_load_state('networkidle', timeout=15000)
        
        for i in range(20):
            if 'battle' in page.url.lower() or 'assessment' in page.url.lower():
                print(f"  第 {i+1} 题")
                
                # 先尝试选择选项
                options = page.locator('button')
                selected = False
                for j in range(options.count()):
                    try:
                        option = options.nth(j)
                        text = option.inner_text().strip()
                        # 选择数字选项（排除功能按钮）
                        if text.isdigit() and len(text) <= 2:
                            option.click()
                            page.wait_for_timeout(300)
                            selected = True
                            break
                    except:
                        pass
                
                if not selected:
                    # 如果没有数字选项，尝试填写输入框
                    page.evaluate("""
                        const inputs = document.querySelectorAll('input[type="number"], input[placeholder*="答案"]');
                        if (inputs.length > 0) {
                            inputs[0].value = Math.floor(Math.random() * 10) + 1;
                            inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
                            inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
                        }
                    """)
                    page.wait_for_timeout(300)
                
                # 尝试点击确认答案按钮
                confirm_btn = page.locator('button:has-text("确认答案")')
                if confirm_btn.count() > 0 and confirm_btn.first.is_enabled():
                    confirm_btn.first.click()
                    page.wait_for_timeout(1500)
                else:
                    page.wait_for_timeout(1000)
                    
                    # 检查是否有"下一题"按钮
                    next_btn = page.locator('button:has-text("下一题")')
                    if next_btn.count() > 0 and next_btn.first.is_enabled():
                        next_btn.first.click()
                        page.wait_for_timeout(1000)
            elif 'result' in page.url.lower():
                print("  测评完成，进入结果页")
                break
            else:
                page.wait_for_timeout(500)
                if 'battle' not in page.url.lower() and 'assessment' not in page.url.lower():
                    break

        page.wait_for_timeout(2000)
        page.wait_for_load_state('networkidle', timeout=15000)

        # 检查是否到达首页
        print("\n" + "="*60)
        print("页面标题:", page.title())
        print("当前URL:", page.url)
        print("="*60)

        # 检查所有按钮
        all_buttons = page.locator('button').all()
        print(f"\n【按钮列表】共 {len(all_buttons)} 个按钮")
        for i, btn in enumerate(all_buttons[:25]):
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
        level_cards = page.locator('[class*="level-card"], [class*="map-node"]').all()
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
        has_heart = '❤️' in page_html or 'heart' in page_html.lower()
        has_coins = '💰' in page_html or 'coins' in page_html.lower() or 'gold' in page_html.lower()
        has_diamonds = '💎' in page_html or 'gem' in page_html.lower() or 'diamond' in page_html.lower()
        print(f"  ❤️ 心按钮: {'存在' if has_heart else '缺失'}")
        print(f"  💰 金币按钮: {'存在' if has_coins else '缺失'}")
        print(f"  💎 钻石按钮: {'存在' if has_diamonds else '缺失'}")

        # 保存页面源码
        html_content = page.content()
        with open('/tmp/home_scan.html', 'w', encoding='utf-8') as f:
            f.write(html_content)

        # 截图
        page.screenshot(path='/tmp/home_scan.png', full_page=True)
        print("\n✅ 截图已保存: /tmp/home_scan.png")
        print("✅ HTML源码已保存: /tmp/home_scan.html")

        browser.close()

if __name__ == '__main__':
    main()