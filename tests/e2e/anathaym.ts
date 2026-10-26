import { type Page } from '@playwright/test'

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
export const CULTURE_TOTALS = {
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

export async function firstThreeSteps(page: Page) {
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

export async function anathaymCulture(page: Page) {
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

export async function anathaymBackground(page: Page) {
  await page.getByRole('button', { name: 'Next: Background' }).click()
  await page.getByRole('group', { name: 'Social Class' }).getByLabel('d100').fill('97')
  await page.getByRole('group', { name: 'Starting Money' }).getByLabel('4d6').fill('9')
  await page.getByRole('button', { name: 'Roll all events' }).click()
}

// Anathaym's Warrior career, p. 27.
const CAREER_POINTS = {
  Athletics: 10,
  Endurance: 10,
  Evade: 10,
  Unarmed: 10,
  'Lore (Military History)': 10,
  'Lore (Strategy and Tactics)': 10,
  Survival: 10,
  'Combat Style (Meerish Slinger)': 15,
  'Combat Style (Meerish Infantry)': 15,
}

export async function anathaymCareer(page: Page) {
  await page.getByRole('button', { name: 'Next: Career' }).click()
  await page.getByLabel('Career', { exact: true }).selectOption('warrior')
  await page.getByLabel('Professional skill 1').selectOption('Lore (Military History)')
  await page.getByLabel('Professional skill 2').selectOption('Lore (Strategy and Tactics)')
  await page.getByLabel('Professional skill 3').selectOption('Survival')
  const speciality = page.getByRole('group', { name: 'Speciality Style' })
  await speciality.getByLabel('Combat Style name').selectOption('Custom name')
  await speciality.getByLabel('Custom name').fill('Meerish Infantry')
  await speciality.getByLabel('Weapons').fill('Spear, hoplite shield, javelin')
  await speciality.getByLabel('Trait').selectOption('Formation Fighting')
  for (const [skill, points] of Object.entries(CAREER_POINTS)) await page.getByLabel(`${skill} points`).fill(String(points))
}

/** 150 Adult bonus points, 15 on each of ten skills. */
export async function anathaymBonus(page: Page) {
  await page.getByRole('button', { name: 'Next: Bonus Skills' }).click()
  const skills = ['Athletics', 'Brawn', 'Endurance', 'Evade', 'Perception', 'Stealth', 'Willpower', 'Insight', 'Influence', 'Locale']
  for (const skill of skills) await page.getByLabel(`${skill} points`).fill('15')
}
