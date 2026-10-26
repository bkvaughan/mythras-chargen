import { useState, type Dispatch } from 'react'
import type { Character } from '../state/character.ts'
import { downloadCharacter, parseCharacter } from '../state/persistence.ts'
import type { Action } from '../state/reducer.ts'

/** Export, import and new character. Other characters live as exported JSON files. */
export function FileControls({ character, dispatch }: { character: Character; dispatch: Dispatch<Action> }) {
  const [error, setError] = useState<string | null>(null)

  const importFile = async (file: File) => {
    const result = parseCharacter(await file.text())
    setError(result.ok ? null : result.error)
    if (result.ok) dispatch({ type: 'load', character: result.character })
  }

  return (
    <div className="file-controls">
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
