import { useState, type InputHTMLAttributes } from 'react'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  value: number | null
  onChange: (value: number | null) => void
}

/**
 * A whole-number input. While focused it keeps the typed text, so a box can be
 * cleared and retyped even when the stored value cannot be empty.
 */
export function NumberInput({ value, onChange, onBlur, ...rest }: Props) {
  const [draft, setDraft] = useState<string | null>(null)
  return (
    <input
      type="number"
      inputMode="numeric"
      step={1}
      value={draft ?? value ?? ''}
      onChange={(e) => {
        setDraft(e.target.value)
        onChange(e.target.value === '' ? null : Math.trunc(Number(e.target.value)))
      }}
      onBlur={(e) => {
        setDraft(null)
        onBlur?.(e)
      }}
      {...rest}
    />
  )
}
