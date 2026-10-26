# Rules data verification

Every table in `src/data/` was transcribed from the rendered pages of `core-rules.pdf` (not from the extracted text). Pages are the `core-rules_clean.txt` markers, one higher than the book's printed page numbers.

Status: **Transcribed** = checked against the PDF by Claude; **Signed off** = spot-checked by Brandon.

| Table | Module | Pages | Status |
|---|---|---|---|
| Characteristic dice, points build | `characteristics.ts` | 9, 36 | Signed off |
| Action Points | `attributes.ts` | 9 | Signed off |
| Damage Modifier | `attributes.ts` | 10 | Signed off |
| Experience Modifier, Healing Rate | `attributes.ts` | 10 | Signed off |
| Height and Weight (SIZ 1-21, three frames) | `attributes.ts` | 10 | Signed off |
| Hit Points per Location | `attributes.ts` | 11 | Signed off |
| Luck Points, Magic Points, Movement | `attributes.ts` | 11-12 | Signed off |
| Hit location d20 ranges | `attributes.ts` | 36 (sheet) | Signed off |
| Standard Skills (22) | `skills.ts` | 12 | Signed off |
| Professional Skills (36) | `skills.ts` | 45-50 | Signed off |
| Sample Combat Styles | `combatStyles.ts` | 13 | Signed off |
| Combat Style Traits (26, paraphrased) | `combatStyles.ts` | 90 | Signed off |
| Cultures (4): skills, combat style names, Passions | `cultures.ts` | 15-18 | Signed off |
| Starting money | `cultures.ts` | 22 | Signed off |
| Background Events (paraphrased) | `backgroundEvents.ts` | 19-21 | Signed off |
| Passions table | `passions.ts` | 24 | Signed off |
| Marriage and children | `family.ts` | 24 | Signed off |
| Social Class by culture (resources paraphrased) | `socialClass.ts` | 25 | Signed off |
| Parents, Siblings, Extended Family, Reputation, Connections | `family.ts` | 26 | Signed off |
| Careers by culture | `cultures.ts` | 27 | Signed off |
| Careers (24) | `careers.ts` | 28-32 | Signed off |
| Age table | `age.ts` | 33 | Signed off |
| Difficulty Grades | `age.ts` | 39 | Signed off |
| Ageing bands and effects | `age.ts` | 72 | Signed off |

## Transcription notes

- Attribute tables end with an "each N further points" row. It is left out because human characteristics never exceed 18, so the last listed bracket already covers every human value (a test checks this).
- The career availability table on p. 27 is described as guidance, not a definitive list. The app treats it as the list of careers to offer.
- Career specialisations: fixed ones (Craft (Alchemy), Navigation (Underground)) are stored as `specialisation`; open ones with guidance (Lore (Specific Alchemical Speciality), Craft (Primary)) as `hint`, using the book's footnoted examples.
- Navigation (Underground) for Miners is the only specialisation on a skill that R7 does not list as specialised.
- Prose entries (background events, trait descriptions, social class resources, reputation and connections results) are our own one-line summaries, per CLAUDE.md Copyright.
- p. 89 says a combat style "may gain one or more traits"; R10 (confirmed) limits it to zero or one.

- Difficulty grades (p. 39) are stored as the change each grade makes, rounded up before it is applied (R22).
