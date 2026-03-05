import { test, expect } from '@playwright/test'

test.describe('Landing page', () => {
  test('renders the hero section', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/rough idea/i)
    const cta = page.getByRole('link', { name: /start exploring/i }).first()
    await expect(cta).toBeVisible()
  })

  test('navigates to explore page from CTA', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /start exploring/i }).first().click()
    await expect(page).toHaveURL('/explore')
  })

  test('hero headline is present', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Your next trip,')).toBeVisible()
    await expect(page.getByText('planned in three questions.')).toBeVisible()
  })

  test('nav becomes scrolled after scrolling past 80px', async ({ page }) => {
    await page.goto('/')
    const nav = page.locator('nav.homepage-nav')
    await expect(nav).not.toHaveClass(/scrolled/)
    await page.evaluate(() => window.scrollTo(0, 200))
    await expect(nav).toHaveClass(/scrolled/)
  })
})
