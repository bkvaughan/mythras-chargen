import { expect, test, type Page } from '@playwright/test'

// Anathaym, the core rules' worked example: characteristics p. 11, culture p. 17.
const CHARACTERISTICS = {
  'Strength (STR)': 11,
  'Constitution (CON)': 13,
  'Size (SIZ)': 10,
  'Dexterity (DEX)': 16,
  'Intelligence (INT)': 14,
  'Power (POW)': 7,
  'Charisma (CHA)': 9,
}

const CULTURE_POINTS = {
  Conceal: 5,
  Deceit: 5,
  Drive: 5,
  Influence: 10,
  Insight: 10,
  Locale: 5,
  Willpower: 10,
  Courtesy: 15,
  'Lore (Geography)': 10,
  Streetwise: 15,
  'Combat Style (Meerish Slinger)': 10,
}

// Totals as printed after her culture step.
const CULTURE_TOTALS = {
  Conceal: 28,
  Deceit: 28,
  Drive: 28,
  Influence: 28,
  Insight: 31,
  Locale: 33,
  Willpower: 24,
  Courtesy: 38,
  'Lore (Geography)': 38,
  Streetwise: 31,
  'Combat Style (Meerish Slinger)': 37,
}

async function firstThreeSteps(page: Page) {
  await page.goto('/')
  await page.getByLabel('Character name').fill('Anathaym')
  await page.getByLabel('Age', { exact: true }).fill('20')
  await page.getByLabel(/Dice roll, in order/).check()
  await page.getByRole('button', { name: 'Next: Characteristics' }).click()
  await page.getByRole('button', { name: 'Enter my own rolls' }).click()
  for (const [label, value] of Object.entries(CHARACTERISTICS)) await page.getByLabel(label).fill(String(value))
  await page.getByRole('button', { name: 'Next: Attributes' }).click()
  await page.getByLabel(/Lithe/).check()
  await page.getByRole('button', { name: 'Roll height and weight' }).click()
  await page.getByRole('button', { name: 'Next: Culture' }).click()
}

async function anathaymCulture(page: Page) {
  await page.getByLabel(/^Civilised/).check()
  await page.getByLabel('Professional skill 1').selectOption('Courtesy')
  await page.getByLabel('Professional skill 2').selectOption('Lore')
  await page.getByLabel('Specialisation 2').fill('Geography')
  await page.getByLabel('Professional skill 3').selectOption('Streetwise')
  await page.getByLabel('Take a cultural Combat Style').check()
  await page.getByLabel('Combat Style name').selectOption('Custom name')
  await page.getByLabel('Custom name').fill('Meerish Slinger')
  await page.getByLabel('Weapons').fill('Sling, shortsword, peltast shield')
  await page.getByLabel('Trait').selectOption('Skirmishing')
  for (const [skill, points] of Object.entries(CULTURE_POINTS)) await page.getByLabel(`${skill} points`).fill(String(points))
  await page.getByLabel('Native Tongue').fill('Meerish')
  const passions = [
    ['Loyalty', 'Meeros', 'place'],
    ['Love', 'Kara', 'romantic'],
    ['Hate', 'Xenos', 'averse'],
  ]
  for (const [verb, subject, type] of passions) {
    await page.getByLabel(`${verb} subject`, { exact: true }).fill(subject)
    await page.getByLabel(`${verb} type`).selectOption(type)
  }
}

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
  await page.getByRole('button', { name: 'Next: Background' }).click()

  // Aristocracy on 97 and 9 on 4d6 give her 3375 SP (p. 21).
  await page.getByRole('group', { name: 'Social Class' }).getByLabel('d100').fill('97')
  await page.getByRole('group', { name: 'Starting Money' }).getByLabel('4d6').fill('9')
  await expect(page.getByText(': 3375 SP')).toBeVisible()
  await page.getByRole('button', { name: 'Roll all events' }).click()
  await expect(page.getByText('This step is complete.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Next: Career' })).toBeEnabled()

  // A sound reputation with a few secrets gives one Enemy or Rival.
  await page.getByRole('group', { name: 'Reputation' }).getByLabel('Result').selectOption('16')
  await page.getByRole('button', { name: 'Roll from reputation and connections' }).click()
  await page.getByLabel('Person 1 name').fill('Xenos')
  await expect(page.getByLabel('Person 2 name')).toHaveCount(0)
})
