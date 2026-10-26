import { useState, type Dispatch } from 'react'
import { newCharacter, type Character } from '../state/character.ts'
import { generateCharacter } from '../state/generate.ts'
import { downloadCharacter, parseCharacter, toJson } from '../state/persistence.ts'
import type { Action } from '../state/reducer.ts'

interface Props {
  character: Character
  dispatch: Dispatch<Action>
  /** Called after quick-generate, which lands on the character sheet. */
  onGenerated: () => void
}

/** Quick-generate, export, import and new character. Other characters live as exported JSON files. */
export function FileControls({ character, dispatch, onGenerated }: Props) {
  const [error, setError] = useState<string | null>(null)
  const isBlank = toJson(character) === toJson(newCharacter())

  const quickGenerate = () => {
    if (!isBlank && !window.confirm('Replace the current character with a random one? It is lost unless you have exported it.')) return
    dispatch({ type: 'load', character: generateCharacter(Math.random) })
    onGenerated()
  }

  const importFile = async (file: File) => {
    const result = parseCharacter(await file.text())
    setError(result.ok ? null : result.error)
    if (result.ok) dispatch({ type: 'load', character: result.character })
  }

  return (
    <div className="file-controls">
      <button type="button" className="button light" onClick={quickGenerate}>
        Quick-generate
      </button>
      <button type="button" className="button light" onClick={() => downloadCharacter(character)}>
        Export
      </button>
      <label className="button light">
        Import
        <input
          type="file"
          accept=".json,application/json"
          className="visually-hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) void importFile(file)
          }}
        />
      </label>
      <button
        type="button"
        className="button light"
        onClick={() => window.confirm('Start a new character? The current one is lost unless you have exported it.') && dispatch({ type: 'reset' })}
      >
        New character
      </button>
      {error && (
        <p className="import-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
