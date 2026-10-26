# Mythras Character Generator

A step-by-step character generator for the Mythras RPG core rules (Revision 3, 2018). It walks through the book's creation order (Concept, Characteristics, Attributes, Culture, Background, Career, Bonus Skills and, from age 40, Ageing), enforces the point-allocation rules, and ends on a printable two-page character sheet. Every random table can be rolled or chosen. Quick-generate builds a complete random character to edit.

The character in progress is saved in the browser. Export and Import move characters in and out as JSON files.

v1 covers the core rules for humans only: no equipment or magic steps, no supplements, no optional rules. Interpretations of unclear rules are listed under Rules Readings in `CLAUDE.md`.

## Commands

```
npm install
npx playwright install chromium   # once, for end-to-end tests

npm run dev         # development server
npm run build       # production build into dist/
npm run preview     # serve the production build
npm test            # unit and component tests (Vitest)
npm run test:e2e    # end-to-end tests (Playwright)
npm run lint        # oxlint
npm run typecheck   # tsc
```

## Deployment

`.github/workflows/deploy.yml` checks, builds and publishes `dist/` to GitHub Pages on every push to `main`. In the repository settings, set Pages to deploy from GitHub Actions.

## Copyright

Mythras is copyright The Design Mechanism. This is an unofficial fan tool. It uses the rules' tables and numbers, paraphrases prose entries in its own words, and cites the book's pages so players can look the rules up.
