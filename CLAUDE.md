# Mythras Character Generator

## Business Requirements

A web-based character generator for the Mythras RPG (core rules, Revision 3, 2018). It walks a player through the core-rules character creation process step by step and produces a finished, rules-legal character. Key features:

- A guided, step-by-step wizard that follows the core-rules creation order: Concept, Characteristics, Attributes, Culture, Background, Career, Bonus Skills, Ageing (only for characters aged 40 or more), Character Sheet
- Every random table can be either rolled or chosen manually (the rules allow both throughout)
- The app enforces the point-allocation rules (minimums, maximums, totals, which skills may receive points) and shows points remaining at all times
- All derived values (attributes, hit points, skill bases and totals) are calculated automatically and update when earlier choices change
- A quick-generate button that rolls a complete, legal random character the user can then edit
- A printable character sheet laid out after the official Mythras sheet
- Save and load characters as JSON files; the character in progress is autosaved in the browser

## Limitations (v1)

- Core rules only. No Mythic Britain, Mythic Armorica or other supplements
- Humans only (the core creation tables are for humans)
- No equipment step: starting money is calculated, but starting kit and shopping come later
- No magic step: magic skills (Folk Magic, Devotion, Trance and the rest) can be taken as ordinary professional skills, but spells and other magical abilities come later
- Combat Style weapons are free text (the core rules deliberately define no weapons for cultural styles)
- No optional rules (Fixed Action Points, heroic characteristic tweaks and so on) unless listed under Rules readings below
- One character in progress at a time; other characters live as exported JSON files
- No backend, no accounts, no AI features. The architecture must leave room for AI later (see Technical Decisions)

## Technical Decisions

- Static single-page app: Vite + React + TypeScript (strict mode). No backend
- npm as the package manager; current Node LTS
- Vitest + React Testing Library for unit and component tests; Playwright for end-to-end tests
- oxlint with the Vite React TypeScript template defaults (the template moved from ESLint to oxlint)
- Plain CSS with custom properties, plus a print stylesheet for the character sheet. No UI component library
- zod for validating imported JSON characters
- State: one `Character` object held in a React reducer, autosaved to localStorage, exported and imported as versioned JSON (`schemaVersion`)
- Deployment target decided at the end of v1 (GitHub Pages is the likely choice)

### Architecture rules

- **The data is the rulebook.** All rules tables (skills, cultures, careers, age, social class, background events, family, passions, combat style traits, attribute tables) live as typed TypeScript modules in `src/data/`. The engine never hardcodes a culture, career or skill name. This keeps future setting packs (Mythic Britain and others) to "add a data module".
- **The engine is pure.** All rules logic lives in `src/engine/` as pure TypeScript functions with no React imports. The UI calls the engine; it never calculates rules itself.
- **The character stores choices, not results.** The saved `Character` holds the player's decisions (characteristic values, chosen culture, points spent per skill per stage, table results). Bases, totals and attributes are always derived by the engine. Changing an early choice recalculates everything after it.
- **Randomness is injectable.** Every engine function that rolls dice takes an `rng: () => number` argument. Tests use a seeded generator so results are deterministic.
- **Room for AI later.** Engine functions are the future "tools": a later AI feature proposes choices, and the engine validates and applies them, so the AI can never produce an illegal character. An API key must never be shipped in the static site; AI calls will go through a small serverless proxy or a bring-your-own-key setting.

### Folder layout

```
mythras-chargen/
  CLAUDE.md
  PLAN.md
  docs/               rules-data verification notes and other working documents
  src/
    data/             typed rules tables; every table cites its source page
    engine/           pure rules functions (dice, characteristics, attributes, skills, steps)
    state/            Character type, reducer, persistence, JSON import and export
    ui/               React components: steps/ (one per wizard step), sheet/, shared/
  tests/e2e/          Playwright tests
```

Unit tests sit next to the code they test (`foo.ts` and `foo.test.ts`).

## Rules Sources

The source documents are in the parent folder (`..`), outside this project. They are not part of the project and must never be copied into it or committed. If Claude Code asks for permission to read `..`, allow it, or start Claude Code with `claude --add-dir ..`.

| File | Use |
|---|---|
| `../core-rules_clean.txt` | Searchable text of the core rules. Page markers look like `===== page N =====`. Multi-column tables are garbled in this file, so never transcribe a table from it alone |
| `../core-rules.pdf` | The authority for tables. It is large (95 MB): render only the pages you need. PDF page N is text marker N. Poppler (`pdftoppm`) is not installed on this Mac; use PyMuPDF in a throwaway venv outside the project: `python3 -m venv <scratch>/venv && <scratch>/venv/bin/pip install pymupdf`, then `pymupdf.open(path)[N-1].get_pixmap(dpi=110).save('pN.png')` and view the PNG |
| `../character-workbook.pdf` | Official creation workbook (6 pages): summary tables and the skill allocation worksheet |
| `../character-sheet-print.pdf` | Layout reference for the printable character sheet |
| `../campaign-notes/mythras-1-chargen-skills-system.md` | Brandon's page-cited digest of core pp. 1–83. A good starting point, but it is a secondary source: verify against the book before using a number |

**Page citations** use the page markers in `core-rules_clean.txt`. The book's table of contents numbers are one lower than these markers (for example, Bonus Skill Points is "32" in the contents and `page 33` in the text).

**Rules hierarchy:** core rules text over the workbook over the digest notes. Where they disagree, follow the core rules and record the discrepancy under Known errata.

**Golden example:** the core rules follow one character, Anathaym, through creation (characteristics, attributes and base skills p. 12, culture p. 18, background p. 22, career p. 28). Her published numbers are the main end-to-end test for the engine.

## Rules Readings

Interpretations used where the rules are ambiguous or silent. Stay by the book: the app will be shown to the Mythras community, so where the rules are clear, follow them even when a result looks odd, and do not add house rules. Status is **Proposed** until Brandon confirms it in Part 1 of PLAN.md; after that it is **Confirmed**. Never change a Confirmed reading without asking Brandon. When a new ambiguity comes up, stop and ask, then add it here.

| # | Topic | Reading | Status |
|---|---|---|---|
| R1 | Rounding | All fractions round up (p. 5). Initiative = (INT+DEX)/2 rounded up | Confirmed |
| R2 | Roll and assign | Values may be swapped only within the same dice group: 3d6 (STR, CON, DEX, POW, CHA) or 2d6+6 (SIZ, INT) | Confirmed |
| R3 | Points build | 75 points; each characteristic 3–18, INT and SIZ 8–18; all 75 must be spent | Confirmed |
| R4 | Culture minimum | Every listed culture standard skill, every chosen culture professional skill, and the cultural combat style (if taken) receives at least 5 and at most 15 points. This matches the Anathaym example | Confirmed |
| R5 | Spending all points | A skill stage (culture, career, bonus) is complete only when its whole pool is spent. Unspent points do not carry over | Confirmed |
| R6 | Culture choice groups | Barbarian picks Boating or Ride; Nomadic picks two of Athletics, Boating, Swim, Drive, Ride; Primitive picks one of Athletics, Boating, Swim. Options not picked are not culture skills | Confirmed |
| R7 | Specialised skills | Craft, Lore, Language, Art, Culture, Musicianship, Healing (species), Teach (species) and magic skills (Devotion, Binding, Invocation) take a free-text specialisation. The same skill may be taken more than once with different specialisations; each is a separate skill. Career-fixed specialisations (for example Craft (Alchemy)) are prefilled | Confirmed |
| R8 | Career repeats | A professional skill already gained from culture may be one of the career's three professional picks; career points can then go into it (p. 27). Combat Styles are career standard-skill slots and never use a professional pick (Anathaym, p. 28) | Confirmed |
| R9 | Career combat styles | Slot types (pp. 28–32): "Cultural Style" is the style taken at the culture step, defined now if none was taken. "Specific X or Cultural Style" (Herder, Hunter, Sailor, Scout): the player uses the cultural style or defines a new career style. "Concealable Weapons Style" (Agent, Thief): a new, separate style. Warrior has the Cultural Style plus a separate Speciality Style. New styles start at their base | Confirmed |
| R10 | Combat style definition | A style has a name (from the culture's example names or custom), free-text weapons, and zero or one trait from the p. 90 list (p. 89 allows "one or more"; Brandon chose one). Base is STR+DEX | Confirmed |
| R11 | Bonus points | One optional hobby skill (any professional skill or combat style). Bonus points go only to standard skills, professional skills and combat styles the character already has, plus the hobby skill. The age category's maximum applies to bonus points per skill, not to the running total | Confirmed |
| R12 | Age and background events | Age category is chosen in the Concept step (default Adult) because it sets bonus points, the per-skill maximum and the number of background events. The age table's "Background Event Rolls" column is the total number of events (Young 0, Adult 1, Middle Aged 2, Senior 3, Old 4) | Confirmed |
| R13 | Passions | The three cultural Passions use the culture's verbs (Loyalty, Love, Hate); the player names the object and its type. Starting values follow p. 24: romantic or familial = 30 + subject's POW+CHA; platonic or averse = 30 + character's POW + subject's CHA; organisation, place, concept = 30 + POW+INT; race, object = 30 + POW×2. The subject's characteristics are entered by the user and default to the character's own values. Passions receive no skill points in v1 | Confirmed |
| R14 | Starting money | Culture base money (p. 22: 4d6 × 50, 75, 25 or 10 SP; the 4d6 is rolled or entered) × social class money modifier (p. 25), recorded in silver pieces. Splitting it into coin and goods is left to the GM | Confirmed |
| R15 | Skill names | The culture lists say "Navigate"; the skill is Navigation. Use Navigation everywhere | Confirmed |
| R16 | Age in years | Age in years is rolled from the age category's dice (p. 33, for example Adult 2d6+15) or entered within that dice range. It decides which Ageing bands apply | Confirmed |
| R17 | Ageing | Applied at creation to any character aged 40 or more (Age Bands, p. 72), not only Senior and Old. One Endurance and one Willpower roll per band passed, in order, at that band's grade (p. 39 Difficulty Grades, R22; Dotage is Hopeless, an automatic failure). Rolls use the skill totals after Bonus Skills, and each band rolls against the values left by the earlier bands' losses. The usual automatic results apply (p. 38: 01-05 succeeds, 96-00 fails). A failure reduces a characteristic from the Ageing Effects table by 1d3. Losses are stored as characteristic modifiers, so attributes and bases recalculate and allocations are kept. Every result can be rolled or entered. A characteristic reduced to 0 or less makes the step invalid with a plain message; the user re-rolls or edits | Confirmed |
| R18 | Enemies or Rivals | Where a Reputation or Connections result gives a count of "X or Y" (for example 1d3 Enemies or Rivals), the count is rolled or entered and the player labels each one. Quick-generate labels them at random | Confirmed |
| R19 | Quick-generate names | The core rules have no name tables; a generated character's name is left blank | Confirmed |
| R20 | Background event effects | Background events are narrative only: the event is recorded on the sheet and changes no numbers. The player may add any Passion it suggests by hand | Confirmed |
| R21 | Children | Only a married character has children (p. 24): 1d4-1 of them. Each child's age is 1d4 years for a Young or Adult parent; for a Middle Aged or older parent it uses the Age table dice of the next-younger category. Count and ages are rolled or entered | Confirmed |
| R22 | Difficulty grade rounding | The fraction a grade adds or removes is rounded up first (R1), then applied: Hard = skill − ceil(skill/3), Formidable = skill − ceil(skill/2), Easy = skill + ceil(skill/2), Very Easy = skill × 2, Herculean = ceil(skill/10). For example, 50 at Hard is 33 | Confirmed |
| R23 | Step completeness | Concept: name optional. Culture: the three cultural Passions are required (subject and object type). Background: social class, starting money and the background events (R12 count) are required; parents, siblings, extended family, reputation, connections and marriage are optional | Confirmed |
| R24 | Quick-generate specialisations | A generated specialised skill takes a specialisation from a short list: the book's own examples where it gives them (Lore p. 48; Craft p. 46; Musicianship p. 49; career hints that say "such as ..."), otherwise a few plain, setting-neutral ones the player can rename (for example Language (Neighbouring Tongue), Healing (Human)). These live in `src/data/quickGenerate.ts`, marked as generator defaults, not rules | Confirmed |
| R25 | Quick-generate Passions | The three cultural Passions get generic subjects drawn from the culture's suggestion, with a fitting object type (for example Loyalty (Clan Chieftain) platonic, Love (Sibling) familial, Hate (Rival Clan) organisation). Values follow R13 with the subject's characteristics defaulting to the character's own | Confirmed |

## Known Errata

- The workbook's Skill Allocation Worksheet gives Locale as DEX+POW and Perception as CHA+POW. The core rules (p. 12) and the workbook's own character sheet say INT×2 and INT+POW. Use the core rules.
- The core rules' creation summary (p. 37) gives the INT and SIZ minimum for the points build as 6. The p. 36 summary and the 2d6+6 range give 8. Use 8.
- Anathaym's career example (p. 28) spends +10 on Unarmed (the career's 100 points add up only with it), but the printed totals show Unarmed 27%, its base. Use 37%; the golden test expects 37%.

## Copyright

The rules are copyright The Design Mechanism. The app needs their tables and numbers, but:

- Never copy the book's prose into the app. Help text is short, in our own words, with a page reference ("see Mythras p. 14"). Page references shown to the user are the book's printed page numbers (text marker − 1), since players look them up in the printed book; code comments keep the text markers
- Tables whose entries are prose (background events, combat style trait descriptions, social class background resources) are stored as one short paraphrase per entry in our own words, with the page reference
- Keep the repository private unless Brandon has checked the licensing
- Never commit the PDFs or `core-rules_clean.txt` (they live outside this folder; keep it that way)

## Coding Standards

1. Use the latest stable versions of libraries and idiomatic approaches as of today
2. Keep it simple. NEVER over-engineer, ALWAYS simplify, NO unnecessary defensive programming. No extra features beyond PLAN.md
3. Be concise. Keep the README minimal. IMPORTANT: no emojis ever, in code, UI, docs or commit messages
4. When hitting issues, identify the root cause before trying a fix. Do not guess. Prove it with evidence, then fix the root cause
5. Every rules value in `src/data/` cites its source page in a comment. Every engine rule has a unit test, including the boundaries of every table bracket
6. If the rules are unclear, stop and ask Brandon. Do not invent a ruling; record the answer under Rules Readings
7. UI text uses Mythras terminology exactly as the book does (Combat Style, Action Points, Damage Modifier and so on)

## Color Scheme

Direction "Parchment & Ink", chosen by Brandon in Part 6: warm and bookish, echoing the rulebook. Defined as CSS custom properties in `src/index.css`.

- Paper: `#f6f1e7` - page background
- Surface: `#fffdf8` - cards and panels
- Ink: `#2b2622` - body text
- Header Bar: `#4a4440` - table headers, like the book's tables
- Oxblood Accent: `#8b2e2a` - buttons, active step, links
- Gold: `#b08a3e` - highlights, focus ring
- Error: `#a3361f` - problems and invalid fields
- Headings: EB Garamond in small caps (self-hosted via `@fontsource/eb-garamond`); body: system sans

## Commands

- `npm run dev`: development server
- `npm run build`: production build (`tsc -b && vite build`)
- `npm run preview`: serve the production build on port 4173
- `npm test`: unit and component tests (Vitest, jsdom; files `src/**/*.test.{ts,tsx}`)
- `npm run test:e2e`: end-to-end tests (Playwright, Chromium only; builds and serves the production build itself). First run needs `npx playwright install chromium`
- `npm run lint`: oxlint (exits 0 on warnings; read its output)
- `npm run typecheck`: `tsc -b`

## Working Documentation

PLAN.md in this folder is the plan and the checklist. Read it before starting work, work through it in order, tick items off as they are completed, and do not start a part until Brandon has approved the previous one. Other working documents go in `docs/`.

Workflow agreed with Brandon:

- The Status section at the top of PLAN.md says where work stands. Update it at the end of each part and whenever a part's state changes
- At the end of each part: run `npm test`, `npm run test:e2e`, `npm run typecheck`, `npm run lint` and `npm run build`; report to Brandon; commit on `main` (one commit per part, present tense) only after he approves
- Rules questions go to Brandon as multiple-choice questions with a recommended option; each answer is recorded under Rules Readings straight away
