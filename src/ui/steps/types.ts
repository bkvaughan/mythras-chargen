import type { Dispatch } from 'react'
import type { Character } from '../../state/character.ts'
import type { DerivedCharacter } from '../../state/derive.ts'
import type { Action } from '../../state/reducer.ts'

export interface StepProps {
  character: Character
  derived: DerivedCharacter
  dispatch: Dispatch<Action>
}
