import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import character from './fixtures/complete-senior.json' with { type: 'json' }

// A complete Senior Anathaym, so every step including Ageing can be opened.
const VIEWS = ['Concept', 'Characteristics', 'Attributes', 'Culture', 'Background', 'Career', 'Bonus Skills', 'Ageing', 'Character Sheet']

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate((c) => localStorage.setItem('mythras-chargen:character', JSON.stringify(c)), character)
  await page.reload()
})

for (const view of VIEWS) {
  test(`${view} has no accessibility violations`, async ({ page }) => {
    await page.getByRole('navigation').getByRole('button', { name: new RegExp(`^\\d+\\. ${view}`) }).click()
    await expect(page.getByRole('heading', { level: 2 })).toHaveText(view)
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length} (${v.nodes[0].target.join(' ')})`)).toEqual([])
  })
}

test('a blank character, with every problem list showing, has no violations', async ({ page }) => {
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await page.getByLabel('Age', { exact: true }).fill('99')
  await expect(page.getByLabel('Age', { exact: true })).toHaveAttribute('aria-invalid', 'true')
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  expect(results.violations.map((v) => v.id)).toEqual([])
})

test('an incomplete Culture step has no violations', async ({ page }) => {
  await page.getByRole('navigation').getByRole('button', { name: /Culture/ }).click()
  await page.getByLabel(/^Barbarian/).check()
  await page.getByLabel('Athletics points').fill('30')
  await expect(page.getByLabel('Athletics points')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByText('To complete this step:')).toBeVisible()
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  expect(results.violations.map((v) => v.id)).toEqual([])
})

test('Next moves keyboard focus to the new step heading', async ({ page }) => {
  await page.getByRole('navigation').getByRole('button', { name: /Concept/ }).click()
  await page.getByRole('button', { name: 'Next: Characteristics' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { level: 2, name: 'Characteristics' })).toBeFocused()
})
