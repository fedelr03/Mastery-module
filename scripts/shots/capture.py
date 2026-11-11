"""Takes the landing-page screenshots from the real app, signed in as the example account in fixtures.js.

    npx vite --config scripts/shots/vite.config.js      # in one terminal
    python3 scripts/shots/capture.py                     # in another (needs: pip install playwright pillow)

Writes public/screens/<name>-<light|dark>.webp
"""
import asyncio
import io
import os
import sys

from PIL import Image
from playwright.async_api import async_playwright

BASE = os.environ.get('SHOTS_URL', 'http://localhost:5199/')
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'screens')
CHROME = os.environ.get('CHROME_PATH')  # optional: use an installed Chrome
W, SCALE = 1180, 2
# Same text as REVIEW_QA.userAnswer in fixtures.js
USER_ANSWER = 'Si el banco me paga 30% y los precios suben 25%, en realidad gano bastante menos que 30%, como un 5%.'


def save(png, name, theme, width=1400):
    img = Image.open(io.BytesIO(png)).convert('RGB')
    if img.width > width:
        img = img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, f'{name}-{theme}.webp')
    img.save(path, 'WEBP', quality=82, method=6)
    print('saved', os.path.relpath(path), img.size)


async def clip(page, top_sel, bottom_sel=None, pad=20, max_h=None):
    """Screenshot from the top of one element to the bottom of another, full app width."""
    box = 'el => { const r = el.getBoundingClientRect(); return { x: r.x + scrollX, y: r.y + scrollY, width: r.width, height: r.height }; }'
    a = await page.locator(top_sel).first.evaluate(box)
    b = await page.locator(bottom_sel or top_sel).first.evaluate(box)
    y0 = max(0, a['y'] - pad)
    y1 = b['y'] + b['height'] + pad
    if max_h:
        y1 = min(y1, y0 + max_h)
    x0 = max(0, min(a['x'], b['x']) - pad)
    x1 = max(a['x'] + a['width'], b['x'] + b['width']) + pad
    return await page.screenshot(clip={'x': x0, 'y': y0, 'width': x1 - x0, 'height': y1 - y0}, full_page=True)


async def shoot(browser, theme):
    page = await browser.new_page(viewport={'width': W, 'height': 900}, device_scale_factor=SCALE)
    page.on('pageerror', lambda e: print('pageerror:', e, file=sys.stderr))
    await page.goto(BASE + '?theme=' + theme, wait_until='networkidle')
    await page.wait_for_timeout(700)
    hide_anim = "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}.topbar,.sectabs-wrap{position:static!important}"
    await page.add_style_tag(content=hide_anim)

    # 1. Study home
    await page.locator('.ask input[type=text]').first.fill('Elasticidad precio de la demanda')
    save(await clip(page, '.mm-home', '.mm-home', pad=0, max_h=760), 'home', theme)

    # 2. A finished explanation (opened from "recent")
    await page.locator('.recent-item', has_text='Derivadas').first.click()
    await page.wait_for_selector('.mm-results')
    await page.wait_for_timeout(400)
    save(await clip(page, '.res-tags', '.sec', pad=24, max_h=900), 'explain', theme)
    # Same screen at a narrower width for the landing hero, so the text reads at a glance
    await page.set_viewport_size({'width': 800, 'height': 900})
    await page.wait_for_timeout(300)
    save(await clip(page, '.res-tags', '.sec', pad=22, max_h=820), 'hero', theme, width=1200)
    await page.set_viewport_size({'width': W, 'height': 900})
    await page.wait_for_timeout(300)

    # 3. Quiz, answered and corrected
    await page.get_by_role('tab', name='Quiz').click()
    await page.wait_for_timeout(200)
    qs = page.locator('.q')
    await qs.nth(0).get_by_role('radio', name='La pendiente de la recta tangente').click()
    await qs.nth(1).get_by_role('radio', name='6', exact=False).first.click()
    await qs.nth(2).get_by_role('radio').nth(1).click()
    await page.locator('.sec-actions .btn-sub').click()
    await page.wait_for_timeout(300)
    save(await clip(page, '.sec-head', '.q >> nth=1', pad=24), 'quiz', theme)

    # 4. Review card with the model answer
    await page.get_by_role('button', name='Repasar').first.click()
    await page.wait_for_selector('.rv textarea')
    await page.locator('.rv textarea').fill(USER_ANSWER)
    await page.get_by_role('button', name='Ver respuesta').click()
    await page.wait_for_timeout(400)
    save(await clip(page, '.rv-top', '.rv-card', pad=24), 'review', theme)

    # 5. Knowledge map, with a topic highlighted
    await page.get_by_role('button', name='Mapa').first.click()
    await page.wait_for_selector('.cm-topic')
    await page.wait_for_timeout(300)
    await page.locator('.cm-topic', has_text='Derivadas').last.hover()
    await page.wait_for_timeout(250)
    save(await clip(page, '.cm-wrap', '.cm-info', pad=16), 'map', theme)

    await page.close()


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path=CHROME) if CHROME else await p.chromium.launch()
        for theme in ('light', 'dark'):
            await shoot(browser, theme)
        await browser.close()


asyncio.run(main())
