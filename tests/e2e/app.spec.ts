import { expect, test } from '@playwright/test'

test('loads the app and shows its title', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('Mythras Character Generator')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mythras Character Generator')
})
