#!/usr/bin/env python3
"""
前端应用全面测试脚本 — 使用 Playwright 自动化测试
找出：样式问题、UI 缺陷、功能缺陷、未实现功能
"""

import json
import os
import re
import time
from playwright.sync_api import sync_playwright

# ═══════════════════════════════════════════════════════════════
# 配置
# ═══════════════════════════════════════════════════════════════
BASE_URL = 'http://localhost:5173'
SCREENSHOT_DIR = '/workspace/public/comprehensive-test'
REPORT_PATH = '/workspace/public/test-report.json'
VIEWPORT = {'width': 375, 'height': 812}

os.makedirs(SCREENSHOT_DIR, exist_ok=True)

# 问题收集
issues = {
    'style_issues': [],
    'ui_defects': [],
    'functional_bugs': [],
    'unimplemented': [],
    'console_errors': [],
    'screenshots': [],
}

def add_issue(category, page, severity, description, screenshot=None, selector=None):
    issue = {
        'page': page,
        'severity': severity,
        'description': description,
    }
    if screenshot:
        issue['screenshot'] = screenshot
    if selector:
        issue['selector'] = selector
    issues[category].append(issue)

def screenshot(page, name):
    path = f'{SCREENSHOT_DIR}/{name}.png'
    page.screenshot(path=path, full_page=True)
    issues['screenshots'].append(path)
    return path

def setup_console_capture(page):
    """捕获控制台错误和页面异常"""
    def on_console(msg):
        if msg.type == 'error':
            text = msg.text
            # 过滤掉已知的无害错误
            skip_patterns = [
                'favicon',
                'Failed to load resource',
                'net::ERR',
                'WebSocket',
                'Download the React DevTools',
            ]
            if not any(p in text for p in skip_patterns):
                issues['console_errors'].append({
                    'text': text[:300],
                    'url': page.url,
                })
    def on_pageerror(err):
        text = str(err)
        skip_patterns = ['ResizeObserver loop', 'Non-Error promise rejection']
        if not any(p in text for p in skip_patterns):
            issues['console_errors'].append({
                'text': text[:300],
                'url': page.url,
                'type': 'pageerror',
            })
    page.on('console', on_console)
    page.on('pageerror', on_pageerror)

def inject_full_user_state(page):
    """注入完整的用户状态（使用正确的 localStorage key）"""
    page.goto(BASE_URL + '/login', wait_until='domcontentloaded', timeout=15000)
    page.wait_for_timeout(300)

    user_state = {
        "state": {
            "isLoggedIn": True,
            "userId": "test-user-001",
            "lastLoginAt": int(time.time() * 1000),
            "hasCompletedOnboarding": True,
            "profile": {
                "avatar": "🦁",
                "nickname": "测试同学",
                "learningStage": "primary",
                "learningGoal": "consolidation",
                "targetGrade": 2,
                "phone": "13800138000",
            },
            "grade": 2,
            "xp": 1500,
            "coins": 320,
            "diamonds": 12,
            "hearts": 5,
            "maxHearts": 5,
            "streak": 7,
            "comboMax": 15,
            "rank": "白银",
            "unlockedLevels": ["g2-L1", "g2-L2", "g2-L3", "g2-L4", "g2-L5"],
            "completedLevels": {
                "g2-L1": {"stars": 3, "bestScore": 100},
                "g2-L2": {"stars": 2, "bestScore": 80},
                "g2-L3": {"stars": 1, "bestScore": 50},
            },
            "mistakeIds": ["q1", "q2", "q3"],
            "mistakeMastery": {"q1": 1, "q2": 0, "q3": 2},
            "achievements": [
                {"id": "first_win", "name": "初战告捷", "description": "完成第一关", "icon": "🏆", "unlockedAt": 1700000000000},
                {"id": "streak_7", "name": "坚持一周", "description": "连续学习7天", "icon": "🔥", "unlockedAt": 1700100000000},
            ],
            "achievementsMeta": [
                {"id": "first_win", "name": "初战告捷", "description": "完成第一关", "icon": "🏆"},
                {"id": "streak_7", "name": "坚持一周", "description": "连续学习7天", "icon": "🔥"},
                {"id": "combo_10", "name": "连击大师", "description": "达成10连击", "icon": "⚡"},
                {"id": "perfect_score", "name": "完美主义", "description": "获得满分", "icon": "⭐"},
                {"id": "mistake_master", "name": "错题终结者", "description": "掌握50道错题", "icon": "📓"},
            ],
            "systemConfigs": {
                "combo.show_threshold": "3",
                "combo.sound_threshold": "5",
                "hearts.max": "5",
                "hearts.refill_minutes": "30",
                "xp.per_correct": "10",
                "coins.per_correct": "5",
            },
            "settings": {"sound": True, "vibration": True},
            "lastActiveDate": time.strftime('%Y-%m-%d'),
            "lastCheckInDate": time.strftime('%Y-%m-%d'),
            "assessment": {
                "id": "test-assessment-001",
                "completedAt": 1700000000000,
                "score": 80,
                "recommendedDifficulty": 2,
                "answers": [],
            },
            "dailyGoals": [
                {"id": "g1", "targetXp": 100, "targetQuestions": 10, "completed": False},
                {"id": "g2", "targetXp": 200, "targetQuestions": 20, "completed": True, "completedAt": 1700000000000, "reward": {"xp": 50, "coins": 10}},
            ],
            "dailyGoalDate": time.strftime('%Y-%m-%d'),
            "dailyXp": 120,
            "dailyQuestions": 15,
            "inventory": [
                {"id": "i1", "type": "heart_refill", "name": "心数恢复", "description": "恢复所有心数", "icon": "❤️", "count": 2},
            ],
            "treasureBoxes": [],
            "learningStats": {
                "totalQuestions": 250,
                "correctQuestions": 200,
                "totalDays": 15,
                "weeklyStreak": 5,
                "knowledgeProgress": {
                    "加减法": 0.8,
                    "乘除法": 0.5,
                    "应用题": 0.3,
                },
            },
        },
        "version": 0,
    }

    # 注意：不设置 mq_token，否则 App.tsx 会尝试 tokenLogin API 调用，
    # 失败后清除登录态。仅依赖 Zustand persist 恢复 isLoggedIn。
    state_json = json.dumps(user_state)
    page.evaluate("""(state) => {
        localStorage.setItem('mathquest.user.v1', state);
        localStorage.removeItem('mq_token');
        localStorage.setItem('lastPhone', '13800138000');
        localStorage.setItem('userId', 'test-user-001');
    }""", state_json)

    page.reload(wait_until='networkidle', timeout=15000)
    # 等待 Zustand hydrate（App.tsx 有 50ms delay）+ 路由渲染
    page.wait_for_timeout(2000)

def inject_new_user_state(page):
    """注入新用户状态（已完成 onboarding 但无游戏数据）"""
    page.goto(BASE_URL + '/login', wait_until='domcontentloaded', timeout=15000)
    page.wait_for_timeout(300)

    user_state = {
        "state": {
            "isLoggedIn": True,
            "userId": "new-user-002",
            "lastLoginAt": int(time.time() * 1000),
            "hasCompletedOnboarding": True,
            "profile": {
                "avatar": "🐱",
                "nickname": "新同学",
                "learningStage": "primary",
                "learningGoal": "interest",
                "targetGrade": 1,
                "phone": "13900139000",
            },
            "grade": 1,
            "xp": 0,
            "coins": 80,
            "diamonds": 5,
            "hearts": 5,
            "maxHearts": 5,
            "streak": 1,
            "comboMax": 0,
            "rank": "青铜",
            "unlockedLevels": ["g1-L1"],
            "completedLevels": {},
            "mistakeIds": [],
            "mistakeMastery": {},
            "achievements": [],
            "achievementsMeta": [],
            "systemConfigs": {},
            "settings": {"sound": True, "vibration": True},
            "lastActiveDate": time.strftime('%Y-%m-%d'),
            "assessment": None,
            "dailyGoals": [],
            "dailyGoalDate": time.strftime('%Y-%m-%d'),
            "dailyXp": 0,
            "dailyQuestions": 0,
            "inventory": [],
            "treasureBoxes": [],
            "learningStats": {
                "totalQuestions": 0,
                "correctQuestions": 0,
                "totalDays": 1,
                "weeklyStreak": 1,
                "knowledgeProgress": {},
            },
        },
        "version": 0,
    }

    state_json = json.dumps(user_state)
    page.evaluate("""(state) => {
        localStorage.setItem('mathquest.user.v1', state);
        localStorage.removeItem('mq_token');
        localStorage.setItem('lastPhone', '13900139000');
        localStorage.setItem('userId', 'new-user-002');
    }""", state_json)

    page.reload(wait_until='networkidle', timeout=15000)
    page.wait_for_timeout(2000)

def check_layout_issues(page, page_name):
    """检测布局问题：文字重叠、元素溢出、空白区域过大"""
    # 1. 检测文字重叠
    overlaps = page.evaluate("""() => {
        const elements = [...document.querySelectorAll('h1, h2, h3, p, span, button, div')];
        const visible = elements.filter(e => {
            const r = e.getBoundingClientRect();
            return r.width > 0 && r.height > 0 && e.offsetParent !== null;
        });
        const results = [];
        for (let i = 0; i < Math.min(visible.length, 100); i++) {
            for (let j = i + 1; j < Math.min(visible.length, 100); j++) {
                const e1 = visible[i], e2 = visible[j];
                if (e1.contains(e2) || e2.contains(e1)) continue;
                const r1 = e1.getBoundingClientRect();
                const r2 = e2.getBoundingClientRect();
                const overlapX = Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left);
                const overlapY = Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top);
                if (overlapX > 5 && overlapY > 5) {
                    const area = overlapX * overlapY;
                    const minArea = Math.min(r1.width * r1.height, r2.width * r2.height);
                    if (area > minArea * 0.3) {
                        const t1 = (e1.textContent || '').trim().slice(0, 40);
                        const t2 = (e2.textContent || '').trim().slice(0, 40);
                        if (t1 && t2 && t1 !== t2) {
                            results.push({e1: t1, e2: t2, area: Math.round(area)});
                        }
                    }
                }
            }
        }
        return results.slice(0, 5);
    }""")

    for ov in overlaps:
        add_issue('style_issues', page_name, 'medium',
                  f'文字重叠: "{ov["e1"]}" 与 "{ov["e2"]}" 重叠面积 {ov["area"]}px')

    # 2. 检测水平溢出
    overflow = page.evaluate("""() => {
        const body = document.body;
        const html = document.documentElement;
        const hasOverflow = body.scrollWidth > body.clientWidth + 2;
        if (hasOverflow) {
            return {scrollWidth: body.scrollWidth, clientWidth: body.clientWidth};
        }
        return null;
    }""")
    if overflow:
        add_issue('style_issues', page_name, 'high',
                  f'页面水平溢出: scrollWidth={overflow["scrollWidth"]} > clientWidth={overflow["clientWidth"]}')

    # 3. 检测空白区域过大（底部或中间超过 300px 的空白）
    large_gaps = page.evaluate("""() => {
        const results = [];
        const blocks = [...document.querySelectorAll('div, section, main, article')];
        for (const el of blocks) {
            if (el.children.length === 0) continue;
            const rect = el.getBoundingClientRect();
            if (rect.height > 300 && rect.width > 200) {
                let hasContent = false;
                for (const child of el.children) {
                    const cr = child.getBoundingClientRect();
                    if (cr.height > 5 && cr.width > 5) { hasContent = true; break; }
                }
                if (!hasContent && rect.height > 300) {
                    results.push({height: Math.round(rect.height), selector: el.className?.slice(0, 50)});
                }
            }
        }
        return results.slice(0, 3);
    }""")
    for gap in large_gaps:
        add_issue('style_issues', page_name, 'low',
                  f'大面积空白区域: 高度 {gap["height"]}px, class="{gap["selector"]}"')

def check_empty_states(page, page_name):
    """检测空状态和占位内容"""
    empty_text = page.evaluate("""() => {
        const body = document.body.innerText || '';
        const placeholders = [
            '敬请期待', '暂未开放', '即将上线', 'TODO', 'FIXME',
            'placeholder', 'lorem ipsum', ' Coming Soon', '未实现',
            '功能开发中', '待完善', '建设中',
        ];
        const found = [];
        for (const p of placeholders) {
            if (body.toLowerCase().includes(p.toLowerCase())) {
                found.push(p);
            }
        }
        return found;
    }""")
    for text in empty_text:
        add_issue('unimplemented', page_name, 'medium', f'发现占位文本: "{text}"')

    # 检测空链接
    empty_links = page.evaluate("""() => {
        const links = [...document.querySelectorAll('a[href="#"], a[href=""], a[href="javascript:void(0)"]')];
        return links.map(a => a.textContent?.trim().slice(0, 30) || '(empty)').slice(0, 5);
    }""")
    for link in empty_links:
        add_issue('ui_defects', page_name, 'medium', f'空链接: "{link}"')

def check_interactive_elements(page, page_name):
    """检测交互元素问题"""
    # 检测按钮无 focus-visible 样式
    no_focus = page.evaluate("""() => {
        const buttons = [...document.querySelectorAll('button, a, [role="button"]')];
        const visible = buttons.filter(b => {
            const r = b.getBoundingClientRect();
            return r.width > 0 && r.height > 0 && b.offsetParent !== null;
        });
        const noFocus = [];
        for (const btn of visible.slice(0, 30)) {
            const style = window.getComputedStyle(btn);
            const hasRing = style.outlineWidth !== '0px' ||
                          btn.className.includes('focus-visible') ||
                          btn.className.includes('focus:ring');
            const isSmall = btn.getBoundingClientRect().width < 40 || btn.getBoundingClientRect().height < 40;
            const hasAria = btn.hasAttribute('aria-label') || btn.textContent?.trim().length > 0;
            if (isSmall && !hasAria) {
                noFocus.push({text: btn.textContent?.trim().slice(0, 20), issue: 'small_no_label'});
            }
        }
        return noFocus.slice(0, 5);
    }""")
    for item in no_focus:
        if item['issue'] == 'small_no_label':
            add_issue('ui_defects', page_name, 'medium',
                      f'小按钮缺少 aria-label: "{item["text"]}"')

    # 检测图片加载失败
    broken_images = page.evaluate("""() => {
        const imgs = [...document.querySelectorAll('img')];
        return imgs.filter(img => {
            return img.naturalWidth === 0 && img.src && !img.src.includes('data:');
        }).map(img => img.src.slice(0, 80));
    }""")
    for src in broken_images:
        add_issue('functional_bugs', page_name, 'medium', f'图片加载失败: {src}')

def check_loading_states(page, page_name):
    """检测加载状态是否卡住"""
    # 检测是否有持续显示的 loading spinner
    spinners = page.evaluate("""() => {
        const spinners = document.querySelectorAll('[class*="animate-spin"], [class*="loading"], [class*="spinner"]');
        return spinners.length;
    }""")
    if spinners > 0:
        page.wait_for_timeout(3000)
        spinners_after = page.evaluate("""() => {
            return document.querySelectorAll('[class*="animate-spin"], [class*="loading"], [class*="spinner"]').length;
        }""")
        if spinners_after > 0:
            add_issue('ui_defects', page_name, 'high',
                      f'加载状态卡住: {spinners_after} 个 spinner 持续显示超过 3 秒')

def safe_navigate(page, path, page_name, timeout=15000):
    """安全导航，处理超时和错误"""
    try:
        page.goto(BASE_URL + path, wait_until='networkidle', timeout=timeout)
        page.wait_for_timeout(1000)
        return True
    except Exception as e:
        add_issue('functional_bugs', page_name, 'critical',
                  f'页面导航失败: {str(e)[:100]}')
        return False

def check_white_screen(page, page_name):
    """检测白屏"""
    body_text = page.evaluate("""() => {
        return (document.body.innerText || '').trim().length;
    }""")
    if body_text < 5:
        add_issue('functional_bugs', page_name, 'critical',
                  '页面白屏: body 文本内容为空')
        return True
    return False


# ═══════════════════════════════════════════════════════════════
# 测试模块
# ═══════════════════════════════════════════════════════════════

def test_module_1_public_pages(browser):
    """模块 1：公开页面测试"""
    print('\n[模块 1] 测试公开页面...')
    page = browser.new_page(viewport=VIEWPORT)
    setup_console_capture(page)

    # 1.1 登录页
    print('  - 测试 /login')
    safe_navigate(page, '/login', 'login')
    if not check_white_screen(page, 'login'):
        screenshot(page, '01_login_default')
        check_layout_issues(page, 'login')
        check_empty_states(page, 'login')
        check_interactive_elements(page, 'login')

        # 检查手机号输入框
        phone_input = page.query_selector('input[type="tel"], input[placeholder*="手机"]')
        if not phone_input:
            add_issue('functional_bugs', 'login', 'high', '未找到手机号输入框')

        # 检查游客模式按钮
        guest_btn = page.query_selector('text=游客')
        if not guest_btn:
            add_issue('ui_defects', 'login', 'medium', '未找到游客模式入口')

    # 1.2 验证码页
    print('  - 测试 /verify-code')
    safe_navigate(page, '/verify-code?phone=13800138000', 'verify-code')
    if not check_white_screen(page, 'verify-code'):
        screenshot(page, '02_verify_code')
        check_layout_issues(page, 'verify-code')
        check_interactive_elements(page, 'verify-code')

    # 1.3 协议页
    print('  - 测试 /agreement')
    safe_navigate(page, '/agreement', 'agreement')
    if not check_white_screen(page, 'agreement'):
        screenshot(page, '03_agreement')
        check_layout_issues(page, 'agreement')
        check_empty_states(page, 'agreement')

    page.close()


def test_module_2_auth_flow(browser):
    """模块 2：认证流程测试"""
    print('\n[模块 2] 测试认证流程...')
    page = browser.new_page(viewport=VIEWPORT)
    setup_console_capture(page)

    # 2.1 游客模式登录
    print('  - 测试游客模式登录')
    safe_navigate(page, '/login', 'auth-guest')
    guest_btn = page.query_selector('text=游客')
    if guest_btn:
        guest_btn.click()
        page.wait_for_timeout(2000)
        url = page.url
        if 'onboarding' in url:
            screenshot(page, '04_guest_onboarding')
        else:
            add_issue('functional_bugs', 'auth-guest', 'high',
                      f'游客登录后跳转异常: {url} (期望 /onboarding)')
    else:
        add_issue('functional_bugs', 'auth-guest', 'high', '游客模式按钮不可点击或不存在')

    # 2.2 Token 自动登录
    print('  - 测试 Token 自动登录')
    page.goto(BASE_URL + '/login', wait_until='domcontentloaded', timeout=15000)
    page.evaluate("""() => {
        localStorage.setItem('mq_token', 'invalid-token-test');
        localStorage.setItem('lastPhone', '13800138000');
        localStorage.setItem('userId', 'test-user-001');
    }""")
    page.reload(wait_until='networkidle', timeout=15000)
    page.wait_for_timeout(2000)
    # 无效 token 应该被清除并停留在 login
    url = page.url
    if 'login' not in url and 'onboarding' not in url:
        add_issue('functional_bugs', 'auth-token', 'medium',
                  f'无效 token 未正确处理: 停留在 {url}')

    page.close()


def test_module_3_onboarding_assessment(browser):
    """模块 3：Onboarding + Assessment 流程测试"""
    print('\n[模块 3] 测试 Onboarding + Assessment 流程...')
    page = browser.new_page(viewport=VIEWPORT)
    setup_console_capture(page)

    # 注入登录但未完成 onboarding 的状态
    page.goto(BASE_URL + '/login', wait_until='domcontentloaded', timeout=15000)
    page.wait_for_timeout(300)
    user_state = {
        "state": {
            "isLoggedIn": True,
            "userId": "onboard-user-003",
            "hasCompletedOnboarding": False,
            "profile": {"avatar": "", "nickname": "", "learningStage": "primary", "learningGoal": "consolidation", "targetGrade": 0},
            "grade": 0,
            "xp": 0, "coins": 80, "diamonds": 5, "hearts": 5, "maxHearts": 5,
            "streak": 1, "comboMax": 0, "rank": "青铜",
            "unlockedLevels": [], "completedLevels": {},
            "mistakeIds": [], "mistakeMastery": {}, "achievements": [], "achievementsMeta": [],
            "systemConfigs": {}, "settings": {"sound": True, "vibration": True},
            "lastActiveDate": time.strftime('%Y-%m-%d'),
            "assessment": None, "dailyGoals": [], "dailyGoalDate": time.strftime('%Y-%m-%d'),
            "dailyXp": 0, "dailyQuestions": 0, "inventory": [], "treasureBoxes": [],
            "learningStats": {"totalQuestions": 0, "correctQuestions": 0, "totalDays": 1, "weeklyStreak": 1, "knowledgeProgress": {}},
        },
        "version": 0,
    }
    state_json = json.dumps(user_state)
    page.evaluate("""(state) => {
        localStorage.setItem('mathquest.user.v1', state);
        localStorage.removeItem('mq_token');
    }""", state_json)
    page.reload(wait_until='networkidle', timeout=15000)
    page.wait_for_timeout(2000)

    # 3.1 Onboarding 流程
    print('  - 测试 Onboarding 步骤')
    safe_navigate(page, '/onboarding', 'onboarding')
    if not check_white_screen(page, 'onboarding'):
        screenshot(page, '05_onboarding_step1')
        check_layout_issues(page, 'onboarding')
        check_interactive_elements(page, 'onboarding')

        # 尝试点击第一个学习阶段选项
        stage_btns = page.query_selector_all('button')
        if len(stage_btns) > 0:
            try:
                stage_btns[0].click()
                page.wait_for_timeout(500)
                # 找"下一步"按钮
                next_btn = page.query_selector('text=下一步') or page.query_selector('text=继续')
                if next_btn:
                    next_btn.click()
                    page.wait_for_timeout(500)
                    screenshot(page, '06_onboarding_step2')
            except:
                pass

    # 3.2 Assessment 页面
    print('  - 测试 Assessment 页面')
    inject_full_user_state(page)
    # 重置 onboarding 完成状态但保留登录
    page.goto(BASE_URL + '/login', wait_until='domcontentloaded', timeout=15000)
    page.wait_for_timeout(300)
    user_state["state"]["hasCompletedOnboarding"] = True
    user_state["state"]["profile"]["targetGrade"] = 2
    user_state["state"]["grade"] = 2
    state_json = json.dumps(user_state)
    page.evaluate("""(state) => {
        localStorage.setItem('mathquest.user.v1', state);
    }""", state_json)
    page.reload(wait_until='networkidle', timeout=15000)
    page.wait_for_timeout(2000)

    safe_navigate(page, '/assessment', 'assessment')
    if not check_white_screen(page, 'assessment'):
        screenshot(page, '07_assessment')
        check_layout_issues(page, 'assessment')
        check_interactive_elements(page, 'assessment')
        check_loading_states(page, 'assessment')

    page.close()


def test_module_4_core_pages(browser):
    """模块 4：核心功能页面测试"""
    print('\n[模块 4] 测试核心功能页面...')
    page = browser.new_page(viewport=VIEWPORT)
    setup_console_capture(page)
    inject_full_user_state(page)

    pages_to_test = [
        ('home', '/', '08_home'),
        ('battle', '/battle/g2-L1', '09_battle'),
        ('mistakes', '/mistakes', '10_mistakes'),
        ('leaderboard', '/leaderboard', '11_leaderboard'),
        ('profile', '/profile', '12_profile'),
        ('daily-goals', '/daily-goals', '13_daily_goals'),
        ('stats', '/stats', '14_stats'),
    ]

    for page_name, path, screenshot_name in pages_to_test:
        print(f'  - 测试 {page_name} ({path})')
        if safe_navigate(page, path, page_name):
            if not check_white_screen(page, page_name):
                screenshot(page, screenshot_name)
                check_layout_issues(page, page_name)
                check_empty_states(page, page_name)
                check_interactive_elements(page, page_name)
                check_loading_states(page, page_name)

                # 特定页面检查
                if page_name == 'home':
                    # 检查关卡节点
                    nodes = page.query_selector_all('[class*="LevelNode"], [class*="level-node"], button[class*="cursor-pointer"]')
                    if len(nodes) == 0:
                        add_issue('functional_bugs', 'home', 'high', '首页未渲染任何关卡节点')
                    # 检查底部导航
                    nav = page.query_selector('nav')
                    if not nav:
                        add_issue('functional_bugs', 'home', 'high', '首页缺少底部导航')

                elif page_name == 'battle':
                    # 检查题目内容
                    question = page.query_selector('[class*="prompt"], [class*="question"]')
                    if not question:
                        body = page.inner_text('body')[:200]
                        if '关卡不存在' in body or '未找到' in body:
                            add_issue('functional_bugs', 'battle', 'high', '答题页面显示"关卡不存在"，可能后端未返回题目数据')
                        else:
                            add_issue('functional_bugs', 'battle', 'medium', f'答题页面未找到题目内容')
                    # 检查退出按钮
                    exit_btn = page.query_selector('button[aria-label="退出答题"]')
                    if exit_btn:
                        exit_btn.click()
                        page.wait_for_timeout(500)
                        screenshot(page, '09b_battle_exit_confirm')
                        # 取消退出
                        cancel_btn = page.query_selector('text=继续答题')
                        if cancel_btn:
                            cancel_btn.click()
                            page.wait_for_timeout(300)

                elif page_name == 'mistakes':
                    # 检查空状态
                    body = page.inner_text('body')
                    if '暂无' in body or '还没有' in body or '空' in body:
                        add_issue('unimplemented', 'mistakes', 'low', '错题本为空状态（注入了错题但可能未正确显示）')

                elif page_name == 'leaderboard':
                    # 检查 Tab 切换
                    tabs = page.query_selector_all('button[class*="flex-1"]')
                    if len(tabs) < 3:
                        add_issue('ui_defects', 'leaderboard', 'medium', f'排行榜 Tab 数量不足: {len(tabs)} (期望 3)')

                elif page_name == 'profile':
                    # 检查头像
                    avatar = page.query_selector('button[class*="rounded-full"]')
                    if not avatar:
                        add_issue('ui_defects', 'profile', 'medium', '个人中心未找到头像按钮')
                    # 检查退出登录按钮
                    logout_btn = page.query_selector('text=退出登录')
                    if not logout_btn:
                        add_issue('functional_bugs', 'profile', 'high', '个人中心缺少退出登录按钮')

                elif page_name == 'daily-goals':
                    # 检查签到功能
                    checkin = page.query_selector('text=签到') or page.query_selector('text=打卡')
                    if not checkin:
                        add_issue('ui_defects', 'daily-goals', 'low', '每日目标页未找到签到入口')

                elif page_name == 'stats':
                    # 检查统计数据
                    body = page.inner_text('body')
                    if '0' == body.strip()[:1] and len(body.strip()) < 10:
                        add_issue('functional_bugs', 'stats', 'medium', '统计页面可能未正确显示数据')

    page.close()


def test_module_4b_new_user_pages(browser):
    """模块 4b：新用户（空数据）页面测试"""
    print('\n[模块 4b] 测试新用户空数据状态...')
    page = browser.new_page(viewport=VIEWPORT)
    setup_console_capture(page)
    inject_new_user_state(page)

    empty_state_pages = [
        ('mistakes-empty', '/mistakes', '15_mistakes_empty'),
        ('leaderboard-empty', '/leaderboard', '16_leaderboard_empty'),
        ('stats-empty', '/stats', '17_stats_empty'),
        ('daily-goals-empty', '/daily-goals', '18_daily_goals_empty'),
        ('profile-empty', '/profile', '19_profile_empty'),
        ('home-empty', '/', '20_home_empty'),
    ]

    for page_name, path, screenshot_name in empty_state_pages:
        print(f'  - 测试 {page_name}')
        if safe_navigate(page, path, page_name):
            if not check_white_screen(page, page_name):
                screenshot(page, screenshot_name)
                check_layout_issues(page, page_name)
                check_empty_states(page, page_name)

    page.close()


def test_module_5_interactive_elements(browser):
    """模块 5：交互元素测试"""
    print('\n[模块 5] 测试交互元素...')
    page = browser.new_page(viewport=VIEWPORT)
    setup_console_capture(page)
    inject_full_user_state(page)

    # 测试首页交互
    print('  - 测试首页 Tab 键导航')
    safe_navigate(page, '/', 'interactive-home')
    if not check_white_screen(page, 'interactive-home'):
        # 模拟 Tab 键导航
        for i in range(5):
            page.keyboard.press('Tab')
            page.wait_for_timeout(200)
        screenshot(page, '21_home_tab_focus')

        # 检查当前 focused 元素是否有 focus-visible
        focused_info = page.evaluate("""() => {
            const el = document.activeElement;
            if (!el || el === document.body) return null;
            const style = window.getComputedStyle(el);
            const hasOutline = style.outlineStyle !== 'none' && style.outlineWidth !== '0px';
            const hasRing = el.className.includes('focus-visible') ||
                          el.className.includes('ring-2') ||
                          el.className.includes('ring-ring');
            return {
                tag: el.tagName,
                text: el.textContent?.trim().slice(0, 30),
                hasOutline: hasOutline,
                hasRing: hasRing,
                className: el.className?.slice(0, 80),
            };
        }""")
        if focused_info and not focused_info['hasOutline'] and not focused_info['hasRing']:
            add_issue('ui_defects', 'interactive-home', 'medium',
                      f'Tab 键聚焦后无焦点环: <{focused_info["tag"]}> "{focused_info["text"]}"')

    # 测试底部导航点击
    print('  - 测试底部导航')
    nav_links = page.query_selector_all('nav a')
    if len(nav_links) == 0:
        add_issue('functional_bugs', 'interactive-nav', 'high', '底部导航无链接')
    else:
        for i, link in enumerate(nav_links[:5]):
            try:
                link.click()
                page.wait_for_timeout(1000)
                url = page.url
                screenshot(page, f'22_nav_{i+1}')
            except:
                pass

    page.close()


def test_module_6_admin(browser):
    """模块 6：管理后台测试"""
    print('\n[模块 6] 测试管理后台...')
    page = browser.new_page(viewport=VIEWPORT)
    setup_console_capture(page)

    admin_pages = [
        ('admin-login', '/admin/login', '23_admin_login'),
        ('admin-dashboard', '/admin/dashboard', '24_admin_dashboard'),
        ('admin-questions', '/admin/questions', '25_admin_questions'),
        ('admin-analytics', '/admin/analytics', '26_admin_analytics'),
        ('admin-import', '/admin/import', '27_admin_import'),
        ('admin-config', '/admin/config', '28_admin_config'),
        ('admin-accounts', '/admin/accounts', '29_admin_accounts'),
    ]

    # 先访问登录页注入管理员 token
    safe_navigate(page, '/admin/login', 'admin-login')
    if not check_white_screen(page, 'admin-login'):
        screenshot(page, '23_admin_login')
        check_layout_issues(page, 'admin-login')

        # 尝试登录
        # 注入管理员 token
        page.evaluate("""() => {
            localStorage.setItem('admin_auth', JSON.stringify({username: 'admin', role: 'super'}));
            localStorage.setItem('admin_token', 'test-admin-token');
        }""")

    for page_name, path, screenshot_name in admin_pages[1:]:
        print(f'  - 测试 {page_name}')
        if safe_navigate(page, path, page_name):
            if not check_white_screen(page, page_name):
                screenshot(page, screenshot_name)
                check_layout_issues(page, page_name)
                check_empty_states(page, page_name)
                check_interactive_elements(page, page_name)
                check_loading_states(page, page_name)

    page.close()


def test_module_7_edge_cases(browser):
    """模块 7：边界情况测试"""
    print('\n[模块 7] 测试边界情况...')
    page = browser.new_page(viewport=VIEWPORT)
    setup_console_capture(page)

    # 7.1 非法路由
    print('  - 测试非法路由')
    safe_navigate(page, '/nonexistent-page', 'edge-404')
    url = page.url
    body = page.inner_text('body')[:200] if not check_white_screen(page, 'edge-404') else ''
    screenshot(page, '30_404_page')
    # 检查是否被重定向到 login
    if 'login' in url:
        pass  # 正确行为：未登录重定向到 login
    else:
        add_issue('ui_defects', 'edge-404', 'medium',
                  f'非法路由处理: 重定向到 {url}，可能缺少 404 页面')

    # 7.2 清除 localStorage 后访问
    print('  - 测试 localStorage 清除')
    page.evaluate("() => { localStorage.clear(); }")
    safe_navigate(page, '/', 'edge-no-storage')
    url = page.url
    if 'login' not in url:
        add_issue('functional_bugs', 'edge-no-storage', 'high',
                  f'清除 localStorage 后未重定向到登录页: {url}')
    screenshot(page, '31_no_storage')

    # 7.3 极端数据测试（超长昵称）
    print('  - 测试极端数据')
    page.goto(BASE_URL + '/login', wait_until='domcontentloaded', timeout=15000)
    page.wait_for_timeout(300)
    extreme_state = {
        "state": {
            "isLoggedIn": True, "userId": "extreme-004",
            "hasCompletedOnboarding": True,
            "profile": {"avatar": "🦁", "nickname": "A" * 100, "learningStage": "primary", "learningGoal": "consolidation", "targetGrade": 2},
            "grade": 2, "xp": 999999, "coins": 999999, "diamonds": 999999,
            "hearts": 0, "maxHearts": 5, "streak": 999, "comboMax": 999,
            "rank": "王者", "unlockedLevels": ["g2-L1"], "completedLevels": {},
            "mistakeIds": [], "mistakeMastery": {}, "achievements": [], "achievementsMeta": [],
            "systemConfigs": {}, "settings": {"sound": True, "vibration": True},
            "lastActiveDate": time.strftime('%Y-%m-%d'),
            "assessment": None, "dailyGoals": [], "dailyGoalDate": time.strftime('%Y-%m-%d'),
            "dailyXp": 0, "dailyQuestions": 0, "inventory": [], "treasureBoxes": [],
            "learningStats": {"totalQuestions": 0, "correctQuestions": 0, "totalDays": 1, "weeklyStreak": 1, "knowledgeProgress": {}},
        },
        "version": 0,
    }
    state_json = json.dumps(extreme_state)
    page.evaluate("""(state) => {
        localStorage.setItem('mathquest.user.v1', state);
        localStorage.removeItem('mq_token');
    }""", state_json)
    page.reload(wait_until='networkidle', timeout=15000)
    page.wait_for_timeout(2000)

    safe_navigate(page, '/profile', 'edge-extreme')
    if not check_white_screen(page, 'edge-extreme'):
        screenshot(page, '32_extreme_profile')
        check_layout_issues(page, 'edge-extreme')
        # 检查超长昵称是否溢出
        nickname_overflow = page.evaluate("""() => {
            const els = document.querySelectorAll('h2, h1, [class*="nickname"], [class*="truncate"]');
            for (const el of els) {
                if (el.scrollWidth > el.clientWidth) {
                    return {text: el.textContent?.slice(0, 50), scrollWidth: el.scrollWidth, clientWidth: el.clientWidth};
                }
            }
            return null;
        }""")
        if nickname_overflow:
            add_issue('style_issues', 'edge-extreme', 'medium',
                      f'超长昵称溢出: "{nickname_overflow["text"]}..." scrollWidth={nickname_overflow["scrollWidth"]} > clientWidth={nickname_overflow["clientWidth"]}')

    # 7.4 0 心数测试
    print('  - 测试 0 心数')
    safe_navigate(page, '/battle/g2-L1', 'edge-zero-hearts')
    page.wait_for_timeout(2000)
    screenshot(page, '33_zero_hearts_battle')
    body = page.inner_text('body')[:300]
    if '心数耗尽' in body:
        pass  # 正确行为
    elif '关卡不存在' in body:
        add_issue('functional_bugs', 'edge-zero-hearts', 'medium',
                  '0 心数测试时关卡不存在，可能后端未返回题目')

    page.close()


# ═══════════════════════════════════════════════════════════════
# 主函数
# ═══════════════════════════════════════════════════════════════

def main():
    print('=' * 60)
    print('前端应用全面测试 — 开始')
    print('=' * 60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # 运行所有测试模块
        test_module_1_public_pages(browser)
        test_module_2_auth_flow(browser)
        test_module_3_onboarding_assessment(browser)
        test_module_4_core_pages(browser)
        test_module_4b_new_user_pages(browser)
        test_module_5_interactive_elements(browser)
        test_module_6_admin(browser)
        test_module_7_edge_cases(browser)

        browser.close()

    # 去重控制台错误
    seen = set()
    unique_errors = []
    for err in issues['console_errors']:
        key = err['text'][:100]
        if key not in seen:
            seen.add(key)
            unique_errors.append(err)
    issues['console_errors'] = unique_errors

    # 输出报告
    with open(REPORT_PATH, 'w', encoding='utf-8') as f:
        json.dump(issues, f, ensure_ascii=False, indent=2)

    # 打印汇总
    print('\n' + '=' * 60)
    print('测试完成 — 问题汇总')
    print('=' * 60)
    print(f'  样式问题:     {len(issues["style_issues"])}')
    print(f'  UI 缺陷:      {len(issues["ui_defects"])}')
    print(f'  功能缺陷:     {len(issues["functional_bugs"])}')
    print(f'  未实现功能:   {len(issues["unimplemented"])}')
    print(f'  控制台错误:   {len(issues["console_errors"])}')
    print(f'  截图数量:     {len(issues["screenshots"])}')
    print(f'\n报告已保存到: {REPORT_PATH}')
    print(f'截图目录:     {SCREENSHOT_DIR}/')

    # 打印详细问题列表
    for category, label in [
        ('functional_bugs', '功能缺陷'),
        ('ui_defects', 'UI 缺陷'),
        ('style_issues', '样式问题'),
        ('unimplemented', '未实现功能'),
    ]:
        if issues[category]:
            print(f'\n--- {label} ---')
            for i, item in enumerate(issues[category], 1):
                print(f'  {i}. [{item["severity"]}] {item["page"]}: {item["description"]}')

    if issues['console_errors']:
        print(f'\n--- 控制台错误 (前 10 条) ---')
        for i, err in enumerate(issues['console_errors'][:10], 1):
            print(f'  {i}. {err["text"][:100]}')


if __name__ == '__main__':
    main()
