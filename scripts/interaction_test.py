import os
from playwright.sync_api import sync_playwright

SCREENSHOT_DIR = '/workspace/public/interaction-screenshots'
os.makedirs(SCREENSHOT_DIR, exist_ok=True)
BASE_URL = 'http://localhost:5174'

def inject_auth(page):
    page.goto(BASE_URL + '/login', wait_until='domcontentloaded', timeout=10000)
    page.wait_for_timeout(500)
    page.evaluate("""() => {
        localStorage.setItem('mathquest_token', 'test-fake-token');
        const userState = {
            state: {
                isLoggedIn: true,
                hasCompletedOnboarding: true,
                phone: '13800138000',
                userId: 'test-user-123',
                profile: {
                    nickname: '测试同学',
                    avatar: 'default',
                    learningStage: 'primary',
                    learningGoal: 'exam',
                    targetGrade: 'grade3',
                },
                grade: 'grade3',
                assessment: {
                    id: 'test-assessment',
                    completedAt: new Date().toISOString(),
                    score: 85,
                    recommendedDifficulty: 'medium',
                    answers: [],
                },
                dailyGoals: [],
                dailyGoalDate: new Date().toISOString().split('T')[0],
                dailyXp: 120,
                dailyQuestions: 15,
                streak: 5,
                lastActiveDate: new Date().toISOString().split('T')[0],
            },
            version: 0
        };
        localStorage.setItem('user-storage', JSON.stringify(userState));
    }""")
    page.reload(wait_until='networkidle', timeout=10000)
    page.wait_for_timeout(1000)

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 390, 'height': 844},
            device_scale_factor=2,
        )

        # ===== 1. Login page - check focus states =====
        print("\n=== Login Page ===")
        page = context.new_page()
        page.goto(BASE_URL + '/login', wait_until='networkidle', timeout=10000)
        page.wait_for_timeout(1500)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, '01-login-default.png'), full_page=True)

        # Focus on phone input
        phone_input = page.locator('input[type="tel"]')
        if phone_input.count() > 0:
            phone_input.click()
            page.wait_for_timeout(300)
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, '02-login-input-focus.png'), full_page=True)
            # Type some text
            phone_input.fill('13800138000')
            page.wait_for_timeout(300)
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, '03-login-input-filled.png'), full_page=True)

        # Tab to the send code button
        page.keyboard.press('Tab')
        page.wait_for_timeout(300)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, '04-login-button-focus.png'), full_page=True)

        # ===== 2. Profile page - avatar click =====
        print("\n=== Profile Page ===")
        page2 = context.new_page()
        inject_auth(page2)
        page2.goto(BASE_URL + '/profile', wait_until='networkidle', timeout=10000)
        page2.wait_for_timeout(2000)
        page2.screenshot(path=os.path.join(SCREENSHOT_DIR, '05-profile-default.png'), full_page=True)

        # Click avatar
        avatar_btn = page2.locator('button').filter(has_text='').first
        # Try to find the avatar button more specifically
        avatar_buttons = page2.locator('button')
        for i in range(min(avatar_buttons.count(), 10)):
            btn = avatar_buttons.nth(i)
            box = btn.bounding_box()
            if box and box['width'] < 80 and box['height'] < 80 and box['x'] < 200:
                print(f"  Found avatar button at index {i}: {box}")
                btn.click()
                page2.wait_for_timeout(500)
                page2.screenshot(path=os.path.join(SCREENSHOT_DIR, '06-profile-avatar-clicked.png'), full_page=True)
                break

        # Focus on avatar button
        page2.goto(BASE_URL + '/profile', wait_until='networkidle', timeout=10000)
        page2.wait_for_timeout(2000)
        # Tab to avatar
        for _ in range(3):
            page2.keyboard.press('Tab')
        page2.wait_for_timeout(300)
        page2.screenshot(path=os.path.join(SCREENSHOT_DIR, '07-profile-avatar-focus.png'), full_page=True)

        # ===== 3. Home page - LevelNode focus =====
        print("\n=== Home Page ===")
        page3 = context.new_page()
        inject_auth(page3)
        page3.goto(BASE_URL + '/', wait_until='networkidle', timeout=10000)
        page3.wait_for_timeout(2000)
        page3.screenshot(path=os.path.join(SCREENSHOT_DIR, '08-home-default.png'), full_page=True)

        # Tab through level nodes
        for i in range(5):
            page3.keyboard.press('Tab')
            page3.wait_for_timeout(200)
        page3.screenshot(path=os.path.join(SCREENSHOT_DIR, '09-home-levelnode-focus.png'), full_page=True)

        # ===== 4. Battle page - answer button focus =====
        print("\n=== Battle Page ===")
        page4 = context.new_page()
        inject_auth(page4)
        page4.goto(BASE_URL + '/battle/level-1', wait_until='networkidle', timeout=10000)
        page4.wait_for_timeout(2000)
        page4.screenshot(path=os.path.join(SCREENSHOT_DIR, '10-battle-default.png'), full_page=True)

        # Tab through buttons
        for i in range(5):
            page4.keyboard.press('Tab')
            page4.wait_for_timeout(200)
        page4.screenshot(path=os.path.join(SCREENSHOT_DIR, '11-battle-focus.png'), full_page=True)

        # ===== 5. Leaderboard tabs focus =====
        print("\n=== Leaderboard Page ===")
        page5 = context.new_page()
        inject_auth(page5)
        page5.goto(BASE_URL + '/leaderboard', wait_until='networkidle', timeout=10000)
        page5.wait_for_timeout(2000)
        page5.screenshot(path=os.path.join(SCREENSHOT_DIR, '12-leaderboard-default.png'), full_page=True)

        # Tab through tabs
        for i in range(8):
            page5.keyboard.press('Tab')
            page5.wait_for_timeout(200)
        page5.screenshot(path=os.path.join(SCREENSHOT_DIR, '13-leaderboard-focus.png'), full_page=True)

        # ===== 6. Mistakes page - expandable cards =====
        print("\n=== Mistakes Page ===")
        page6 = context.new_page()
        inject_auth(page6)
        page6.goto(BASE_URL + '/mistakes', wait_until='networkidle', timeout=10000)
        page6.wait_for_timeout(2000)
        page6.screenshot(path=os.path.join(SCREENSHOT_DIR, '14-mistakes-default.png'), full_page=True)

        # ===== 7. DailyGoals page =====
        print("\n=== DailyGoals Page ===")
        page7 = context.new_page()
        inject_auth(page7)
        page7.goto(BASE_URL + '/daily-goals', wait_until='networkidle', timeout=10000)
        page7.wait_for_timeout(2000)
        page7.screenshot(path=os.path.join(SCREENSHOT_DIR, '15-dailygoals-default.png'), full_page=True)

        # Tab through buttons
        for i in range(5):
            page7.keyboard.press('Tab')
            page7.wait_for_timeout(200)
        page7.screenshot(path=os.path.join(SCREENSHOT_DIR, '16-dailygoals-focus.png'), full_page=True)

        # ===== 8. Extract interactive element info =====
        print("\n=== Extracting Interactive Element Info ===")
        pages_to_check = [
            ('login', BASE_URL + '/login', False),
            ('profile', BASE_URL + '/profile', True),
            ('home', BASE_URL + '/', True),
        ]

        for page_name, url, needs_auth in pages_to_check:
            pg = context.new_page()
            if needs_auth:
                inject_auth(pg)
            pg.goto(url, wait_until='networkidle', timeout=10000)
            pg.wait_for_timeout(1500)

            # Get all interactive elements and their computed styles
            elements_info = pg.evaluate("""() => {
                const interactives = document.querySelectorAll('button, a, input, select, textarea, [role="button"], [tabindex]');
                const results = [];
                interactives.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    if (rect.width === 0 || rect.height === 0) return;
                    const style = window.getComputedStyle(el);
                    const tag = el.tagName.toLowerCase();
                    const text = (el.textContent || '').trim().substring(0, 30);
                    const classes = el.className?.substring?.(0, 100) || '';
                    const hasOutline = style.outline !== 'none' && style.outlineWidth !== '0px';
                    const hasFocusVisible = el.matches(':focus-visible');
                    const hasRing = style.boxShadow?.includes('var(--ring)') || false;
                    const hasHover = style.cursor === 'pointer';
                    const tabindex = el.getAttribute('tabindex');

                    results.push({
                        tag, text, classes,
                        rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
                        hasOutline,
                        hasFocusVisible,
                        hasHover,
                        tabindex,
                        outlineStyle: style.outlineStyle,
                        outlineWidth: style.outlineWidth,
                        boxShadow: style.boxShadow?.substring(0, 80) || '',
                    });
                });
                return results;
            }""")

            print(f"\n  {page_name} page: {len(elements_info)} interactive elements")
            for el in elements_info:
                if not el['hasOutline'] and el['tag'] == 'button':
                    print(f"    MISSING OUTLINE: <{el['tag']}> \"{el['text']}\" at ({el['rect']['x']},{el['rect']['y']}) classes={el['classes'][:60]}")
            pg.close()

        browser.close()
        print(f"\nAll screenshots saved to {SCREENSHOT_DIR}")

if __name__ == '__main__':
    main()
