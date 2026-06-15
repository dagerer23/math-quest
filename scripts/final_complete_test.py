"""
最简测试 - 直接用代码完成所有状态检查
"""
from playwright.sync_api import sync_playwright
import time

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=200)
        context = browser.new_context(viewport={'width': 390, 'height': 844})
        page = context.new_page()

        # ==================== 1. 登录页 ====================
        print("1️⃣  登录页")
        page.goto("http://localhost:5173/login", timeout=15000)
        page.wait_for_load_state('networkidle', timeout=15000)
        time.sleep(1)
        page.screenshot(path='/tmp/final_1_login.png')

        # ==================== 2. 游客模式 -> Onboarding ====================
        print("2️⃣  游客模式 + Onboarding (4步)")

        # 点击游客模式
        page.evaluate("""
            () => {
                for (let b of document.querySelectorAll('button')) {
                    if (b.textContent.includes('游客')) { b.click(); return; }
                }
            }
        """)
        time.sleep(1.5)

        # 4步流程
        for step in range(4):
            time.sleep(0.8)
            # 点击第一个选项
            page.evaluate("""
                () => {
                    for (let b of document.querySelectorAll('button')) {
                        const t = b.textContent.trim();
                        if (t && !t.includes('下一步') && !t.includes('开始') && !b.disabled) {
                            b.click(); return;
                        }
                    }
                }
            """)
            time.sleep(0.3)
            # 最后一步填昵称
            if step == 3:
                page.evaluate("""
                    () => {
                        for (let i of document.querySelectorAll('input')) {
                            i.value = '测试用户';
                            i.dispatchEvent(new Event('input', {bubbles:true}));
                        }
                    }
                """)
                time.sleep(0.3)
            # 点击下一步/开始测评
            page.evaluate("""
                () => {
                    for (let b of document.querySelectorAll('button')) {
                        const t = b.textContent.trim();
                        if ((t.includes('下一步') || t.includes('开始测评')) && !b.disabled) {
                            b.click(); return;
                        }
                    }
                }
            """)
            time.sleep(1)

        page.screenshot(path='/tmp/final_2_onboarded.png')
        print("   ✅ Onboarding完成, URL:", page.url.split('/')[-1])

        # ==================== 3. 测评引导页 ====================
        print("3️⃣  测评引导页")
        time.sleep(1.5)
        if 'assessment' in page.url.lower():
            page.evaluate("""
                () => {
                    for (let b of document.querySelectorAll('button')) {
                        if (b.textContent.includes('开始测评') && !b.disabled) { b.click(); return; }
                    }
                }
            """)
            time.sleep(2)
            page.screenshot(path='/tmp/final_3_assess_start.png')
            print("   ✅ 进入测评答题")

        # ==================== 4. 完成10道题 ====================
        print("4️⃣  完成10道测评题")
        for q in range(15):
            time.sleep(0.8)
            if 'assessment' not in page.url.lower():
                print(f"   ✅ 完成! ({q}道题后)")
                break

            # 选择/填写 + 确认
            page.evaluate("""
                () => {
                    // 选择题
                    for (let b of document.querySelectorAll('button')) {
                        const t = b.textContent.trim();
                        if (/^\\d+$/.test(t) && t.length <= 3 && !b.disabled) { b.click(); break; }
                    }
                    // 填空
                    for (let i of document.querySelectorAll('input')) {
                        if (i.offsetParent !== null) {
                            i.focus(); i.value = '4';
                            i.dispatchEvent(new Event('input', {bubbles:true}));
                        }
                    }
                    // 确认
                    setTimeout(() => {
                        for (let b of document.querySelectorAll('button')) {
                            const t = b.textContent.trim();
                            if ((t.includes('确认答案') || t.includes('下一题')) && !b.disabled) {
                                b.click(); return;
                            }
                        }
                    }, 150);
                }
            """)
            time.sleep(1.2)

        page.screenshot(path='/tmp/final_4_assess_done.png')
        print("   URL:", page.url.split('/')[-1])

        # ==================== 5. 结果页 -> 首页 ====================
        time.sleep(2)
        if 'result' in page.url.lower():
            print("5️⃣  测评结果页 -> 首页")
            page.evaluate("""
                () => {
                    for (let b of document.querySelectorAll('button')) {
                        const t = b.textContent;
                        if (t && (t.includes('学习') || t.includes('首页') || t.includes('地图') || t.includes('开始')) && !b.disabled) {
                            b.click(); return;
                        }
                    }
                    window.location.href = '/';
                }
            """)
            time.sleep(2)
        elif page.url.strip('/') != 'http://localhost:5173':
            page.goto("http://localhost:5173/", timeout=5000)
            time.sleep(2)

        # ==================== 6. 首页截图 ====================
        page.screenshot(path='/tmp/final_5_home.png')
        print("\n6️⃣  首页 URL:", page.url.split('/')[-1])

        # ==================== 7. 各页面截图 ====================
        pages = [
            ('首页地图', '/'),
            ('每日目标', '/daily-goals'),
            ('错题本', '/mistakes'),
            ('排行榜', '/leaderboard'),
            ('个人中心', '/profile'),
        ]
        for name, path in pages:
            page.goto(f"http://localhost:5173{path}", timeout=5000)
            time.sleep(1.5)
            page.screenshot(path=f'/tmp/final_page_{name}.png')
            btn_count = page.evaluate("() => document.querySelectorAll('button').length")
            print(f"   ✅ {name} - {btn_count}个按钮")

        # ==================== 8. 首页详细检查 ====================
        print("\n7️⃣  首页详细检查")
        page.goto("http://localhost:5173/", timeout=5000)
        time.sleep(2)

        info = page.evaluate("""
            () => {
                const html = document.body.innerHTML;
                const btns = [];
                for (let b of document.querySelectorAll('button')) {
                    if (b.offsetParent !== null) {
                        btns.push({
                            text: b.textContent.trim().substring(0, 20),
                            disabled: b.disabled
                        });
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
                    buttons: btns.slice(0, 25),
                    links: [...new Set(links)].slice(0, 10),
                    has_heart: /Heart|❤️|heart/i.test(html),
                    has_coins: /Coin|coin|💰|Coins/i.test(html),
                    has_diamonds: /Gem|gem|diamond|💎/i.test(html),
                    has_flame: /Flame|flame|🔥|xp/i.test(html),
                    has_profile: /profile|avatar|🧒|👧|🧮/i.test(html),
                    has_level: /level|关卡|第.*关|Level/i.test(html),
                }
            }
        """)

        print(f"   URL: {info['url']}")
        print(f"   ❤️ 心: {'✅' if info['has_heart'] else '❌'}")
        print(f"   💰 金币: {'✅' if info['has_coins'] else '❌'}")
        print(f"   💎 钻石: {'✅' if info['has_diamonds'] else '❌'}")
        print(f"   🔥 连续/XP: {'✅' if info['has_flame'] else '❌'}")
        print(f"   👤 头像: {'✅' if info['has_profile'] else '❌'}")
        print(f"   🎯 关卡: {'✅' if info['has_level'] else '❌'}")
        print(f"   按钮数: {len(info['buttons'])}")
        print(f"   链接数: {len(info['links'])}")

        print("\n   按钮列表:")
        for i, b in enumerate(info['buttons']):
            if b['text']:
                print(f"     [{i}] {b['text']} - {'启用' if not b['disabled'] else '禁用'}")

        print("\n   链接列表:")
        for i, l in enumerate(info['links']):
            print(f"     [{i}] {l}")

        page.screenshot(path='/tmp/final_6_home_detail.png')

        print("\n" + "="*50)
        print("✅ 所有测试完成！截图: /tmp/final_*.png")
        print("="*50)

        browser.close()

if __name__ == '__main__':
    main()
