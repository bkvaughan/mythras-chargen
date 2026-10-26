import { expect, test } from 'vitest'

// CLAUDE.md: the engine is pure TypeScript with no React imports.
const sources = import.meta.glob('./*.ts', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

test('engine modules do not import React', () => {
  expect(Object.keys(sources).length).toBeGreaterThan(5)
  for (const [file, source] of Object.entries(sources)) {
    expect(source, file).not.toMatch(/from ['"]react/)
  }
})
