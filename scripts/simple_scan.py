"""
简单页面扫描脚本
"""
from playwright.sync_api import sync_playwright

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 390, 'height': 844})
        page = context.new_page()

        # 访问首页
        page.goto("http://localhost:5173/", timeout=15000)
        page.wait_for_load_state('networkidle', timeout=15000)
        page.wait_for_timeout(2000)

        print("="*60)
        print("页面标题:", page.title())
        print("当前URL:", page.url)
        print("="*60)

        # 检查页面内容
        page_html = page.content()
        
        # 检查是否在登录页面
        is_login = '游客模式体验' in page_html or '一键登录' in page_html
        # 检查是否在首页
        is_home = '关卡' in page_html or '地图' in page_html or '开始学习' in page_html
        
        print(f"\n页面类型判断:")
        print(f"  是否登录页: {'是' if is_login else '否'}")
        print(f"  是否首页: {'是' if is_home else '否'}")

        # 检查按钮
        buttons = page.locator('button').all()
        print(f"\n【按钮列表】共 {len(buttons)} 个按钮")
        for i, btn in enumerate(buttons[:15]):
            try:
                text = btn.inner_text().strip()[:40]
                enabled = btn.is_enabled()
                print(f"  [{i}] '{text}' | 可点击: {enabled}")
            except:
                pass

        # 检查页面结构
        print("\n" + "="*60)
        print("页面结构分析:")
        
        # 检查关卡卡片
        level_cards = page.locator('[class*="level"], [class*="card"]').all()
        print(f"  关卡卡片元素: {len(level_cards)} 个")
        
        # 检查底部导航
        nav_elements = page.locator('nav, [class*="BottomNav"]').all()
        print(f"  导航元素: {len(nav_elements)} 个")
        
        # 检查资源显示
        has_heart = '❤️' in page_html or 'heart' in page_html.lower()
        has_coins = '💰' in page_html or 'coins' in page_html.lower()
        has_diamonds = '💎' in page_html or 'gem' in page_html.lower()
        print(f"  ❤️ 心: {'存在' if has_heart else '缺失'}")
        print(f"  💰 金币: {'存在' if has_coins else '缺失'}")
        print(f"  💎 钻石: {'存在' if has_diamonds else '缺失'}")

        # 截图
        page.screenshot(path='/tmp/simple_scan.png', full_page=True)
        print("\n✅ 截图已保存: /tmp/simple_scan.png")

        browser.close()

if __name__ == '__main__':
    main()