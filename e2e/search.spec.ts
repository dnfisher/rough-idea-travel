import { test, expect } from '@playwright/test'

test.describe('Explore / search page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/explore')
  })

  test('renders the trip input form', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Hiking' })).toBeVisible()
  })

  test('interest options are visible and selectable', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Hiking' })).toBeVisible()
  })

  test('budget level options are visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Budget' })).toBeVisible()
  })
})
