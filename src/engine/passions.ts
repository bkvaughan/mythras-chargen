import { PASSION_BASE, PASSION_OBJECTS } from '../data/passions.ts'
import type { Characteristics, PassionChoice } from './types.ts'

/** Starting value per p. 24 (R13); the subject's POW and CHA default to the character's own. */
export function passionValue(passion: PassionChoice, c: Characteristics): number | null {
  if (!passion.object) return null
  const subject = { ...c, POW: passion.subjectPOW ?? c.POW, CHA: passion.subjectCHA ?? c.CHA }
  return PASSION_OBJECTS[passion.object].terms.reduce(
    (sum, t) => sum + (t.of === 'character' ? c : subject)[t.characteristic],
    PASSION_BASE,
  )
}
