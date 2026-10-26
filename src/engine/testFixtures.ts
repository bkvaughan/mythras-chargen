import type { CareerChoices, Characteristics, CultureChoices, SkillChoices } from './types.ts'

// Anathaym, the core rules' worked example (pp. 12, 18, 28, 90).

export const ANATHAYM: Characteristics = { STR: 11, CON: 13, SIZ: 10, DEX: 16, INT: 14, POW: 7, CHA: 9 }

export const ANATHAYM_CULTURE: CultureChoices = {
  culture: 'civilised',
  standardChoice: [],
  professional: [{ skill: 'Courtesy' }, { skill: 'Lore', specialisation: 'Geography' }, { skill: 'Streetwise' }],
  combatStyle: { name: 'Meerish Slinger', weapons: 'Sling, shortsword, peltast shield', trait: 'Skirmishing' },
  points: {
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
  },
  passions: [
    { verb: 'Loyalty', subject: 'Meeros', object: 'place' },
    { verb: 'Love', subject: 'Kara', object: 'romantic' },
    { verb: 'Hate', subject: 'Xenos', object: 'averse' },
  ],
}

export const ANATHAYM_CAREER: CareerChoices = {
  career: 'warrior',
  professional: [
    { skill: 'Lore', specialisation: 'Military History' },
    { skill: 'Lore', specialisation: 'Strategy and Tactics' },
    { skill: 'Survival' },
  ],
  styles: [
    { use: 'cultural' },
    { use: 'new', style: { name: 'Meerish Infantry', weapons: 'Spear, hoplite shield, javelin', trait: 'Formation Fighting' } },
  ],
  points: {
    Athletics: 10,
    Endurance: 10,
    Evade: 10,
    'Lore (Military History)': 10,
    'Lore (Strategy and Tactics)': 10,
    Survival: 10,
    Unarmed: 10,
    'Combat Style (Meerish Slinger)': 15,
    'Combat Style (Meerish Infantry)': 15,
  },
}

export const ANATHAYM_CHOICES: SkillChoices = { culture: ANATHAYM_CULTURE, career: ANATHAYM_CAREER, bonus: null }
