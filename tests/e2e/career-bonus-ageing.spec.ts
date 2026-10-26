import { expect, test } from '@playwright/test'
import { anathaymBackground, anathaymCulture, firstThreeSteps } from './anathaym.ts'

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

// Totals as printed after her career, except Unarmed 37 (Known errata).
const CAREER_TOTALS = {
  Athletics: 37,
  Brawn: 21,
  Endurance: 36,
  Evade: 42,
  Unarmed: 37,
  'Lore (Military History)': 38,
  'Lore (Strategy and Tactics)': 38,
  Survival: 30,
  'Combat Style (Meerish Slinger)': 52,
  'Combat Style (Meerish Infantry)': 42,
}

test("continues Anathaym through her Warrior career", async ({ page }) => {
  await firstThreeSteps(page)
  await anathaymCulture(page)
  await anathaymBackground(page)
  await page.getByRole('button', { name: 'Next: Career' }).click()

  await page.getByLabel('Career', { exact: true }).selectOption('warrior')
  await page.getByLabel('Professional skill 1').selectOption('Lore (Military History)')
  await page.getByLabel('Professional skill 2').selectOption('Lore (Strategy and Tactics)')
  await page.getByLabel('Professional skill 3').selectOption('Survival')
  await expect(page.getByRole('group', { name: 'Cultural Style' }).getByLabel(/Use the cultural style, Meerish Slinger/)).toBeChecked()
  const speciality = page.getByRole('group', { name: 'Speciality Style' })
  await speciality.getByLabel('Combat Style name').selectOption('Custom name')
  await speciality.getByLabel('Custom name').fill('Meerish Infantry')
  await speciality.getByLabel('Weapons').fill('Spear, hoplite shield, javelin')
  await speciality.getByLabel('Trait').selectOption('Formation Fighting')
  for (const [skill, points] of Object.entries(CAREER_POINTS)) await page.getByLabel(`${skill} points`).fill(String(points))

  await expect(page.getByText('This step is complete.')).toBeVisible()
  const table = page.getByRole('table', { name: 'Career skill points' })
  for (const [skill, total] of Object.entries(CAREER_TOTALS)) {
    await expect(table.getByRole('row').filter({ hasText: skill }).getByRole('cell').last()).toHaveText(String(total))
  }
  // Courtesy kept its culture total, in the full skill table.
  await page.getByText('All skills so far').click()
  await expect(page.getByRole('table', { name: 'All skills' }).getByRole('row', { name: /^Courtesy/ }).getByRole('cell').last()).toHaveText('38')

  await page.getByRole('button', { name: 'Next: Bonus Skills' }).click()
  await expect(page.getByText('Spend 150 points for an Adult character', { exact: false })).toBeVisible()
})

test('an Old character through the Ageing step', async ({ page }) => {
  await page.goto('/')
  // Everything up to Bonus Skills is complete; Old gives 300 bonus points, at most +30 each.
  const bonusSkills = ['Athletics', 'Brawn', 'Conceal', 'Customs', 'Dance', 'Deceit', 'Drive', 'Endurance', 'Evade', 'First Aid']
  await page.evaluate(
    ({ points }) => {
      const anathaym = { STR: 11, CON: 13, SIZ: 10, DEX: 16, INT: 14, POW: 7, CHA: 9 }
      const passion = (verb: string, subject: string, object: string) => ({ verb, subject, object })
      const character = {
        schemaVersion: 1,
        concept: { name: 'Old Anathaym', player: '', gender: '', handedness: '', description: '', ageCategory: 'old', age: 75, method: 'rollInOrder' },
        characteristics: { rolled: anathaym, values: anathaym },
        attributes: { frame: 'lithe', heightCm: 163, weightKg: 48 },
        culture: {
          culture: 'civilised',
          standardChoice: [],
          professional: [{ skill: 'Courtesy' }, { skill: 'Lore', specialisation: 'Geography' }, { skill: 'Streetwise' }],
          combatStyle: null,
          points: { Conceal: 10, Deceit: 10, Drive: 5, Influence: 10, Insight: 10, Locale: 5, Willpower: 10, Courtesy: 15, 'Lore (Geography)': 10, Streetwise: 15 },
          passions: [passion('Loyalty', 'Meeros', 'place'), passion('Love', 'Kara', 'romantic'), passion('Hate', 'Xenos', 'averse')],
          nativeTongue: '',
        },
        background: {
          socialClassRoll: 50, moneyRoll: 10, events: [1, 5, 9, 13], parentsRoll: null, siblingsRoll: null, siblings: null,
          extendedFamilyRoll: null, grandparents: null, auntsAndUncles: null, cousins: null, reputationRoll: null,
          connectionsRoll: null, people: [], marriageRoll: null, children: [], passions: [],
        },
        career: {
          career: 'scholar',
          professional: [],
          styles: [],
          points: { Customs: 15, Influence: 15, Insight: 15, Locale: 15, 'Native Tongue': 15, Perception: 15, Willpower: 10 },
        },
        bonus: { hobby: null, points },
        ageing: [],
      }
      localStorage.setItem('mythras-chargen:character', JSON.stringify(character))
    },
    { points: Object.fromEntries(bonusSkills.map((s) => [s, 30])) },
  )
  await page.reload()
  await page.getByRole('navigation').getByRole('button', { name: /Bonus Skills/ }).click()
  await expect(page.getByText('This step is complete.')).toBeVisible()
  await page.getByRole('button', { name: 'Next: Ageing' }).click()

  // Age 75 has passed four bands: 40, 50, 60 and 70.
  await page.getByRole('button', { name: 'Roll Ageing' }).click()
  const rolls = page.getByRole('table', { name: 'Ageing rolls' })
  await expect(rolls.getByLabel(/ d100$/)).toHaveCount(8)
  for (const input of await rolls.getByLabel(/ d100$/).all()) await input.fill('1')
  await expect(page.getByText('This step is complete.')).toBeVisible()

  // A 99 always fails; 3 on 1d6 picks CON, which loses 2.
  await rolls.getByLabel('Early Middle Age Endurance d100').fill('99')
  await rolls.getByLabel('Early Middle Age Endurance effect').fill('3')
  await rolls.getByLabel('Early Middle Age Endurance loss').fill('2')
  await expect(rolls.getByText('Failure: -2 CON')).toBeVisible()
  const con = page.getByRole('table', { name: 'Characteristics after Ageing' }).getByRole('row', { name: /^CON/ }).getByRole('cell')
  await expect(con).toHaveText(['CON', '13', '11'])
  await expect(page.getByText('This step is complete.')).toBeVisible()
  await expect(page.getByRole('complementary', { name: 'Character summary' }).locator('dt:text-is("CON") + dd')).toHaveText('11')
})
