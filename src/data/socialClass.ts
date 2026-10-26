import type { CultureId, D100Row } from './types.ts'

export interface SocialClass {
  name: string
  exampleTitles: string[]
  moneyModifier: number
  /** Our own short summary of the book's Background Resources entry. */
  resources: string
}

// Social Class tables by culture, p. 25.
export const SOCIAL_CLASSES: Record<CultureId, D100Row<SocialClass>[]> = {
  barbarian: [
    {
      min: 1,
      max: 5,
      result: {
        name: 'Outcast',
        exampleTitles: ['Exile', 'Outlaw'],
        moneyModifier: 0.25,
        resources: 'Only the clothes worn and perhaps a weapon',
      },
    },
    {
      min: 6,
      max: 15,
      result: {
        name: 'Slave',
        exampleTitles: ['Bondsman', 'Caxtos', 'Peon', 'Serf', 'Thrall'],
        moneyModifier: 0.5,
        resources: "Lives on the owner's land with a few keepsakes",
      },
    },
    {
      min: 16,
      max: 80,
      result: {
        name: 'Freeman',
        exampleTitles: ['Churl', 'Commoner', 'Feine', 'Freedman', 'Karl', 'Labourer'],
        moneyModifier: 1,
        resources: 'Rented home or farmland, own tools or livestock, basic weapons',
      },
    },
    {
      min: 81,
      max: 95,
      result: {
        name: 'Gentry',
        exampleTitles: ['Ealdormen', 'Flaith', 'Hauldr', 'Reeve', 'Thane'],
        moneyModifier: 3,
        resources: 'A house with farm, business or ship; arms and armour, a mount, servants, local support',
      },
    },
    {
      min: 96,
      max: 100,
      result: {
        name: 'Ruling',
        exampleTitles: ['Chieftain', 'Cyning', 'Eorl', 'Jarl', 'King'],
        moneyModifier: 5,
        resources: 'As Gentry, but a great hall, the finest possessions and the loyalty of a region',
      },
    },
  ],
  civilised: [
    {
      min: 1,
      max: 2,
      result: {
        name: 'Outcast',
        exampleTitles: ['Beggar', 'Mendicant', 'Vagabond', 'Vagrant'],
        moneyModifier: 0.25,
        resources: 'Only the clothes worn and perhaps a weapon',
      },
    },
    {
      min: 3,
      max: 20,
      result: {
        name: 'Slave',
        exampleTitles: ['Chattel', 'Captive', 'Helot', 'Servant'],
        moneyModifier: 0.5,
        resources: "Lives on the owner's property with a few keepsakes",
      },
    },
    {
      min: 21,
      max: 70,
      result: {
        name: 'Freeman',
        exampleTitles: ['Citizen', 'Peasant', 'Proletariat', 'Tenant', 'Vassal'],
        moneyModifier: 1,
        resources: 'Rented home or farmland, own tools or livestock, basic weapons',
      },
    },
    {
      min: 71,
      max: 95,
      result: {
        name: 'Gentry',
        exampleTitles: ['Bailiff', 'Equite', 'Master', 'Official', 'Steward', 'Warden'],
        moneyModifier: 3,
        resources: 'Property, farm or business; arms and armour, a mount, servants, local support',
      },
    },
    {
      min: 96,
      max: 99,
      result: {
        name: 'Aristocracy',
        exampleTitles: ['Archon', 'Baron', 'Count', 'Duke', 'Lord', 'Nawab', 'Noble', 'Oligarch', 'Patrician', 'Satrap'],
        moneyModifier: 5,
        resources: 'Several estates or businesses, costly goods and arms, many servants, the loyalty of a region',
      },
    },
    {
      min: 100,
      max: 100,
      result: {
        name: 'Ruling',
        exampleTitles: [
          'Caliph',
          'Czar',
          'Dictator',
          'Emperor',
          'Imperator',
          'Maharajah',
          'Mogul',
          'Pasha',
          'Pharaoh',
          'Potentate',
          'Prince',
          'Rajah',
          'Shah',
          'Sultan',
          'Tyrant',
        ],
        moneyModifier: 10,
        resources: 'As Aristocracy, but priceless, with the loyalty of a nation',
      },
    },
  ],
  nomadic: [
    {
      min: 1,
      max: 5,
      result: {
        name: 'Outcast',
        exampleTitles: ['Outlaw', 'Rebel'],
        moneyModifier: 0.25,
        resources: 'Only the clothes worn, perhaps a weapon, and a mount or small boat if fitting',
      },
    },
    {
      min: 6,
      max: 10,
      result: {
        name: 'Slave',
        exampleTitles: ['Bool', 'Convict', 'Prisoner', 'Thrall'],
        moneyModifier: 0.5,
        resources: "Lives in the owner's camp or vessel with a few keepsakes and simple tools or a weapon",
      },
    },
    {
      min: 11,
      max: 90,
      result: {
        name: 'Freeman',
        exampleTitles: ['Arad', 'Haran', 'Kinsmen', 'Subjects'],
        moneyModifier: 1,
        resources: 'Mounts and a cart or boat of their own, a tent, some livestock, weapons, light armour, perhaps a slave or two',
      },
    },
    {
      min: 91,
      max: 100,
      result: {
        name: 'Ruling',
        exampleTitles: ['Chieftain', 'Emir', 'Khan', 'Khaqan', 'Sea Lord', 'Sheikh'],
        moneyModifier: 3,
        resources: 'Many mounts or boats, a large tent, large herds, good arms and armour, slaves, loyalty of the tribe',
      },
    },
  ],
  primitive: [
    {
      min: 1,
      max: 5,
      result: { name: 'Outcast', exampleTitles: ['Outlaw'], moneyModifier: 0.25, resources: 'A weapon and some trinkets' },
    },
    {
      min: 6,
      max: 80,
      result: {
        name: 'Freeman',
        exampleTitles: ['Tribesman'],
        moneyModifier: 1,
        resources: 'A simple home, tools and stone-age weapons',
      },
    },
    {
      min: 81,
      max: 100,
      result: {
        name: 'Ruling',
        exampleTitles: ['Chieftain', 'Elder'],
        moneyModifier: 2,
        resources: 'A large hall, prized skins and trophies, fine weapons, simple armour, support of the tribe',
      },
    },
  ],
}
