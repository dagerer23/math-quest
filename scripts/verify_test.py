#!/usr/bin/env python3
"""快速验证测试 — 确认哪些是真问题，哪些是 429 限流导致的误报"""
import json, time, os
from playwright.sync_api import sync_playwright

BASE_URL = 'http://localhost:5173'
SCREENSHOT_DIR = '/workspace/public/comprehensive-test'
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def inject_full_user_state(page):
    page.goto(BASE_URL + '/login', wait_until='domcontentloaded', timeout=15000)
    page.wait_for_timeout(500)
    user_state = {
        "state": {
            "isLoggedIn": True, "userId": "test-user-001",
            "lastLoginAt": int(time.time() * 1000), "hasCompletedOnboarding": True,
            "profile": {"avatar": "🦁", "nickname": "测试同学", "learningStage": "primary", "learningGoal": "consolidation", "targetGrade": 2, "phone": "13800138000"},
            "grade": 2, "xp": 1500, "coins": 320, "diamonds": 12, "hearts": 5, "maxHearts": 5,
            "streak": 7, "comboMax": 15, "rank": "白银",
            "unlockedLevels": ["g2-L1", "g2-L2", "g2-L3", "g2-L4", "g2-L5"],
            "completedLevels": {"g2-L1": {"stars": 3, "bestScore": 100}, "g2-L2": {"stars": 2, "bestScore": 80}, "g2-L3": {"stars": 1, "bestScore": 50}},
            "mistakeIds": ["q1", "q2", "q3"], "mistakeMastery": {"q1": 1, "q2": 0, "q3": 2},
            "achievements": [{"id": "first_win", "name": "初战告捷", "description": "完成第一关", "icon": "🏆", "unlockedAt": 1700000000000}],
            "achievementsMeta": [{"id": "first_win", "name": "初战告捷", "description": "完成第一关", "icon": "🏆"}, {"id": "streak_7", "name": "坚持一周", "description": "连续学习7天", "icon": "🔥"}],
            "systemConfigs": {"combo.show_threshold": "3", "combo.sound_threshold": "5", "hearts.max": "5", "xp.per_correct": "10", "coins.per_correct": "5"},
            "settings": {"sound": True, "vibration": True},
            "lastActiveDate": time.strftime('%Y-%m-%d'), "lastCheckInDate": time.strftime('%Y-%m-%d'),
            "assessment": {"id": "test-assessment-001", "completedAt": 1700000000000, "score": 80, "recommendedDifficulty": 2, "answers": []},
            "dailyGoals": [{"id": "g1", "targetXp": 100, "targetQuestions": 10, "completed": False}],
            "dailyGoalDate": time.strftime('%Y-%m-%d'), "dailyXp": 120, "dailyQuestions": 15,
            "inventory": [], "treasureBoxes": [],
            "learningStats": {"totalQuestions": 250, "correctQuestions": 200, "totalDays": 15, "weeklyStreak": 5, "knowledgeProgress": {"加减法": 0.8}},
        },
        "version": 0,
    }
    page.evaluate(f"""() => {{
        localStorage.setItem('mathquest.user.v1', '{json.dumps(json.dumps(user_state))}');
        localStorage.setItem('mq_token', 'test-fake-token-001');
        localStorage.setItem('lastPhone', '13800138000');
        localStorage.setItem('userId', 'test-user-001');
    }}""")
    page.reload(wait_until='networkidle', timeout=15000)
    page.wait_for_timeout(2000)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 375, 'height': 812})

    # 捕获控制台
    console_msgs = []
    page.on('console', lambda msg: console_msgs.append(f'[{msg.type}] {msg.text[:200]}') if msg.type in ('error', 'warning') else None)
    page.on('pageerror', lambda err: console_msgs.append(f'[pageerror] {str(err)[:200]}'))

    inject_full_user_state(page)

    # 1. 验证首页
    print('=== 验证首页 ===')
    page.goto(BASE_URL + '/', wait_until='networkidle', timeout=15000)
    page.wait_for_timeout(3000)

    # 获取页面完整信息
    home_info = page.evaluate("""() => {
        const body = document.body.innerText.slice(0, 500);
        const buttons = [...document.querySelectorAll('button')].map(b => ({
            text: b.textContent?.trim().slice(0, 30),
            className: b.className?.slice(0, 60),
            visible: b.offsetParent !== null,
        })).filter(b => b.visible);
        const navLinks = [...document.querySelectorAll('nav a')].map(a => ({
            text: a.textContent?.trim().slice(0, 20),
            href: a.getAttribute('href'),
        }));
        const allLinks = [...document.querySelectorAll('a')].map(a => ({
            text: a.textContent?.trim().slice(0, 20),
            href: a.getAttribute('href'),
        }));
        // 检查是否有关卡相关元素
        const levelElements = document.querySelectorAll('[class*="level"], [class*="Level"], [class*="node"], [class*="Node"]');
        return { bodyPreview: body, buttons: buttons.slice(0, 15), navLinks, allLinks: allLinks.slice(0, 10), levelCount: levelElements.length };
    }""")
    print(f'Body preview: {home_info["bodyPreview"][:200]}')
    print(f'Button count: {len(home_info["buttons"])}')
    print(f'Nav links: {home_info["navLinks"]}')
    print(f'All links: {home_info["allLinks"]}')
    print(f'Level elements: {home_info["levelCount"]}')
    if home_info["buttons"]:
        for b in home_info["buttons"][:10]:
            print(f'  Button: "{b["text"]}" class="{b["className"][:40]}"')

    page.screenshot(path=f'{SCREENSHOT_DIR}/verify_home.png', full_page=True)

    # 2. 验证 Profile
    print('\n=== 验证 Profile ===')
    page.wait_for_timeout(2000)  # 避免 429
    page.goto(BASE_URL + '/profile', wait_until='networkidle', timeout=15000)
    page.wait_for_timeout(2000)

    profile_info = page.evaluate("""() => {
        const body = document.body.innerText.slice(0, 800);
        const buttons = [...document.querySelectorAll('button')].map(b => ({
            text: b.textContent?.trim().slice(0, 30),
            className: b.className?.slice(0, 80),
            visible: b.offsetParent !== null,
            ariaLabel: b.getAttribute('aria-label'),
        })).filter(b => b.visible);
        const logout = document.body.innerText.includes('退出登录');
        const avatar = document.querySelector('button[class*="rounded-full"]');
        return { bodyPreview: body, buttons: buttons.slice(0, 20), hasLogout: logout, hasAvatar: !!avatar, avatarClass: avatar?.className?.slice(0, 80) };
    }""")
    print(f'Has "退出登录": {profile_info["hasLogout"]}')
    print(f'Has avatar button: {profile_info["hasAvatar"]}')
    print(f'Avatar class: {profile_info["avatarClass"]}')
    print(f'Button count: {len(profile_info["buttons"])}')
    for b in profile_info["buttons"][:15]:
        print(f'  Button: "{b["text"]}" aria="{b["ariaLabel"]}" class="{b["className"][:50]}"')

    page.screenshot(path=f'{SCREENSHOT_DIR}/verify_profile.png', full_page=True)

    # 3. 验证 Leaderboard
    print('\n=== 验证 Leaderboard ===')
    page.wait_for_timeout(2000)
    page.goto(BASE_URL + '/leaderboard', wait_until='networkidle', timeout=15000)
    page.wait_for_timeout(2000)

    leaderboard_info = page.evaluate("""() => {
        const buttons = [...document.querySelectorAll('button')].map(b => ({
            text: b.textContent?.trim().slice(0, 30),
            className: b.className?.slice(0, 80),
            visible: b.offsetParent !== null,
        })).filter(b => b.visible);
        const flexButtons = document.querySelectorAll('button[class*="flex-1"]');
        const allButtons = document.querySelectorAll('button');
        return { buttons: buttons.slice(0, 15), flexCount: flexButtons.length, allCount: allButtons.length };
    }""")
    print(f'Flex-1 buttons: {leaderboard_info["flexCount"]}')
    print(f'All buttons: {leaderboard_info["allCount"]}')
    for b in leaderboard_info["buttons"][:10]:
        print(f'  Button: "{b["text"]}" class="{b["className"][:50]}"')

    page.screenshot(path=f'{SCREENSHOT_DIR}/verify_leaderboard.png', full_page=True)

    # 4. 验证 Battle
    print('\n=== 验证 Battle ===')
    page.wait_for_timeout(2000)
    page.goto(BASE_URL + '/battle/g2-L1', wait_until='networkidle', timeout=15000)
    page.wait_for_timeout(2000)

    battle_info = page.evaluate("""() => {
        const body = document.body.innerText.slice(0, 500);
        const buttons = [...document.querySelectorAll('button')].map(b => ({
            text: b.textContent?.trim().slice(0, 30),
            ariaLabel: b.getAttribute('aria-label'),
            visible: b.offsetParent !== null,
        })).filter(b => b.visible);
        return { bodyPreview: body, buttons: buttons.slice(0, 15) };
    }""")
    print(f'Body preview: {battle_info["bodyPreview"][:300]}')
    print(f'Buttons: {len(battle_info["buttons"])}')
    for b in battle_info["buttons"][:10]:
        print(f'  Button: "{b["text"]}" aria="{b["ariaLabel"]}"')

    page.screenshot(path=f'{SCREENSHOT_DIR}/verify_battle.png', full_page=True)

    # 5. 验证 Daily Goals
    print('\n=== 验证 Daily Goals ===')
    page.wait_for_timeout(2000)
    page.goto(BASE_URL + '/daily-goals', wait_until='networkidle', timeout=15000)
    page.wait_for_timeout(2000)

    daily_info = page.evaluate("""() => {
        const body = document.body.innerText.slice(0, 500);
        const hasCheckin = document.body.innerText.includes('签到') || document.body.innerText.includes('打卡');
        const buttons = [...document.querySelectorAll('button')].map(b => b.textContent?.trim().slice(0, 30)).filter(t => t);
        return { bodyPreview: body, hasCheckin, buttons: buttons.slice(0, 10) };
    }""")
    print(f'Has 签到/打卡: {daily_info["hasCheckin"]}')
    print(f'Body: {daily_info["bodyPreview"][:200]}')
    print(f'Buttons: {daily_info["buttons"]}')

    page.screenshot(path=f'{SCREENSHOT_DIR}/verify_daily_goals.png', full_page=True)

    # 打印控制台消息
    print('\n=== 控制台消息 ===')
    for msg in console_msgs[:20]:
        print(f'  {msg}')

    browser.close()
    print('\n验证完成！')
