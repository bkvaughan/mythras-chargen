import { expect, test, type Locator, type Page } from '@playwright/test'

// Every step for every culture, through the UI to the character sheet. One run is keyboard
// only: Tab to reach each control, then typing, Space, Enter and arrow keys, never a click.

type Mode = 'mouse' | 'keyboard'

class Driver {
  readonly page: Page
  readonly mode: Mode
  /** Keys pressed, to show a keyboard run really used the keyboard. */
  keys = 0

  constructor(page: Page, mode: Mode) {
    this.page = page
    this.mode = mode
  }

  /** Presses Tab until the target has focus, proving it is in the tab order. */
  private async tabTo(target: Locator) {
    for (let i = 0; i < 400; i++) {
      if (await target.evaluate((el) => el === el.ownerDocument.activeElement)) return
      this.keys++
      await this.page.keyboard.press('Tab')
    }
    throw new Error(`Could not reach ${target} with Tab`)
  }

  async press(button: Locator) {
    if (this.mode === 'mouse') return button.click()
    await this.tabTo(button)
    this.keys++
    await this.page.keyboard.press('Enter')
  }

  async fill(input: Locator, value: string) {
    if (this.mode === 'mouse') return input.fill(value)
    await this.tabTo(input)
    this.keys++
    await this.page.keyboard.press('ControlOrMeta+a')
    this.keys++
    await this.page.keyboard.type(value)
  }

  async check(box: Locator) {
    if (this.mode === 'mouse') return box.check()
    await this.tabTo(box)
    this.keys++
    await this.page.keyboard.press('Space')
  }

  /** A radio group takes one Tab stop; the arrow keys move the choice within it. */
  async choose(radio: Locator) {
    if (this.mode === 'mouse') return radio.check()
    const name = await radio.getAttribute('name')
    const group = this.page.locator(`input[type=radio][name="${name}"]`)
    for (let i = 0; i < 400; i++) {
      if (await group.evaluateAll((els) => els.some((el) => el === el.ownerDocument.activeElement))) break
      this.keys++
      await this.page.keyboard.press('Tab')
    }
    for (let i = 0; i < 30 && !(await radio.isChecked()); i++) {
      this.keys++
      await this.page.keyboard.press('ArrowDown')
    }
    await expect(radio).toBeChecked()
  }

  async select(select: Locator, label: string) {
    if (this.mode === 'mouse') return select.selectOption({ label })
    // Typing an option's name selects it, as in any browser's closed dropdown.
    await this.tabTo(select)
    this.keys++
    await this.page.keyboard.type(label)
    const option = select.locator('option').filter({ hasText: label }).first()
    await expect(select).toHaveValue((await option.getAttribute('value')) ?? label)
  }
}

const options = (select: Locator) => select.locator('option').allTextContents()

/** Raises the skills of an allocation table, in order, until the pool is spent. */
async function spend(d: Driver, table: Locator, pool: number, max: number) {
  const inputs = await table.getByRole('spinbutton').all()
  const values = await Promise.all(inputs.map(async (i) => Number(await i.inputValue())))
  let left = pool - values.reduce((a, b) => a + b, 0)
  for (let i = 0; i < inputs.length && left > 0; i++) {
    const add = Math.min(max - values[i], left)
    if (add > 0) await d.fill(inputs[i], String(values[i] + add))
    left -= add
  }
  expect(left).toBe(0)
}

/** Fills the professional skill slots with the first skills not yet chosen. */
async function professionalSkills(d: Driver, count: number) {
  const page = d.page
  for (let i = 1; i <= count; i++) {
    const slot = page.getByLabel(`Professional skill ${i}`)
    const [, first] = await options(slot)
    await d.select(slot, first)
    const spec = page.getByLabel(`Specialisation ${i}`)
    if ((await spec.count()) > 0) await d.fill(spec, `Test ${i}`)
  }
}

async function next(d: Driver, label: string) {
  await d.press(d.page.getByRole('button', { name: `Next: ${label}` }))
  await expect(d.page.getByRole('heading', { level: 2 })).toHaveText(label)
}

async function completeCharacter(d: Driver, culture: string, ageCategory: string) {
  const page = d.page
  await page.goto('/')

  // Concept
  await d.fill(page.getByLabel('Character name'), `${culture} test`)
  await d.select(page.getByLabel('Age category'), ageCategory)
  await d.press(page.getByRole('button', { name: /^Roll \d+d6/ }))
  await d.choose(page.getByLabel(/Dice roll, in order/))
  await next(d, 'Characteristics')

  // Characteristics and Attributes
  await d.press(page.getByRole('button', { name: 'Roll characteristics' }))
  await next(d, 'Attributes')
  await d.choose(page.getByLabel(/Medium/))
  await d.press(page.getByRole('button', { name: 'Roll height and weight' }))
  await next(d, 'Culture')

  // Culture
  await d.choose(page.getByLabel(new RegExp(`^${culture}`)))
  const group = page.getByRole('group', { name: /^Choose \d of/ })
  if ((await group.count()) > 0) {
    const pickCount = Number((await group.locator('legend').textContent())!.match(/Choose (\d)/)![1])
    for (const box of (await group.getByRole('checkbox').all()).slice(0, pickCount)) await d.check(box)
  }
  await professionalSkills(d, 3)
  await d.check(page.getByLabel('Take a cultural Combat Style'))
  const cultureStyle = page.getByLabel('Combat Style name')
  await d.select(cultureStyle, (await options(cultureStyle))[1])
  await spend(d, page.getByRole('table', { name: 'Culture skill points' }), 100, 15)
  for (const verb of ['Loyalty', 'Love', 'Hate']) {
    await d.fill(page.getByLabel(`${verb} subject`, { exact: true }), `Test ${verb}`)
    await d.select(page.getByLabel(`${verb} type`), 'A concept or ideal')
  }
  await next(d, 'Background')

  // Background
  await d.press(page.getByRole('group', { name: 'Social Class' }).getByRole('button', { name: 'Roll d100' }))
  await d.press(page.getByRole('group', { name: 'Starting Money' }).getByRole('button', { name: 'Roll 4d6' }))
  const events = page.getByRole('button', { name: 'Roll all events' })
  if ((await events.count()) > 0) await d.press(events)
  await next(d, 'Career')

  // Career: the first career, and each new style slot named after a sample style
  const career = page.getByLabel('Career', { exact: true })
  await d.select(career, (await options(career))[1])
  await professionalSkills(d, 3)
  for (const slot of await page.getByRole('group', { name: /Style$/ }).all()) {
    const define = slot.getByLabel('Define a new style')
    const cultural = slot.getByLabel(/^Use the cultural style/)
    if ((await cultural.count()) > 0 && (await cultural.isEnabled())) continue
    if ((await define.count()) > 0 && !(await define.isChecked())) await d.choose(define)
    const name = slot.getByLabel('Combat Style name')
    const names = await options(name)
    await d.select(name, names[names.length - 2])
  }
  await spend(d, page.getByRole('table', { name: 'Career skill points' }), 100, 15)
  await next(d, 'Bonus Skills')

  // Bonus Skills: the pool and per-skill maximum from the step's own text
  const [, pool, max] = (await page.getByText(/^Spend \d+ points for/).textContent())!.match(/Spend (\d+) points.*\+(\d+)/)!
  await spend(d, page.getByRole('table', { name: 'Bonus skill points' }), Number(pool), Number(max))

  // Ageing, for characters of 40 or more; a roll that reduces a characteristic to 0 is rolled again
  if ((await page.getByRole('button', { name: 'Next: Ageing' }).count()) > 0) {
    await next(d, 'Ageing')
    await d.press(page.getByRole('button', { name: 'Roll Ageing' }))
    for (let i = 0; i < 20 && (await page.getByText('This step is complete.').count()) === 0; i++) {
      await d.press(page.getByRole('button', { name: 'Roll again' }))
    }
  }
  await expect(page.getByText('This step is complete.')).toBeVisible()
  await next(d, 'Character Sheet')
  await expect(page.locator('.sheet')).toContainText(`Human, ${culture}`)
  await expect(page.locator('.sheet')).toContainText(`${culture} test`)
}

const RUNS: [string, string][] = [
  ['Barbarian', 'Young (1d6+10)'],
  ['Civilised', 'Adult (2d6+15)'],
  ['Nomadic', 'Middle Aged (3d6+25)'],
  ['Primitive', 'Old (5d6+60)'],
]

for (const [culture, age] of RUNS) {
  test(`every step for a ${culture} character, ${age}`, async ({ page }) => {
    await completeCharacter(new Driver(page, 'mouse'), culture, age)
  })
}

test('keyboard only: a Senior Civilised character from Concept to the sheet', async ({ page }) => {
  test.setTimeout(120_000)
  const keyboard = new Driver(page, 'keyboard')
  await completeCharacter(keyboard, 'Civilised', 'Senior (4d6+40)')
  expect(keyboard.keys).toBeGreaterThan(100)
})
