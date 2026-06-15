"""
前端项目全面扫描测试 - 自动处理登录后扫描
"""
from playwright.sync_api import sync_playwright
import json
import time

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

def scan_page(page, name, url, checks, require_login=True):
    """扫描单个页面"""
    print(f"\n{'='*60}")
    print(f"扫描页面: {name}")
    print(f"{'='*60}")
    try:
        page.goto(url, timeout=15000)
        page.wait_for_load_state('networkidle', timeout=15000)
        page.wait_for_timeout(1500)  # 等待动画和重定向

        # 获取控制台错误
        console_errors = []
        def handle_console(msg):
            if msg.type == 'error':
                console_errors.append(msg.text)
        page.on('console', handle_console)
        page.wait_for_timeout(500)

        # 检查是否跳转到了登录页
        current_url = page.url
        login_indicators = page.locator('text=/请输入手机号|验证码登录|登录即同意/')
        if login_indicators.count() > 0 and 'login' in current_url.lower():
            print(f"  ⚠️ 页面需要登录，当前在: {current_url}")
            return {"状态": "需要登录"}

        # 执行各项检查
        results = {}
        for check_name, check_func in checks.items():
            try:
                result = check_func(page)
                if result:
                    print(f"  ✅ {check_name}: {result}")
                    results[check_name] = result
                else:
                    print(f"  ⚠️ {check_name}: 未通过")
                    results[check_name] = "未通过"
            except Exception as e:
                err = str(e)[:80]
                print(f"  ❌ {check_name}: {err}")
                results[check_name] = f"错误: {err}"
                add_issue("缺陷 (Bug)", f"{name} - {check_name}", err, "medium")

        # 截图
        safe_name = name.replace("/", "_").replace(" ", "_")
        page.screenshot(path=f'/tmp/{safe_name}.png', full_page=True)
        print(f"  📸 截图已保存")

        # 控制台错误
        if console_errors:
            print(f"  🔴 控制台错误 ({len(console_errors)}条):")
            for log in console_errors[:3]:
                print(f"     - {log[:100]}")
                add_issue("缺陷 (Bug)", f"{name} - 控制台错误", log[:150], "high")

        return results

    except Exception as e:
        print(f"  ❌ 页面加载失败: {str(e)[:100]}")
        add_issue("缺陷 (Bug)", f"{name} - 页面加载失败", str(e), "critical")
        return {"状态": "加载失败"}


def login_as_guest(page):
    """以游客模式登录"""
    print("\n🚪 尝试以游客模式登录...")
    try:
        page.goto("http://localhost:5173/login", timeout=10000)
        page.wait_for_load_state('networkidle', timeout=10000)
        page.wait_for_timeout(1000)

        # 找游客模式按钮
        guest_btn = page.locator('button:has-text("游客模式"), button:has-text("游客"), button:has-text("体验")')
        if guest_btn.count() > 0:
            guest_btn.first.click()
            page.wait_for_timeout(2000)
            page.wait_for_load_state('networkidle', timeout=10000)
            print(f"  ✅ 游客模式登录成功，当前URL: {page.url}")
            return True
        else:
            print(f"  ⚠️ 未找到游客模式按钮")

            # 尝试直接注册游客账号
            # 通过localStorage设置用户数据
            page.evaluate("""
                localStorage.setItem('mathquest.user.v1', JSON.stringify({
                    profile: { nickname: '测试用户', avatar: '🧮' },
                    xp: 500,
                    hearts: 5,
                    maxHearts: 5,
                    coins: 100,
                    diamonds: 10,
                    streak: 3,
                    lastCheckInDate: '',
                    dailyXp: 50,
                    dailyQuestions: 3,
                    dailyGoalDate: '',
                    knowledgeProgress: {},
                    completedLevels: [],
                    dailyGoals: []
                }));
            """)
            page.goto("http://localhost:5173", timeout=10000)
            page.wait_for_load_state('networkidle', timeout=10000)
            page.wait_for_timeout(1000)
            print(f"  ✅ 通过localStorage设置用户数据，当前URL: {page.url}")
            return True

    except Exception as e:
        print(f"  ❌ 登录失败: {str(e)[:100]}")
        return False


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 390, 'height': 844},
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
        )
        page = context.new_page()

        # ── 先尝试登录 ──
        login_success = login_as_guest(page)
        if not login_success:
            print("❌ 无法登录，扫描终止")
            browser.close()
            return

        # ── 1. 首页 (地图页) ──
        def home_checks(page):
            results = {}

            # 检查页面标题或主要内容
            title = page.locator('text=MATH QUEST, text=算力先锋')
            results["App标题"] = "存在" if title.count() > 0 else "缺失"

            # 检查底部导航
            nav = page.locator('nav')
            results["底部导航"] = "存在" if nav.count() > 0 else "缺失"

            # 检查导航按钮
            if nav.count() > 0:
                nav_btns = nav.first.locator('button')
                nav_texts = []
                for btn in nav_btns.all():
                    try:
                        nav_texts.append(btn.inner_text().strip()[:10])
                    except:
                        pass
                results["导航按钮"] = ", ".join(nav_texts) if nav_texts else "无文字"

            # 检查地图/关卡
            level_text = page.locator('text=/年级|关卡|Level|Lv/')
            results["年级/关卡显示"] = f"找到 {level_text.count()} 处"

            # 检查进度环
            svg_circles = page.locator('svg circle')
            results["SVG圆环(进度)"] = f"找到 {svg_circles.count()} 个"

            # 检查弹窗（资源弹窗）
            # 点击金币按钮
            coins_btns = page.locator('button:has-text("0"), button:has-text("1"), button:has-text("2"), button:has-text("3"), button:has-text("4"), button:has-text("5")')
            results["资源数字按钮"] = f"找到 {coins_btns.count()} 个"

            return results

        scan_page(page, "首页_地图页", "http://localhost:5173", home_checks)

        # ── 2. 测试资源弹窗 ──
        print(f"\n{'='*60}")
        print("测试: 资源弹窗功能")
        print(f"{'='*60}")
        try:
            page.goto("http://localhost:5173", timeout=10000)
            page.wait_for_load_state('networkidle', timeout=10000)
            page.wait_for_timeout(1000)

            # 查找所有按钮
            all_buttons = page.locator('button').all()
            print(f"  页面按钮数量: {len(all_buttons)}")

            # 尝试点击每个按钮看看哪个会弹窗
            clicked_any_popup = False
            for i, btn in enumerate(all_buttons[:15]):
                try:
                    btn_text = btn.inner_text().strip()[:20]
                    btn_html = btn.inner_html()

                    # 查找可能是资源按钮的元素
                    if any(x in btn_html for x in ['FF4B4B', 'E5A13B', '5B8DEF', 'FF8C42', 'heart', 'coin', 'gem']):
                        print(f"  找到资源按钮 #{i}: {btn_text}")
                        btn.click()
                        page.wait_for_timeout(800)

                        # 检查是否出现了弹窗
                        popup = page.locator('text=/生命值|金币|钻石/')
                        if popup.count() > 0:
                            print(f"  ✅ 弹窗打开成功!")
                            page.screenshot(path='/tmp/popup_opened.png')
                            clicked_any_popup = True

                            # 关闭弹窗
                            page.keyboard.press('Escape')
                            page.wait_for_timeout(500)
                            break

                except Exception as e:
                    pass

            if not clicked_any_popup:
                print("  ⚠️ 未找到可点击的资源弹窗按钮")
                add_issue("UI/体验问题", "资源弹窗按钮不明确", "StatusBar中的资源按钮可能太小或难以点击", "low")

        except Exception as e:
            print(f"  ❌ 测试失败: {str(e)[:100]}")
            add_issue("缺陷 (Bug)", "资源弹窗测试", str(e), "medium")

        # ── 3. 测试答题流程 ──
        print(f"\n{'='*60}")
        print("测试: 答题流程")
        print(f"{'='*60}")
        try:
            page.goto("http://localhost:5173", timeout=10000)
            page.wait_for_load_state('networkidle', timeout=10000)
            page.wait_for_timeout(1500)

            # 查找可点击的关卡元素
            clickables = page.locator('button, [role="button"], a')
            print(f"  页面可点击元素: {clickables.count()} 个")

            # 查找包含"开始"、"练习"、"闯关"等文字的按钮
            start_btns = page.locator('button:has-text("开始"), button:has-text("练习"), button:has-text("闯关"), button:has-text("挑战")')
            print(f"  找到开始类按钮: {start_btns.count()} 个")

            if start_btns.count() > 0:
                start_btns.first.click()
                page.wait_for_timeout(3000)
                page.wait_for_load_state('networkidle', timeout=10000)
                page.screenshot(path='/tmp/after_start.png')
                print(f"  点击后URL: {page.url}")

                # 检查是否进入答题
                question_text = page.locator('text=/第.*题|题目|答题|选择/')
                if question_text.count() > 0:
                    print(f"  ✅ 进入答题页面!")

                    # 检查选项
                    all_opts = page.locator('button').all()
                    print(f"  答题页按钮数: {len(all_opts)}")

                    for i, opt in enumerate(all_opts[:8]):
                        try:
                            opt_text = opt.inner_text().strip()[:50]
                            if opt_text:
                                print(f"    选项 {i+1}: {opt_text[:30]}")
                        except:
                            pass

                    # 尝试点击第一个选项
                    if len(all_opts) > 0:
                        all_opts[0].click()
                        page.wait_for_timeout(1000)
                        page.screenshot(path='/tmp/after_answer.png')
                        print(f"  点击后URL: {page.url}")

                else:
                    print(f"  ⚠️ 未进入答题页面")
                    add_issue("未实现功能", "答题流程", "点击开始按钮后未进入答题页面", "high")
            else:
                print("  ⚠️ 未找到开始按钮")
                add_issue("未实现功能", "答题入口", "地图页面没有找到可点击的关卡入口", "high")

        except Exception as e:
            print(f"  ❌ 答题流程测试失败: {str(e)[:100]}")
            add_issue("缺陷 (Bug)", "答题流程异常", str(e), "high")

        # ── 4. 每日目标页 ──
        print(f"\n{'='*60}")
        print("测试: 每日目标页")
        print(f"{'='*60}")
        scan_page(page, "每日目标页", "http://localhost:5173/daily-goals", {
            "页面加载": lambda p: "成功" if p.locator('body').count() > 0 else "失败",
            "进度条": lambda p: f"找到 {p.locator('[role=progressbar], [class*=progress], progress').count()} 个",
            "目标项": lambda p: f"找到 {p.locator('text=/XP|经验|进度|目标/').count()} 处"
        })

        # ── 5. 错题本页 ──
        print(f"\n{'='*60}")
        print("测试: 错题本页")
        print(f"{'='*60}")
        scan_page(page, "错题本页", "http://localhost:5173/wrong-questions", {
            "页面加载": lambda p: "成功" if p.locator('body').count() > 0 else "失败",
            "错题列表": lambda p: f"找到 {p.locator('text=/错题|做错|错误/').count()} 处"
        })

        # ── 6. 排行榜页 ──
        print(f"\n{'='*60}")
        print("测试: 排行榜页")
        print(f"{'='*60}")
        scan_page(page, "排行榜页", "http://localhost:5173/leaderboard", {
            "页面加载": lambda p: "成功" if p.locator('body').count() > 0 else "失败",
            "排名列表": lambda p: f"找到 {p.locator('text=/第.*名|排名|top/i').count()} 处"
        })

        # ── 7. 个人中心页 ──
        print(f"\n{'='*60}")
        print("测试: 个人中心页")
        print(f"{'='*60}")
        scan_page(page, "个人中心页", "http://localhost:5173/profile", {
            "页面加载": lambda p: "成功" if p.locator('body').count() > 0 else "失败",
            "头像区": lambda p: "存在" if p.locator('text=/头像|avatar|🧮/i').count() > 0 else "缺失",
            "昵称": lambda p: "存在" if p.locator('text=/昵称|nickname/i').count() > 0 else "缺失",
            "等级": lambda p: "存在" if p.locator('text=/Lv|等级|level/i').count() > 0 else "缺失",
            "金币": lambda p: "存在" if p.locator('text=/金币|coins/i').count() > 0 else "缺失",
            "钻石": lambda p: "存在" if p.locator('text=/钻石|diamonds/i').count() > 0 else "缺失",
            "设置按钮": lambda p: "存在" if p.locator('text=/设置|config|setting/i').count() > 0 else "缺失"
        })

        # ── 8. 通用测试: 网络请求失败检测 ──
        print(f"\n{'='*60}")
        print("测试: 网络请求状态")
        print(f"{'='*60}")
        try:
            failed_requests = []
            def handle_response(response):
                if response.status >= 400:
                    failed_requests.append(f"{response.status}: {response.url[:80]}")

            page.on('response', handle_response)
            page.goto("http://localhost:5173", timeout=10000)
            page.wait_for_load_state('networkidle', timeout=10000)
            page.wait_for_timeout(2000)

            if failed_requests:
                print(f"  🔴 发现 {len(failed_requests)} 个失败的请求:")
                for req in failed_requests[:5]:
                    print(f"     - {req}")
                    add_issue("缺陷 (Bug)", "API请求失败", req, "high")
            else:
                print(f"  ✅ 无失败的请求")

        except Exception as e:
            print(f"  ❌ 网络测试失败: {str(e)[:100]}")

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
                    sev = {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "⚪"}.get(item['severity'], "⚪")
                    print(f"  {sev} {item['title']}")
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