import type { BaseFormula, SkillDef } from './types.ts'

const standard = (name: string, base: BaseFormula): SkillDef => ({
  name,
  type: 'standard',
  base,
  specialised: false,
  magic: false,
  page: 12,
})

const professional = (
  name: string,
  base: BaseFormula,
  page: number,
  opts: { specialised?: boolean; magic?: boolean } = {},
): SkillDef => ({
  name,
  type: 'professional',
  base,
  specialised: opts.specialised ?? false,
  magic: opts.magic ?? false,
  page,
})

// Standard Skills table, p. 12.
export const STANDARD_SKILLS: SkillDef[] = [
  standard('Athletics', ['STR', 'DEX']),
  standard('Boating', ['STR', 'CON']),
  standard('Brawn', ['STR', 'SIZ']),
  standard('Conceal', ['DEX', 'POW']),
  standard('Customs', ['INT', 'INT']),
  standard('Dance', ['DEX', 'CHA']),
  standard('Deceit', ['INT', 'CHA']),
  standard('Drive', ['DEX', 'POW']),
  standard('Endurance', ['CON', 'CON']),
  standard('Evade', ['DEX', 'DEX']),
  standard('First Aid', ['INT', 'DEX']),
  standard('Influence', ['CHA', 'CHA']),
  standard('Insight', ['INT', 'POW']),
  standard('Locale', ['INT', 'INT']),
  standard('Native Tongue', ['INT', 'CHA']),
  standard('Perception', ['INT', 'POW']),
  standard('Ride', ['DEX', 'POW']),
  standard('Sing', ['CHA', 'POW']),
  standard('Stealth', ['DEX', 'INT']),
  standard('Swim', ['STR', 'CON']),
  standard('Unarmed', ['STR', 'DEX']),
  standard('Willpower', ['POW', 'POW']),
]

// Professional Skills, pp. 45-50 (page given per skill). Specialised skills per R7.
export const PROFESSIONAL_SKILLS: SkillDef[] = [
  professional('Acting', ['CHA', 'CHA'], 45),
  professional('Acrobatics', ['STR', 'DEX'], 45),
  professional('Art', ['POW', 'CHA'], 45, { specialised: true }),
  professional('Binding', ['POW', 'CHA'], 45, { specialised: true, magic: true }),
  professional('Bureaucracy', ['INT', 'INT'], 46),
  professional('Commerce', ['INT', 'CHA'], 46),
  professional('Courtesy', ['INT', 'CHA'], 46),
  professional('Craft', ['DEX', 'INT'], 46, { specialised: true }),
  professional('Culture', ['INT', 'INT'], 46, { specialised: true }),
  professional('Devotion', ['POW', 'CHA'], 46, { specialised: true, magic: true }),
  professional('Disguise', ['INT', 'CHA'], 46),
  professional('Engineering', ['INT', 'INT'], 47),
  professional('Exhort', ['INT', 'CHA'], 47, { magic: true }),
  professional('Folk Magic', ['POW', 'CHA'], 47, { magic: true }),
  professional('Gambling', ['INT', 'POW'], 47),
  professional('Healing', ['INT', 'POW'], 47, { specialised: true }),
  professional('Invocation', ['INT', 'INT'], 48, { specialised: true, magic: true }),
  professional('Language', ['INT', 'CHA'], 48, { specialised: true }),
  professional('Literacy', ['INT', 'INT'], 48),
  professional('Lockpicking', ['DEX', 'DEX'], 48),
  professional('Lore', ['INT', 'INT'], 48, { specialised: true }),
  professional('Mechanisms', ['DEX', 'INT'], 48),
  professional('Meditation', ['INT', 'CON'], 49, { magic: true }),
  professional('Musicianship', ['DEX', 'CHA'], 49, { specialised: true }),
  professional('Mysticism', ['POW', 'CON'], 49, { magic: true }),
  professional('Navigation', ['INT', 'POW'], 49),
  professional('Oratory', ['POW', 'CHA'], 49),
  professional('Seamanship', ['INT', 'CON'], 49),
  professional('Seduction', ['INT', 'CHA'], 49),
  professional('Shaping', ['INT', 'POW'], 50, { magic: true }),
  professional('Sleight', ['DEX', 'CHA'], 50),
  professional('Streetwise', ['POW', 'CHA'], 50),
  professional('Survival', ['CON', 'POW'], 50),
  professional('Teach', ['INT', 'CHA'], 50, { specialised: true }),
  professional('Track', ['INT', 'CON'], 50),
  professional('Trance', ['POW', 'CON'], 50, { magic: true }),
]

export const ALL_SKILLS: SkillDef[] = [...STANDARD_SKILLS, ...PROFESSIONAL_SKILLS]

// Customs and Native Tongue gain this bonus at the culture step, p. 14.
export const CULTURE_SKILL_BONUS = { skills: ['Customs', 'Native Tongue'], bonus: 40 }
