import os, json
from playwright.sync_api import sync_playwright

BASE_URL = 'http://localhost:5173'
OUTPUT_DIR = '/workspace/public/scan-screenshots'
os.makedirs(OUTPUT_DIR, exist_ok=True)

PAGES = [
    ('login', '/login', False),
    ('agreement', '/agreement', False),
    ('admin-login', '/admin/login', False),
    ('home', '/', True),
    ('onboarding', '/onboarding', True),
    ('assessment', '/assessment', True),
    ('assessment-result', '/assessment-result', True),
    ('mistakes', '/mistakes', True),
    ('leaderboard', '/leaderboard', True),
    ('profile', '/profile', True),
    ('daily-goals', '/daily-goals', True),
    ('stats', '/stats', True),
    ('battle', '/battle/level-1', True),
    ('result', '/result/session-1', True),
    ('verify-code', '/verify-code', False),
]

LAYOUT_ANALYSIS_JS = """() => {
    const issues = [];

    // 1. Check for overlapping text elements
    const textEls = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, label, a, button, li, td, th'));
    const visibleTextEls = textEls.filter(el => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return rect.width > 0 && rect.height > 0 &&
               style.display !== 'none' && style.visibility !== 'hidden' &&
               style.opacity !== '0';
    });

    // Check for overlapping text elements (simplified - check parent-child to avoid false positives)
    for (let i = 0; i < visibleTextEls.length; i++) {
        for (let j = i + 1; j < visibleTextEls.length; j++) {
            const a = visibleTextEls[i];
            const b = visibleTextEls[j];
            // Skip if one is ancestor of the other
            if (a.contains(b) || b.contains(a)) continue;
            const ra = a.getBoundingClientRect();
            const rb = b.getBoundingClientRect();
            // Check overlap
            const overlapX = Math.max(0, Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left));
            const overlapY = Math.max(0, Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top));
            if (overlapX > 5 && overlapY > 5) {
                const sa = window.getComputedStyle(a);
                const sb = window.getComputedStyle(b);
                // Only flag if both have visible text content
                const ta = a.textContent?.trim() || '';
                const tb = b.textContent?.trim() || '';
                if (ta.length > 0 && tb.length > 0 && ta !== tb) {
                    issues.push({
                        type: 'text_overlap',
                        element1: `<${a.tagName}> "${ta.substring(0, 40)}"`,
                        element2: `<${b.tagName}> "${tb.substring(0, 40)}"`,
                        rect1: {x: ra.x, y: ra.y, w: ra.width, h: ra.height},
                        rect2: {x: rb.x, y: rb.y, w: rb.width, h: rb.height},
                    });
                }
            }
        }
    }

    // 2. Check for text alignment issues - find elements that should be centered but aren't
    const containerEls = document.querySelectorAll('[class*="flex"], [class*="grid"], [class*="container"]');
    containerEls.forEach(el => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        const children = Array.from(el.children).filter(c => {
            const cr = c.getBoundingClientRect();
            return cr.width > 0 && cr.height > 0;
        });
        // Check if children are misaligned within a flex container
        if (style.display.includes('flex') && children.length > 1) {
            const isFlexCol = style.flexDirection === 'column';
            if (isFlexCol && style.alignItems !== 'stretch') {
                const parentCenter = rect.x + rect.width / 2;
                children.forEach(child => {
                    const cr = child.getBoundingClientRect();
                    const childCenter = cr.x + cr.width / 2;
                    if (Math.abs(parentCenter - childCenter) > 10 && cr.width < rect.width * 0.9) {
                        // Child not centered within parent
                    }
                });
            }
        }
    });

    // 3. Check for multiple progress bars on the same page
    const progressBars = document.querySelectorAll('[class*="progress"], [role="progressbar"], [class*="Progress"]');
    if (progressBars.length > 1) {
        const pbDetails = Array.from(progressBars).map(pb => {
            const r = pb.getBoundingClientRect();
            return {
                tag: pb.tagName,
                classes: pb.className?.substring?.(0, 80) || '',
                rect: {x: r.x, y: r.y, w: r.width, h: r.height},
                text: pb.textContent?.trim()?.substring(0, 40) || '',
            };
        });
        issues.push({
            type: 'multiple_progress_bars',
            count: progressBars.length,
            details: pbDetails,
        });
    }

    // 4. Check for misaligned text - elements that should be centered but aren't
    const centeredContainers = document.querySelectorAll('[class*="text-center"], [class*="items-center"], [class*="justify-center"]');
    centeredContainers.forEach(el => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const children = Array.from(el.children);
        children.forEach(child => {
            const cr = child.getBoundingClientRect();
            const cs = window.getComputedStyle(child);
            // Check if text is visually off-center
            if (cr.width > 0 && rect.width > 0) {
                const leftMargin = cr.x - rect.x;
                const rightMargin = (rect.x + rect.width) - (cr.x + cr.width);
                if (Math.abs(leftMargin - rightMargin) > 5 && cr.width < rect.width * 0.8) {
                    issues.push({
                        type: 'alignment_issue',
                        parent: `<${el.tagName}> class="${el.className?.substring?.(0, 60)}"`,
                        child: `<${child.tagName}> class="${child.className?.substring?.(0, 60)}"`,
                        leftMargin: Math.round(leftMargin),
                        rightMargin: Math.round(rightMargin),
                        diff: Math.round(Math.abs(leftMargin - rightMargin)),
                    });
                }
            }
        });
    });

    // 5. Check for elements overflowing viewport
    const allEls = document.querySelectorAll('*');
    allEls.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && (rect.right > window.innerWidth + 5 || rect.left < -5)) {
            const style = window.getComputedStyle(el);
            if (style.overflowX === 'visible' || style.overflowX === 'auto') {
                issues.push({
                    type: 'horizontal_overflow',
                    tag: el.tagName,
                    classes: el.className?.substring?.(0, 80) || '',
                    rect: {x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height)},
                    viewportWidth: window.innerWidth,
                });
            }
        }
    });

    // 6. Check for very small touch targets (buttons/links)
    const interactiveEls = document.querySelectorAll('button, a, [role="button"], input, select');
    interactiveEls.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
            issues.push({
                type: 'small_touch_target',
                tag: el.tagName,
                text: el.textContent?.trim()?.substring(0, 30) || '',
                width: Math.round(rect.width),
                height: Math.round(rect.height),
            });
        }
    });

    // 7. Check for inconsistent spacing between sibling elements
    const siblings = document.querySelectorAll('[class*="flex-col"], [class*="flex flex-col"]');
    siblings.forEach(parent => {
        const visibleChildren = Array.from(parent.children).filter(c => {
            const r = c.getBoundingClientRect();
            return r.height > 0;
        });
        if (visibleChildren.length < 3) return;
        const gaps = [];
        for (let i = 1; i < visibleChildren.length; i++) {
            const prev = visibleChildren[i-1].getBoundingClientRect();
            const curr = visibleChildren[i].getBoundingClientRect();
            gaps.push(Math.round(curr.top - prev.bottom));
        }
        const uniqueGaps = [...new Set(gaps.filter(g => g >= 0))];
        if (uniqueGaps.length > 2 && gaps.length > 3) {
            issues.push({
                type: 'inconsistent_spacing',
                parent: `<${parent.tagName}> class="${parent.className?.substring?.(0, 60)}"`,
                gaps: gaps,
            });
        }
    });

    // 8. Get page summary info
    const pageWidth = document.documentElement.scrollWidth;
    const pageHeight = document.documentElement.scrollHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    return {
        pageWidth,
        pageHeight,
        viewportWidth,
        viewportHeight,
        hasHorizontalScroll: pageWidth > viewportWidth,
        issues: issues.slice(0, 50), // Limit to prevent huge output
    };
}"""

def inject_auth_state(page):
    # Navigate to the login page first so localStorage is accessible
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

    # Reload the page so Zustand picks up the new state during hydration
    page.reload(wait_until='networkidle', timeout=10000)
    page.wait_for_timeout(1000)

def main():
    all_results = {}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 390, 'height': 844},
            device_scale_factor=2,
        )

        for name, path, needs_auth in PAGES:
            print(f"\n=== Analyzing {name} ({path}) ===")
            page = context.new_page()

            if needs_auth:
                inject_auth_state(page)

            url = BASE_URL + path
            try:
                page.goto(url, wait_until='networkidle', timeout=10000)
            except:
                page.wait_for_timeout(2000)

            page.wait_for_timeout(1500)

            try:
                result = page.evaluate(LAYOUT_ANALYSIS_JS)
                all_results[name] = result

                # Print summary
                print(f"  Page size: {result['pageWidth']}x{result['pageHeight']}")
                print(f"  Viewport: {result['viewportWidth']}x{result['viewportHeight']}")
                print(f"  Horizontal scroll: {result['hasHorizontalScroll']}")
                issue_count = len(result['issues'])
                print(f"  Issues found: {issue_count}")
                for issue in result['issues']:
                    print(f"    - {issue['type']}: {json.dumps(issue, ensure_ascii=False)[:200]}")
            except Exception as e:
                print(f"  Error analyzing: {e}")
                all_results[name] = {'error': str(e)}

            page.close()

        browser.close()

    # Save all results
    output_path = os.path.join(OUTPUT_DIR, 'layout_analysis.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, ensure_ascii=False, indent=2)
    print(f"\nResults saved to {output_path}")

if __name__ == '__main__':
    main()
