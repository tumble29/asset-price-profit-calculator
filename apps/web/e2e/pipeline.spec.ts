import { expect, test } from '@playwright/test'

/**
 * Guards the one thing 0.1 exists to prove: that a component styled entirely
 * through `@apply` in a co-located `*.module.scss` actually arrives in the
 * browser with its styles applied.
 *
 * It asserts computed style rather than the presence of a class, because a
 * CSS-module class name renders even when the stylesheet failed to compile —
 * and a wrong `@reference` shows up exactly there: the class is present, the
 * declarations are not.
 */
test('the styled component renders with its module styles applied', async ({ page }) => {
  await page.goto('/')

  const section = page.locator('section')
  await expect(section).toBeVisible()

  // A hashed CSS-module class, not a raw utility string.
  const className = await section.getAttribute('class')
  expect(className).toBeTruthy()
  expect(className).not.toMatch(/\bflex\b/)

  // `display: flex` comes from `@apply flex flex-col`.
  await expect(section).toHaveCSS('display', 'flex')
  await expect(section).toHaveCSS('flex-direction', 'column')

  // Assert the TOKEN reached :root, not merely that the computed value is 24px.
  // `@apply gap-gutter` compiles to `gap: var(--spacing-gutter, 1.5rem)` with the
  // fallback baked into the module chunk, so the computed value is 24px even when
  // globals.css never loaded and the variable is empty. A wrong `@reference`
  // fails `next build` outright; this is what catches the token going missing.
  const token = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--spacing-gutter').trim(),
  )
  expect(token).toBe('1.5rem')

  await expect(section).toHaveCSS('gap', '24px')
  await expect(section).toHaveCSS('padding', '24px')
})

test('the heading comes from the message catalogue', async ({ page }) => {
  await page.goto('/')
  // Vietnamese is the default locale, per #1.
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kiểm tra quy trình dựng')
})
