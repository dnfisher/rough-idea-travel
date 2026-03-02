import { test, expect } from '@playwright/test'

test.describe('Auth', () => {
  test('navigating to /auth/signin renders OAuth options', async ({ page }) => {
    await page.goto('/auth/signin')
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible()
  })
})
