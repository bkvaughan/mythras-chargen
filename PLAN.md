# Plan: Mythras Character Generator v1

Work through the parts in order. Tick each checkbox when it is done. Each part ends with Brandon reviewing the result; do not start the next part until he approves. Read CLAUDE.md first: it holds the requirements, technical decisions, rules readings and coding standards this plan relies on.

## Status

- Parts 1-6: complete, approved and committed (one commit per part on `main`)
- Part 7 (Culture and Background): in progress

---

## Part 1: Plan review and rules sign-off

Brandon reviews this plan and the rules readings before any code is written.

- [x] Brandon reads CLAUDE.md and this plan and requests any changes
- [x] Go through Rules Readings R1–R15 in CLAUDE.md with Brandon; record his answer for each and change its status to Confirmed (or rewrite it). R8 and R9 were rewritten; R16–R20 added (age in years, Ageing, Enemies or Rivals, quick-generate names, background event effects)
- [x] Confirm the v1 scope and the "Later" list at the end of this plan (Ageing added to v1; Group Luck Points added to Later)
- [x] Decide whether the project is a git repository from the start (decided: local git only, no remote)

**Success criteria:** every rules reading is Confirmed, and Brandon has approved the plan.

---

## Part 2: Scaffolding

Set up the project with every tool it needs, and prove the toolchain works with a hello-world page.

- [x] Create a Vite + React + TypeScript project in this folder (strict TypeScript)
- [x] Add Vitest and React Testing Library; add Playwright with a Chromium-only config
- [x] Add oxlint (the Vite React TypeScript template default; replaces ESLint, approved by Brandon) and a `typecheck` script (`tsc -b`)
- [x] npm scripts: `dev`, `build`, `preview`, `test`, `test:e2e`, `lint`, `typecheck`
- [x] `.gitignore` (node_modules, dist, test output, `.env*`)
- [x] Create the empty folder layout from CLAUDE.md (`src/data`, `src/engine`, `src/state`, `src/ui`, `tests/e2e`, `docs`)
- [x] Hello-world page showing the app title
- [x] One trivial unit test, one component test, one Playwright test that loads the page
- [x] Minimal README: what the app is and the commands
- [x] Update the Commands section of CLAUDE.md

**Tests:** `npm test`, `npm run test:e2e`, `npm run lint`, `npm run typecheck` and `npm run build` all pass.

**Success criteria:** `npm run dev` serves the hello-world page, and every script above passes on a clean install.

---

## Part 3: Rules data

Transcribe every table v1 needs into typed modules in `src/data/`. This is the foundation for everything else, so it is checked against the PDF, not the extracted text.

Method for each table: find it in `../core-rules_clean.txt` by its page marker, render that page from `../core-rules.pdf` to read the real table, transcribe it, add a page citation comment, and record it in `docs/rules-data.md`.

- [x] Define the data types first (`src/data/types.ts`): Characteristic, Skill (standard, professional, magic; base formula; whether it takes a specialisation), Culture, Career, d100 table rows, and so on
- [x] Characteristics: generation methods, dice per characteristic, points build limits (p. 9)
- [x] Attribute tables: Action Points, Damage Modifier, Experience Modifier, Healing Rate, Luck Points, hit points per location, height and weight by SIZ and frame (pp. 9–12)
- [x] Skills: all standard skills with base formulas (p. 12); all professional and magic skills with base formulas (pp. 45–50)
- [x] Cultures: the four cultures with standard skills, choice groups, professional options, example combat style names, Passions, starting money (pp. 15–18, 22)
- [x] Careers: all 24 careers with standard skills, combat style slots, professional options and fixed specialisations; career availability by culture (pp. 27–32)
- [x] Age table, including the age-in-years dice (p. 33)
- [x] Ageing: Age Bands with roll grades and the Ageing Effects table (p. 72); Difficulty Grades (p. 39)
- [x] Social class tables by culture with money modifiers (p. 25)
- [x] Background events table (pp. 18–21)
- [x] Family tables: parents, siblings, extended family, reputation, connections, marriage and children (R21) (pp. 24–26)
- [x] Passion object types and starting-value formulas (p. 24)
- [x] Combat style traits (p. 90) and the sample combat styles table with suggested weapons and traits (p. 13)
- [x] `docs/rules-data.md`: one row per table with its source page and verification status
- [x] Brandon spot-checks the data against his books and signs off

**Tests** (`src/data/*.test.ts`):
- 22 standard skills, 4 cultures, 24 careers
- Every skill named by a culture or career exists in the skills table
- Every d100 table covers 1–100 exactly once, with no gaps or overlaps
- Career availability per culture matches p. 27
- Base formulas match the Anathaym base skills on p. 12 when computed (this test can be finished in Part 4)

**Success criteria:** all tables transcribed and cited, data tests pass, Brandon has signed off `docs/rules-data.md`.

---

## Part 4: Rules engine

Pure functions in `src/engine/` that implement every creation rule, fully unit tested. No UI yet.

- [x] Dice: seeded RNG for tests, a parser and roller for expressions used by the tables (`3d6`, `2d6+6`, `1d3-1`, `4d6`), d100 table lookup
- [x] Characteristics: roll in order, roll and assign (with swap validation per R2), points build validation (R3)
- [x] Attributes: all derived attributes, hit points per location, height and weight ranges (R1 for rounding)
- [x] Skill bases from characteristics, including specialised skills (R7)
- [x] Culture step: available skills and choice groups (R6), allocation validation (R4, R5), +40 Customs and Native Tongue
- [x] Career step: career availability by culture, professional picks (R8), combat style slots (R9), allocation validation (0–15, R5)
- [x] Bonus step: points and per-skill maximum by age category, hobby skill, eligibility (R11, R12)
- [x] Age in years (R16) and Ageing (R17): bands passed, Endurance and Willpower rolls at each grade, characteristic losses as modifiers, invalid if a characteristic reaches 0
- [x] Passions: starting values (R13)
- [x] Background: social class, starting money (R14), background events (count per R12), family, reputation, connections, marriage
- [x] Final skill totals: base + culture + career + bonus (+40 where it applies)
- [x] Step validity: for each step, whether it is complete and, if not, the list of problems in plain words (the UI shows these). One problems function per step; Part 5 combines them for the whole character

**Tests:**
- Every table bracket boundary for every attribute (for example Damage Modifier at STR+SIZ 20, 21, 25, 26)
- Allocation validation: under minimum, over maximum, overspent, underspent, points into an ineligible skill
- **Golden test, Anathaym** (core rules pp. 12–28, text lines around 632–1292 of `core-rules_clean.txt`): from STR 11, CON 13, SIZ 10, DEX 16, INT 14, POW 7, CHA 9, the engine reproduces her attributes (AP 3, DM +0, Healing Rate 3, Initiative 15, Luck 2, MP 7, hit points Head and Legs 5, Chest 7, Abdomen 6, Arms 4), her base skills, her skills after Civilised culture, and her skills after the Warrior career, exactly as printed
- Changing a characteristic after skills are allocated changes bases and totals but keeps the allocations
- Ageing: band count at ages 39, 40, 49, 50 and 90; grade per band; a loss lowers bases and attributes; reaching 0 is invalid

**Success criteria:** all engine tests pass, including the golden test; engine code has no React imports.

---

## Part 5: Character model and persistence

- [x] `Character` type in `src/state/`: choices only (per CLAUDE.md), with `schemaVersion`
- [x] Reducer and actions for every choice the wizard makes
- [x] Derived view: one function that turns a `Character` into everything the UI displays (attributes, skill table, step validity, points remaining), built on the engine
- [x] Invalidation: when an earlier choice changes, clear only the later choices that no longer make sense (for example, changing culture clears culture allocations and a career the new culture does not allow, but keeps characteristics)
- [x] Autosave the current character to localStorage and restore it on load
- [x] Export the character as a JSON file; import a JSON file with zod validation and a clear error on bad files

**Tests:** reducer tests for each action; invalidation cases; export then import gives an identical character; a malformed file is rejected with a readable message.

**Success criteria:** a character can be built entirely through reducer actions in a test, saved, reloaded and exported without loss.

---

## Part 6: Design direction and wizard shell

- [x] Propose two visual directions to Brandon (palette, typography, overall feel); he picks one; record it in CLAUDE.md as a Color Scheme section like the course project
- [x] Wizard shell: step list with completion state, next and back, jump to any reachable step
- [x] Persistent summary panel: name, characteristics, key attributes, points remaining in the current stage
- [x] Concept step: character and player name, gender, handedness, description, age category (R12) and age in years (R16), characteristic generation method
- [x] Characteristics step: roll in order, roll and assign with swaps, or points build with live remaining-points count
- [x] Attributes step: derived attributes shown read-only; frame choice and height and weight within the allowed range (roll or pick)
- [x] Layout works on a laptop and a tablet; keyboard accessible

**Tests:** component tests for each step's validation messages; Playwright test that completes Concept, Characteristics and Attributes with each generation method.

**Success criteria:** Brandon can create a character's first three steps in the browser and the summary panel matches a hand calculation.

---

## Part 7: Culture and Background steps

- [ ] Culture step: choose culture; resolve choice groups; pick three professional skills with specialisations; optional combat style (name, weapons, trait); allocate 100 points with live validation; name the Native Tongue; set up the three Passions with object and type
- [ ] Background step: social class (roll or choose), starting money, background events (roll, reroll or choose, count from age category), family, reputation and connections with named Allies, Contacts, Rivals and Enemies (free text), marriage (optional)

**Tests:** component tests for allocation rules; Playwright test that recreates Anathaym's culture step and checks her post-culture skills on screen.

**Success criteria:** Brandon completes both steps for a character of each culture without hitting a rule the app gets wrong.

---

## Part 8: Career, Bonus Skills and Ageing steps

- [ ] Career step: careers filtered by culture; up to three professional picks (R8); combat style slots (R9); allocate 100 points (0–15 each)
- [ ] Bonus step: optional hobby skill; allocate the age category's pool within its per-skill maximum (R11)
- [ ] Ageing step (R17), shown only for characters aged 40 or more: each band's Endurance and Willpower rolls, roll or enter results, losses shown against the characteristics
- [ ] Full skill table preview showing base, culture, career, bonus and total for each skill

**Tests:** component tests; Playwright test that continues Anathaym through her Warrior career and checks her post-career skills on screen; a test per age category for pool size and maximum; Playwright test for an Old character through the Ageing step.

**Success criteria:** a full character can be completed in the browser and every total matches the engine.

---

## Part 9: Character sheet, print and export

- [ ] Character sheet view modelled on `../character-sheet-print.pdf`: identity, characteristics and attributes, hit locations, standard and professional skills, combat styles, Passions, background and family notes, money
- [ ] Print stylesheet: the sheet prints cleanly on US Letter and A4, and "Save as PDF" from the browser works
- [ ] Export, import and "new character" controls in the UI

**Tests:** Playwright test that completes a character, opens the sheet, and checks the key values; export and re-import through the UI gives the same sheet.

**Success criteria:** Brandon prints a sheet he would hand to a player.

---

## Part 10: Quick-generate

- [ ] One button that builds a complete random character: random choices at every step (including Ageing where it applies), legal point allocations, then lands on the character sheet
- [ ] The result is a normal character: every step can be revisited and edited

**Tests:** generate 500 characters with different seeds and assert that every one passes every step's validation; Playwright test for the button.

**Success criteria:** every generated character is legal and reads as plausible to Brandon.

---

## Part 11: Polish and release

- [ ] Full Playwright pass over every step and every culture
- [ ] Accessibility pass: labels, focus order, contrast, keyboard-only completion
- [ ] Review all help text: our own words, page references, no copied prose (CLAUDE.md, Copyright)
- [ ] README final check
- [ ] Decide hosting with Brandon (GitHub Pages or local only) and set it up if wanted

**Success criteria:** Brandon creates a few characters end to end and calls v1 done.

---

## Later (not v1: do not start without Brandon's approval)

- Equipment: starting kit by social class (p. 34), shopping with starting money, weapons and armour tables, encumbrance and Armour Penalty, weapon lists for combat styles
- Magic: starting abilities from magic skill values (p. 119), Folk Magic spell lists by career (p. 123), cult membership
- Fill the official fillable PDF (`../character-sheet-fillable.pdf`)
- Optional rules: Fixed Action Points, heroic characteristic tweaks, GM adjustment of Passions
- AI assistant: suggests a concept, backstory or full set of choices; the engine validates and applies them; calls go through a serverless proxy or a bring-your-own-key setting
- Setting packs: Mythic Britain and Mythic Armorica cultures, careers and Passions as additional data modules
- Several saved characters in the browser
- Group Luck Points from Personal Connections (p. 23), a party-level rule
