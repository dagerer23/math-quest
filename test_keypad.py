from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    page.goto('http://localhost:5173/')
    page.wait_for_load_state('networkidle')
    page.screenshot(path='/tmp/mathquest_home.png', full_page=True)
    print('home screenshot saved to /tmp/mathquest_home.png')

    # Enter guest mode
    page.get_by_text('游客模式体验').click()
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1000)
    page.screenshot(path='/tmp/mathquest_home2.png', full_page=True)
    print('home2 screenshot saved to /tmp/mathquest_home2.png')

    # Select grade phase
    page.get_by_text('小学').first.click()
    page.wait_for_timeout(300)
    page.get_by_text('下一步').click()
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1000)
    page.screenshot(path='/tmp/mathquest_home3.png', full_page=True)
    print('home3 screenshot saved to /tmp/mathquest_home3.png')

    # Select learning goal and proceed
    page.get_by_text('巩固基础').click()
    page.wait_for_timeout(300)
    page.get_by_text('下一步').click()
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1000)
    page.screenshot(path='/tmp/mathquest_home4.png', full_page=True)
    print('home4 screenshot saved to /tmp/mathquest_home4.png')

    # Select grade 1 and proceed
    page.get_by_text('1年级').click()
    page.wait_for_timeout(300)
    page.get_by_text('下一步').click()
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1500)
    page.screenshot(path='/tmp/mathquest_home5.png', full_page=True)
    print('home5 screenshot saved to /tmp/mathquest_home5.png')

    # Set nickname and start
    page.locator('input').fill('测试用户')
    page.get_by_text('开始测评').click()
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1500)
    page.screenshot(path='/tmp/mathquest_home6.png', full_page=True)
    print('home6 screenshot saved to /tmp/mathquest_home6.png')

    # Skip assessment by navigating home
    page.goto('http://localhost:5173/')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1500)
    page.screenshot(path='/tmp/mathquest_home_map.png', full_page=True)
    print('home map screenshot saved')

    # Unlock all grade 1 levels via localStorage
    user_json = page.evaluate("""
        () => {
            const raw = localStorage.getItem('mathquest.user.v1');
            if (!raw) return null;
            const data = JSON.parse(raw);
            const levels = ['g1-L1','g1-L2','g1-L3','g1-L4','g1-L5','g1-L6','g1-L7','g1-L8','g1-L9','g1-L10',
                            'g1-L11','g1-L12','g1-L13','g1-L14','g1-L15','g1-L16','g1-L17','g1-L18','g1-L19','g1-L20',
                            'g1-L21','g1-L22','g1-L23','g1-L24','g1-L25','g1-BOSS'];
            data.state.unlockedLevels = levels;
            data.state.grade = 1;
            localStorage.setItem('mathquest.user.v1', JSON.stringify(data));
            return levels;
        }
    """)
    print('unlocked levels:', user_json)
    page.reload()
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(1500)
    page.screenshot(path='/tmp/mathquest_home_map2.png', full_page=True)
    print('home map2 screenshot saved')

    # Find and click the third level node by aria-label
    all_btns = page.locator('button').all()
    print(f'found {len(all_btns)} buttons on home')
    for i, btn in enumerate(all_btns[:30]):
        try:
            txt = btn.inner_text().strip()[:30]
            print(f'  button {i}: {txt}')
        except Exception:
            pass

    # Try clicking the third level node (more likely to have input questions)
    clicked = False
    target = '第3关'
    for btn in all_btns:
        try:
            if btn.is_visible() and btn.is_enabled():
                label = btn.get_attribute('aria-label') or ''
                if target in label:
                    btn.click()
                    clicked = True
                    break
        except Exception:
            continue

    if not clicked:
        for btn in all_btns:
            try:
                if btn.is_visible() and btn.is_enabled():
                    label = btn.get_attribute('aria-label') or ''
                    if '第' in label and '关' in label:
                        btn.click()
                        clicked = True
                        break
            except Exception:
                continue

    page.wait_for_timeout(2500)
    page.screenshot(path='/tmp/mathquest_battle.png', full_page=True)
    print('battle screenshot saved to /tmp/mathquest_battle.png')

    # Try to reach an input-type question and test keypad
    for attempt in range(12):
        keypad_btns = page.locator('button').all()
        texts = []
        for btn in keypad_btns:
            try:
                texts.append(btn.inner_text().strip())
            except Exception:
                pass
        print(f'attempt {attempt}: found {len(keypad_btns)} buttons, texts={texts[:20]}')

        # If we see a full keypad (digits 4-9 present), it's an input question
        has_keypad = all(d in texts for d in ['4', '5', '6', '7', '8', '9'])
        if has_keypad:
            page.screenshot(path='/tmp/mathquest_keypad.png', full_page=True)
            print('keypad found! screenshot saved')
            # Test keypad click: click '1'
            for btn in keypad_btns:
                if btn.inner_text().strip() == '1':
                    btn.click()
                    break
            page.wait_for_timeout(300)
            page.screenshot(path='/tmp/mathquest_keypad_click.png', full_page=True)
            print('keypad click screenshot saved')

            # Test physical keyboard: clear and type '2' then submit with Enter
            page.keyboard.press('Backspace')
            page.wait_for_timeout(200)
            page.keyboard.type('2')
            page.wait_for_timeout(200)
            page.keyboard.press('Enter')
            page.wait_for_timeout(500)
            page.screenshot(path='/tmp/mathquest_keypad_keyboard.png', full_page=True)
            print('keypad physical keyboard test screenshot saved')
            break

        # Otherwise it's a choice question: pick first option and submit
        # Options are buttons with single-digit text, excluding header/status buttons
        option_btns = []
        for b in keypad_btns:
            txt = b.inner_text().strip()
            if txt in ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] and b.is_visible():
                # skip if it looks like a status metric (has surrounding UI)
                option_btns.append(b)
        submit_btn = None
        for b in keypad_btns:
            if '确认' in b.inner_text():
                submit_btn = b
                break
        if option_btns and submit_btn:
            option_btns[0].click()
            page.wait_for_timeout(600)
            # Re-fetch submit button after selection enables it
            for b in page.locator('button').all():
                if '确认' in b.inner_text() and b.is_enabled():
                    b.click()
                    break
            # Wait for feedback + next question transition
            page.wait_for_timeout(1600)
        else:
            print('could not find option/submit buttons')
            page.screenshot(path=f'/tmp/mathquest_battle_attempt{attempt}.png', full_page=True)
            break

    browser.close()
