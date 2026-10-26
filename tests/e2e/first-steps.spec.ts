import { expect, test, type Page } from '@playwright/test'

async function concept(page: Page, method: RegExp) {
  await page.goto('/')
  await expect(page).toHaveTitle('Mythras Character Generator')
  await page.getByLabel('Character name').fill('Anathaym')
  await page.getByRole('button', { name: 'Roll 2d6+15' }).click()
  await page.getByLabel(method).check()
  await expect(page.getByText('This step is complete.')).toBeVisible()
  await page.getByRole('button', { name: 'Next: Characteristics' }).click()
}

async function attributes(page: Page) {
  await page.getByRole('button', { name: 'Next: Attributes' }).click()
  await page.getByLabel(/Medium/).check()
  await page.getByRole('button', { name: 'Roll height and weight' }).click()
  await expect(page.getByText('This step is complete.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Next: Culture' })).toBeEnabled()
}

test('dice roll, in order', async ({ page }) => {
  await concept(page, /Dice roll, in order/)
  await page.getByRole('button', { name: 'Roll characteristics' }).click()
  await expect(page.getByText('This step is complete.')).toBeVisible()
  await attributes(page)
})

test('dice roll, assign', async ({ page }) => {
  await concept(page, /Dice roll, assign/)
  await page.getByRole('button', { name: 'Roll characteristics' }).click()
  await page.getByLabel('Swap STR with').selectOption('CHA')
  await expect(page.getByText('This step is complete.')).toBeVisible()
  await attributes(page)
})

test('points build, with the summary matching a hand calculation', async ({ page }) => {
  await concept(page, /Points build/)
  const values = { 'Strength (STR)': 11, 'Constitution (CON)': 13, 'Size (SIZ)': 10, 'Dexterity (DEX)': 16, 'Intelligence (INT)': 14, 'Power (POW)': 7 }
  for (const [label, value] of Object.entries(values)) await page.getByLabel(label).fill(String(value))
  await expect(page.getByText('Points remaining: 1')).toBeVisible()
  await page.getByLabel('Charisma (CHA)').fill('4')
  await expect(page.getByText('This step is complete.')).toBeVisible()
  await attributes(page)

  // Anathaym's attributes (p. 11), except CHA 4 gives Experience Modifier -1.
  const summary = page.getByRole('complementary', { name: 'Character summary' })
  await expect(summary.getByRole('heading')).toHaveText('Anathaym')
  await expect(summary.locator('dt:text-is("Initiative Bonus") + dd')).toHaveText('15')
  await expect(summary.locator('dt:text-is("Action Points") + dd')).toHaveText('3')
  await expect(page.getByRole('table', { name: 'Hit Points' }).getByRole('row', { name: /Chest/ })).toContainText('7')
})

test('the character in progress survives a reload', async ({ page }) => {
  await concept(page, /Points build/)
  await page.reload()
  await expect(page.getByLabel('Character name')).toHaveValue('Anathaym')
})
