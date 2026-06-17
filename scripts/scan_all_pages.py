import os
from playwright.sync_api import sync_playwright

SCREENSHOT_DIR = '/workspace/public/scan-screenshots'
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

BASE_URL = 'http://localhost:5173'

# Pages that don't require authentication
PUBLIC_PAGES = [
    ('login', '/login'),
    ('agreement', '/agreement'),
    ('admin-login', '/admin/login'),
]

# Pages that require authentication - we'll inject Zustand state
AUTH_PAGES = [
    ('home', '/'),
    ('onboarding', '/onboarding'),
    ('assessment', '/assessment'),
    ('assessment-result', '/assessment-result'),
    ('mistakes', '/mistakes'),
    ('leaderboard', '/leaderboard'),
    ('profile', '/profile'),
    ('daily-goals', '/daily-goals'),
    ('stats', '/stats'),
    ('layout-preview', '/layout-preview'),
]

def inject_auth_state(page):
    """Inject Zustand state to simulate a logged-in user who completed onboarding."""
    # Navigate to the login page first so localStorage is accessible
    page.goto(BASE_URL + '/login', wait_until='domcontentloaded', timeout=10000)
    page.wait_for_timeout(500)

    page.evaluate("""() => {
        // Set token
        localStorage.setItem('mathquest_token', 'test-fake-token');

        // Set Zustand persisted state
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

    # Reload the page so Zustand picks up the new state during hydration
    page.reload(wait_until='networkidle', timeout=10000)
    page.wait_for_timeout(1000)

def take_screenshot(page, name, path, full_page=True):
    """Navigate to a page and take a screenshot."""
    url = BASE_URL + path
    print(f"Navigating to {url}...")
    try:
        page.goto(url, wait_until='networkidle', timeout=10000)
    except Exception as e:
        print(f"  Warning: networkidle timeout for {name}, continuing... {e}")
        page.wait_for_timeout(2000)

    # Wait a bit more for animations
    page.wait_for_timeout(1000)

    screenshot_path = os.path.join(SCREENSHOT_DIR, f'{name}.png')
    page.screenshot(path=screenshot_path, full_page=full_page)
    print(f"  Screenshot saved: {screenshot_path}")
    return screenshot_path

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 390, 'height': 844},  # iPhone 14 size
            device_scale_factor=2,
        )

        # --- Public pages ---
        print("\n=== Scanning Public Pages ===")
        page = context.new_page()
        for name, path in PUBLIC_PAGES:
            take_screenshot(page, name, path)
        page.close()

        # --- Auth pages ---
        print("\n=== Scanning Auth Pages ===")
        page = context.new_page()
        inject_auth_state(page)

        for name, path in AUTH_PAGES:
            take_screenshot(page, name, path)

        page.close()

        # --- Battle page (needs a levelId) ---
        print("\n=== Scanning Battle Page ===")
        page = context.new_page()
        inject_auth_state(page)
        take_screenshot(page, 'battle', '/battle/level-1')
        page.close()

        # --- Result page (needs a sessionId) ---
        print("\n=== Scanning Result Page ===")
        page = context.new_page()
        inject_auth_state(page)
        take_screenshot(page, 'result', '/result/session-1')
        page.close()

        # --- Verify Code page ---
        print("\n=== Scanning Verify Code Page ===")
        page = context.new_page()
        # First go to login, then navigate to verify-code
        page.goto(BASE_URL + '/login', wait_until='networkidle', timeout=10000)
        take_screenshot(page, 'verify-code', '/verify-code')
        page.close()

        browser.close()
        print(f"\nAll screenshots saved to {SCREENSHOT_DIR}")

if __name__ == '__main__':
    main()
