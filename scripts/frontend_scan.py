"""
前端项目全面扫描测试 - 识别缺陷和未实现功能
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

def scan_page(page, name, url, checks):
    """扫描单个页面"""
    print(f"\n{'='*60}")
    print(f"扫描页面: {name}")
    print(f"{'='*60}")
    try:
        page.goto(url, timeout=15000)
        page.wait_for_load_state('networkidle', timeout=15000)
        page.wait_for_timeout(1000)  # 等待动画

        # 获取控制台错误
        console_logs = []
        def handle_console(msg):
            if msg.type == 'error':
                console_logs.append(msg.text)

        page.on('console', handle_console)
        page.wait_for_timeout(500)

        # 执行各项检查
        for check_name, check_func in checks.items():
            try:
                result = check_func(page)
                if result:
                    print(f"  ✅ {check_name}: {result}")
                else:
                    print(f"  ⚠️ {check_name}: 未通过")
            except Exception as e:
                print(f"  ❌ {check_name}: {str(e)[:80]}")
                add_issue("缺陷 (Bug)", f"{name} - {check_name}", str(e), "high")

        # 截图
        page.screenshot(path=f'/tmp/{name.replace("/", "_")}.png', full_page=True)
        print(f"  📸 截图已保存")

        # 控制台错误
        if console_logs:
            print(f"  🔴 控制台错误 ({len(console_logs)}条):")
            for log in console_logs[:5]:
                print(f"     - {log[:100]}")
                add_issue("缺陷 (Bug)", f"{name} - 控制台错误", log[:150], "high")

    except Exception as e:
        print(f"  ❌ 页面加载失败: {str(e)[:100]}")
        add_issue("缺陷 (Bug)", f"{name} - 页面加载失败", str(e), "critical")


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 390, 'height': 844},  # iPhone 14 Pro 尺寸
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
        )
        page = context.new_page()

        # ── 1. 首页 (地图页) ──
        def home_checks(page):
            results = {}

            # 检查 StatusBar
            status_bar = page.locator('button:has-text("签到")')
            results["StatusBar签到按钮"] = "存在" if status_bar.count() > 0 else "缺失"

            hearts_btn = page.locator('button:has([fill="#FF4B4B"])')
            results["心数按钮"] = "存在" if hearts_btn.count() > 0 else "缺失"

            # 检查地图关卡
            level_btns = page.locator('[style*="cursor: pointer"], button[class*="cursor"]')
            results["关卡按钮"] = f"找到 {level_btns.count()} 个"

            # 检查底部导航
            bottom_nav = page.locator('nav, [class*="bottom"]')
            results["底部导航"] = "存在" if bottom_nav.count() > 0 else "缺失"

            # 检查进度环
            progress_rings = page.locator('svg circle[stroke]')
            results["进度环"] = f"找到 {progress_rings.count()} 个"

            return results

        scan_page(page, "首页_地图页", "http://localhost:5173", home_checks)

        # ── 2. 登录页 ──
        def login_checks(page):
            results = {}

            phone_input = page.locator('input[type="tel"], input[placeholder*="手机"]')
            results["手机号输入框"] = "存在" if phone_input.count() > 0 else "缺失"

            send_code_btn = page.locator('button:has-text("发送验证码"), button:has-text("获取验证码")')
            results["发送验证码按钮"] = "存在" if send_code_btn.count() > 0 else "缺失"

            agree_checkbox = page.locator('input[type="checkbox"], [type="checkbox"]')
            results["同意协议复选框"] = "存在" if agree_checkbox.count() > 0 else "缺失"

            return results

        scan_page(page, "登录页", "http://localhost:5173/login", login_checks)

        # ── 3. 点击心数按钮测试弹窗 ──
        print(f"\n{'='*60}")
        print("测试: 点击心数按钮")
        print(f"{'='*60}")
        try:
            page.goto("http://localhost:5173", timeout=15000)
            page.wait_for_load_state('networkidle', timeout=15000)
            page.wait_for_timeout(1000)

            # 找心数按钮
            hearts_btn = None
            all_buttons = page.locator('button')
            for btn in all_buttons.all():
                btn_html = btn.inner_html()
                if 'FF4B4B' in btn_html or 'heart' in btn_html.lower():
                    hearts_btn = btn
                    break

            if hearts_btn:
                hearts_btn.click()
                page.wait_for_timeout(800)
                page.screenshot(path='/tmp/popup_hearts.png')
                print("  ✅ 心数弹窗已打开")

                # 检查弹窗内容
                popup_title = page.locator('h3:has-text("生命值"), text=生命值')
                results["心数弹窗标题"] = "存在" if popup_title.count() > 0 else "缺失"

                close_btn = page.locator('button:has-text("×"), button:has-text("关闭"), button:has(svg)')[:3]
                results["弹窗关闭按钮"] = "存在" if close_btn.count() > 0 else "缺失"

                # 点击关闭
                page.keyboard.press('Escape')
                page.wait_for_timeout(500)
            else:
                print("  ⚠️ 未找到心数按钮")
                add_issue("缺陷 (Bug)", "心数按钮未找到", "首页StatusBar中的心数按钮无法定位", "medium")

        except Exception as e:
            print(f"  ❌ 测试失败: {str(e)[:100]}")
            add_issue("缺陷 (Bug)", "心数弹窗测试", str(e), "medium")

        # ── 4. 测试签到功能 ──
        print(f"\n{'='*60}")
        print("测试: 签到功能")
        print(f"{'='*60}")
        try:
            page.goto("http://localhost:5173", timeout=15000)
            page.wait_for_load_state('networkidle', timeout=15000)
            page.wait_for_timeout(1000)

            checkin_btn = page.locator('button:has-text("签到")')
            if checkin_btn.count() > 0:
                checkin_btn.first.click()
                page.wait_for_timeout(1000)
                page.screenshot(path='/tmp/after_checkin.png')

                # 检查是否有成功提示
                page_content = page.content()
                if '成功' in page_content or '已签' in page_content:
                    print("  ✅ 签到成功")
                else:
                    print("  ⚠️ 签到结果不明确")
                    add_issue("UI/体验问题", "签到结果提示不明确", "签到后没有明确的成功/失败提示", "low")
            else:
                print("  ⚠️ 未找到签到按钮")
                add_issue("未实现功能", "签到按钮缺失", "StatusBar中没有签到按钮", "medium")

        except Exception as e:
            print(f"  ❌ 签到测试失败: {str(e)[:100]}")
            add_issue("缺陷 (Bug)", "签到功能异常", str(e), "medium")

        # ── 5. 底部导航测试 ──
        print(f"\n{'='*60}")
        print("测试: 底部导航")
        print(f"{'='*60}")
        try:
            nav_buttons = page.locator('nav button, [class*="bottom"] button')
            print(f"  底部导航按钮数量: {nav_buttons.count()}")

            nav_texts = []
            for btn in nav_buttons.all()[:10]:
                try:
                    text = btn.inner_text()
                    nav_texts.append(text.strip())
                except:
                    pass
            print(f"  导航按钮: {nav_texts}")

            # 测试各个导航项
            nav_map = {
                "地图": "http://localhost:5173/",
                "目标": "http://localhost:5173/daily-goals",
                "错题": "http://localhost:5173/wrong-questions",
                "榜单": "http://localhost:5173/leaderboard",
                "我的": "http://localhost:5173/profile"
            }

            for name, url in nav_map.items():
                page.goto(url, timeout=10000)
                page.wait_for_load_state('networkidle', timeout=10000)
                page.wait_for_timeout(500)
                page.screenshot(path=f'/tmp/nav_{name}.png')

                # 检查页面内容
                body_text = page.locator('body').inner_text()[:200]
                print(f"  {name}页面: {body_text[:50]}...")

        except Exception as e:
            print(f"  ❌ 导航测试失败: {str(e)[:100]}")
            add_issue("缺陷 (Bug)", "底部导航异常", str(e), "medium")

        # ── 6. 测试答题流程 ──
        print(f"\n{'='*60}")
        print("测试: 答题流程")
        print(f"{'='*60}")
        try:
            page.goto("http://localhost:5173", timeout=15000)
            page.wait_for_load_state('networkidle', timeout=15000)
            page.wait_for_timeout(1000)

            # 找第一个可点击的关卡
            level_cards = page.locator('[class*="cursor-pointer"], button:has-text("开始"), button:has-text("练习")')
            print(f"  找到可点击关卡: {level_cards.count()} 个")

            if level_cards.count() > 0:
                level_cards.first.click()
                page.wait_for_timeout(2000)
                page.screenshot(path='/tmp/battle_page.png')

                # 检查是否进入答题页面
                battle_elements = page.locator('text=/选择|答题|题目|第.*题/')
                if battle_elements.count() > 0:
                    print("  ✅ 进入答题页面成功")

                    # 检查选项
                    options = page.locator('button:has-text("A"), button:has-text("B"), button:has-text("C"), button:has-text("D")')
                    text_options = page.locator('button[class*="option"], [class*="choice"]')
                    print(f"  找到选项按钮: {options.count()} 个文字选项, {text_options.count()} 个样式选项")

                    if options.count() == 0 and text_options.count() == 0:
                        add_issue("未实现功能", "答题选项缺失", "答题页面没有找到选项按钮", "high")
                else:
                    print("  ⚠️ 可能未进入答题页面")
                    add_issue("未实现功能", "答题流程", "点击关卡后未进入答题页面", "high")

        except Exception as e:
            print(f"  ❌ 答题流程测试失败: {str(e)[:100]}")
            add_issue("缺陷 (Bug)", "答题流程异常", str(e), "high")

        # ── 7. 个人中心页 ──
        print(f"\n{'='*60}")
        print("测试: 个人中心")
        print(f"{'='*60}")
        try:
            page.goto("http://localhost:5173/profile", timeout=15000)
            page.wait_for_load_state('networkidle', timeout=15000)
            page.wait_for_timeout(1000)
            page.screenshot(path='/tmp/profile.png')

            # 检查个人中心元素
            profile_items = {
                "头像": page.locator('text=/头像|修改头像/'),
                "昵称": page.locator('text=/昵称|修改昵称/'),
                "等级": page.locator('text=/Lv|等级/'),
                "连续天数": page.locator('text=/连续|天数|streak/'),
                "金币": page.locator('text=/金币|coins/'),
                "钻石": page.locator('text=/钻石|diamonds/'),
                "重置存档": page.locator('text=/重置存档/'),
            }

            for name, locator in profile_items.items():
                if locator.count() > 0:
                    print(f"  ✅ {name} 存在")
                else:
                    print(f"  ⚠️ {name} 缺失")
                    add_issue("未实现功能", f"个人中心 - {name}", f"个人中心页面缺少{name}显示", "low")

        except Exception as e:
            print(f"  ❌ 个人中心测试失败: {str(e)[:100]}")
            add_issue("缺陷 (Bug)", "个人中心异常", str(e), "medium")

        # ── 8. 每日目标页 ──
        print(f"\n{'='*60}")
        print("测试: 每日目标页")
        print(f"{'='*60}")
        try:
            page.goto("http://localhost:5173/daily-goals", timeout=15000)
            page.wait_for_load_state('networkidle', timeout=15000)
            page.wait_for_timeout(1000)
            page.screenshot(path='/tmp/daily_goals.png')

            body = page.locator('body').inner_text()[:300]
            print(f"  页面内容: {body[:100]}...")

            # 检查进度显示
            progress = page.locator('text=/进度|XP|经验|目标/')
            print(f"  找到进度相关元素: {progress.count()} 个")

        except Exception as e:
            print(f"  ❌ 每日目标页测试失败: {str(e)[:100]}")
            add_issue("缺陷 (Bug)", "每日目标页异常", str(e), "medium")

        # ── 9. 错题本页 ──
        print(f"\n{'='*60}")
        print("测试: 错题本页")
        print(f"{'='*60}")
        try:
            page.goto("http://localhost:5173/wrong-questions", timeout=15000)
            page.wait_for_load_state('networkidle', timeout=15000)
            page.wait_for_timeout(1000)
            page.screenshot(path='/tmp/wrong_questions.png')

            body = page.locator('body').inner_text()[:300]
            print(f"  页面内容: {body[:100]}...")

            # 检查是否有错题
            wrong_items = page.locator('text=/错题|做错|错误/')
            print(f"  找到错题相关元素: {wrong_items.count()} 个")

        except Exception as e:
            print(f"  ❌ 错题本页测试失败: {str(e)[:100]}")
            add_issue("缺陷 (Bug)", "错题本页异常", str(e), "medium")

        # ── 10. 排行榜页 ──
        print(f"\n{'='*60}")
        print("测试: 排行榜页")
        print(f"{'='*60}")
        try:
            page.goto("http://localhost:5173/leaderboard", timeout=15000)
            page.wait_for_load_state('networkidle', timeout=15000)
            page.wait_for_timeout(1000)
            page.screenshot(path='/tmp/leaderboard.png')

            body = page.locator('body').inner_text()[:300]
            print(f"  页面内容: {body[:100]}...")

            # 检查是否有排名列表
            rankings = page.locator('text=/第.*名|排名|Rank/')
            print(f"  找到排名相关元素: {rankings.count()} 个")

        except Exception as e:
            print(f"  ❌ 排行榜页测试失败: {str(e)[:100]}")
            add_issue("缺陷 (Bug)", "排行榜页异常", str(e), "medium")

        browser.close()

        # ── 输出汇总报告 ──
        print(f"\n\n{'='*60}")
        print("📋 扫描结果汇总")
        print(f"{'='*60}")

        total = 0
        for category, items in issues.items():
            if items:
                print(f"\n【{category}】({len(items)}项)")
                for item in items:
                    severity_icon = "🔴" if item['severity'] == 'critical' else "🟠" if item['severity'] == 'high' else "🟡"
                    print(f"  {severity_icon} {item['title']}")
                    print(f"     {item['description'][:100]}")
                total += len(items)

        print(f"\n{'='*60}")
        print(f"共发现 {total} 个问题")
        print(f"{'='*60}")

        # 保存JSON报告
        with open('/tmp/scan_report.json', 'w', encoding='utf-8') as f:
            json.dump(issues, f, ensure_ascii=False, indent=2)
        print(f"\n📄 详细报告已保存到 /tmp/scan_report.json")

if __name__ == '__main__':
    main()