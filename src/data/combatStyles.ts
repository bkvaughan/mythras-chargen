import type { BaseFormula } from './types.ts'

// All Combat Styles have a base of STR+DEX, p. 13.
export const COMBAT_STYLE_BASE: BaseFormula = ['STR', 'DEX']

export interface CombatStyleTrait {
  name: string
  /** Our own short summary of the book's description. */
  summary: string
  /** Works only if everyone in the group also has it. */
  groupOnly: boolean
}

const trait = (name: string, summary: string, groupOnly = false): CombatStyleTrait => ({ name, summary, groupOnly })

// Combat Style Traits, p. 90. A style has zero or one trait (R10).
export const COMBAT_STYLE_TRAITS: CombatStyleTrait[] = [
  trait('Assassination', "Can use the 'Kill Silently' special effect"),
  trait('Batter Aside', 'Against a foe whose Damage Modifier is at least two steps lower, the weapon counts one size larger when parried'),
  trait('Beast-back Lancer', 'No difficulty penalty to hit on a mounted charge'),
  trait('Blind Fighting', 'Ignores penalties for darkness or temporary blindness'),
  trait('Cautious Fighter', 'Change Range can withdraw from engagement without a roll'),
  trait('Chariot Fighting', "Combat rolls in a chariot are not capped by the driver's Drive"),
  trait('Daredevil', 'Can Evade in melee without ending up prone'),
  trait('Defensive Minded', 'Weapon counts one size larger when parrying, if no attack is made that round'),
  trait('Do or Die', 'Dual weapons can use Flurry when alternating weapons'),
  trait('Excellent Footwork', 'Combat rolls on unstable footing are not capped by Acrobatics'),
  trait('Formation Fighting', 'In a close formation of three or more, engaged foes lose one Action Point', true),
  trait('Hidden Weapons', 'Harmless-looking objects become deadly weapons that do not break'),
  trait('Intimidating Scream', "Foes' psychological resistance rolls are one grade harder"),
  trait('Knockout Blow', 'Stun Location from a surprise attack lasts minutes, not turns'),
  trait('Mancatcher', 'Foes resisting entangle or immobilise are one grade harder'),
  trait('Mounted Combat', 'Combat rolls while mounted are not capped by Ride'),
  trait('Ranged Marksman', 'Can shift a random ranged hit location to an adjacent one'),
  trait('Shield Splitter', 'Clubs and axes roll damage twice, taking the best, when using Damage Weapon on shields'),
  trait('Shield Wall', 'In a group of three or more shields, protect one extra location and resist some manoeuvres', true),
  trait('Siege Warfare', 'Combat rolls while scaling walls or in tunnels are not capped by Athletics'),
  trait('Skirmishing', 'Can make ranged attacks while running, but not sprinting'),
  trait('Swashbuckling', 'Attacks and evades while jumping or swinging are not capped by Athletics'),
  trait('Throw Weapons', 'Melee weapons can be thrown without skill penalty, for half damage'),
  trait('Trained Beast', 'Can spend Action Points to defend a trained animal companion'),
  trait('Unarmed Prowess', 'Unarmed blocks and parries count as Medium sized'),
  trait('Water Combat', 'Combat rolls in water are not capped by Swim'),
]

export interface SampleCombatStyle {
  name: string
  weapons: string[]
  /** The book suggests one of these traits. */
  suggestedTraits: string[]
}

// Sample Combat Styles, p. 13.
export const SAMPLE_COMBAT_STYLES: SampleCombatStyle[] = [
  { name: 'Street Brawler', weapons: ['Fists', 'Feet', 'Knife', 'Club'], suggestedTraits: ['Batter Aside', 'Unarmed Prowess'] },
  {
    name: 'Assassin',
    weapons: ['Dagger', 'Shortsword', 'Bow or Crossbow'],
    suggestedTraits: ['Assassination', 'Ranged Marksman'],
  },
  {
    name: 'Barbarian Warrior',
    weapons: ['Greatsword', 'Broadsword', 'Battleaxe', 'Shield'],
    suggestedTraits: ['Do or Die', 'Intimidating Scream'],
  },
  {
    name: 'Cavalry or Mounted Knight',
    weapons: ['Sword', 'Long Spear/Lance', 'Shield'],
    suggestedTraits: ['Beast-back Lancer', 'Mounted Combat'],
  },
  {
    name: 'City Watch or Hoplite',
    weapons: ['Spear', 'Shield', 'Shortsword'],
    suggestedTraits: ['Cautious Fighter', 'Formation Fighting'],
  },
  {
    name: 'Gladiator',
    weapons: ['Shortsword', 'Buckler', 'Net', 'Trident'],
    suggestedTraits: ['Daredevil', 'Mancatcher'],
  },
  {
    name: 'Marine or Pirate',
    weapons: ['Falchion (or Rapier)', 'Club', 'Main Gauche'],
    suggestedTraits: ['Excellent Footwork', 'Swashbuckling'],
  },
  {
    name: 'Master Archer',
    weapons: ['Dagger', 'Shortsword', 'Long Bow'],
    suggestedTraits: ['Ranged Marksman', 'Skirmishing'],
  },
  {
    name: 'Meerish Slinger',
    weapons: ['Shortsword', 'Shield', 'Sling'],
    suggestedTraits: ['Knockout Blow', 'Shield Wall'],
  },
  {
    name: 'Noble Warrior',
    weapons: ['Longsword', 'Shield', 'Main Gauche', 'Bow'],
    suggestedTraits: ['Defensive Minded'],
  },
]
