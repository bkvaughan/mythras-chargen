import { expect, test } from '@playwright/test'

test('quick-generate builds a complete character that can still be edited', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Quick-generate' }).click()
  await expect(page.getByRole('heading', { name: 'Character Sheet' })).toBeVisible()
  await expect(page.locator('.sheet')).toContainText('Starting money:')

  // Every step is done, so the character is legal.
  const nav = page.getByRole('navigation')
  const steps = nav.getByRole('button').filter({ hasNotText: 'Character Sheet' })
  for (const step of await steps.all()) await expect(step).toContainText('Done')

  // A second generate asks before replacing it.
  page.once('dialog', (d) => d.dismiss())
  const before = await page.locator('.sheet').innerText()
  await page.getByRole('button', { name: 'Quick-generate' }).click()
  expect(await page.locator('.sheet').innerText()).toBe(before)

  // It is an ordinary character: name it in Concept and the sheet follows.
  await nav.getByRole('button', { name: /Concept/ }).click()
  await page.getByLabel('Character name').fill('Generated Hero')
  await nav.getByRole('button', { name: /Character Sheet/ }).click()
  await expect(page.getByRole('region', { name: 'Character', exact: true })).toContainText('Generated Hero')
})
