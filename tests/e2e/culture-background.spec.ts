import { expect, test } from '@playwright/test'
import { anathaymBackground, anathaymCulture, CULTURE_TOTALS, firstThreeSteps } from './anathaym.ts'

test("recreates Anathaym's culture step", async ({ page }) => {
  await firstThreeSteps(page)
  await anathaymCulture(page)
  await expect(page.getByText('This step is complete.')).toBeVisible()
  await expect(page.getByText('Culture points left: 0').first()).toBeVisible()

  const table = page.getByRole('table', { name: 'Culture skill points' })
  for (const [skill, total] of Object.entries(CULTURE_TOTALS)) {
    await expect(table.getByRole('row').filter({ hasText: skill }).getByRole('cell').last()).toHaveText(String(total))
  }
  await expect(page.getByText('Customs 68%, Native Tongue 63%')).toBeVisible()
})

test('completes the Background step', async ({ page }) => {
  await firstThreeSteps(page)
  await anathaymCulture(page)
  // Aristocracy on 97 and 9 on 4d6 give her 3375 SP (p. 21).
  await anathaymBackground(page)
  await expect(page.getByText(': 3375 SP')).toBeVisible()
  await expect(page.getByText('This step is complete.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Next: Career' })).toBeEnabled()

  // A sound reputation with a few secrets gives one Enemy or Rival.
  await page.getByRole('group', { name: 'Reputation' }).getByLabel('Result').selectOption('16')
  await page.getByRole('button', { name: 'Roll from reputation and connections' }).click()
  await page.getByLabel('Person 1 name').fill('Xenos')
  await expect(page.getByLabel('Person 2 name')).toHaveCount(0)
})
