import { test, expect } from '@playwright/test'

test.describe('Landing page', () => {
  test('renders the hero section', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/rough idea/i)
    const cta = page.getByRole('link', { name: /start exploring/i })
    await expect(cta).toBeVisible()
  })

  test('navigates to explore page from CTA', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /start exploring/i }).click()
    await expect(page).toHaveURL('/explore')
  })
})
