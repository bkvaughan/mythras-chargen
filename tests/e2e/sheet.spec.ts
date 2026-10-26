import { expect, test, type Page } from '@playwright/test'
import { anathaymBackground, anathaymBonus, anathaymCareer, anathaymCulture, firstThreeSteps } from './anathaym.ts'

async function completeAnathaym(page: Page) {
  await firstThreeSteps(page)
  await anathaymCulture(page)
  await anathaymBackground(page)
  await anathaymCareer(page)
  await anathaymBonus(page)
  await page.getByRole('button', { name: 'Next: Character Sheet' }).click()
}

const percent = (page: Page, table: string, skill: string) =>
  page.getByRole('table', { name: table }).getByRole('row').filter({ hasText: skill }).getByRole('cell').last()

test('completes a character and shows the key values on the sheet', async ({ page }) => {
  await completeAnathaym(page)
  await expect(page.getByRole('heading', { name: 'Character Sheet' })).toBeVisible()
  const sheetText = page.locator('.sheet')
  await expect(sheetText).toContainText('Anathaym')
  await expect(sheetText).toContainText('Human, Civilised')
  await expect(sheetText).toContainText('Starting money: 3375 SP')
  await expect(percent(page, 'Standard Skills', 'Athletics')).toHaveText('52')
  await expect(percent(page, 'Professional Skills', 'Courtesy')).toHaveText('38')
  await expect(percent(page, 'Languages', 'Native Tongue (Meerish)')).toHaveText('63')
  await expect(percent(page, 'Combat Styles', 'Meerish Infantry')).toHaveText('42')
  await expect(percent(page, 'Passions', 'Love (Kara)')).toHaveText('46')
})

test('prints as two pages on US Letter and A4', async ({ page }) => {
  await completeAnathaym(page)
  for (const format of ['Letter', 'A4'] as const) {
    const pdf = await page.pdf({ format })
    // Each page of a PDF has one /Type /Page object.
    expect(pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g), format).toHaveLength(2)
  }
})

test('export, then import into a new character, gives the same sheet', async ({ page }) => {
  await completeAnathaym(page)
  const before = await page.locator('.sheet').innerText()

  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export' }).click()])
  expect(download.suggestedFilename()).toBe('Anathaym.json')
  const file = await download.path()

  page.once('dialog', (d) => d.accept())
  await page.getByRole('button', { name: 'New character' }).click()
  await expect(page.getByLabel('Character name')).toHaveValue('')

  await page.getByLabel('Import').setInputFiles(file)
  await page.getByRole('navigation').getByRole('button', { name: /Character Sheet/ }).click()
  expect(await page.locator('.sheet').innerText()).toBe(before)
})
