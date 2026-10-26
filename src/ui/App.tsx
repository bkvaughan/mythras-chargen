import { useEffect, useRef, useState, type ComponentType } from 'react'
import type { StepId } from '../state/derive.ts'
import { useCharacter } from '../state/useCharacter.ts'
import { Problems } from './shared/Problems.tsx'
import { AttributesStep } from './steps/AttributesStep.tsx'
import { AgeingStep } from './steps/AgeingStep.tsx'
import { BackgroundStep } from './steps/BackgroundStep.tsx'
import { BonusStep } from './steps/BonusStep.tsx'
import { CareerStep } from './steps/CareerStep.tsx'
import { CharacteristicsStep } from './steps/CharacteristicsStep.tsx'
import { ConceptStep } from './steps/ConceptStep.tsx'
import { CultureStep } from './steps/CultureStep.tsx'
import type { StepProps } from './steps/types.ts'
import { SummaryPanel } from './SummaryPanel.tsx'
import { FileControls } from './FileControls.tsx'
import { CharacterSheet } from './sheet/CharacterSheet.tsx'
import { isReachable, loadView, saveView, VIEW_LABELS, visibleViews, type View } from './wizard.ts'

const STEP_COMPONENTS: Record<StepId, ComponentType<StepProps>> = {
  concept: ConceptStep,
  characteristics: CharacteristicsStep,
  attributes: AttributesStep,
  culture: CultureStep,
  background: BackgroundStep,
  career: CareerStep,
  bonus: BonusStep,
  ageing: AgeingStep,
}

export default function App() {
  const { character, derived, dispatch } = useCharacter()
  const [current, setCurrent] = useState<View>(() => loadView())
  const views = visibleViews(derived)
  // A view that no longer applies (Ageing after the age is lowered) or cannot be opened yet falls back to the first step.
  const view = views.includes(current) && isReachable(current, derived) ? current : views[0]
  useEffect(() => saveView(view), [view])

  // On a change of view, move focus to the new heading so keyboard and screen reader users start there.
  const mainRef = useRef<HTMLElement>(null)
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    const heading = mainRef.current?.querySelector('h2')
    if (!heading) return
    heading.tabIndex = -1
    heading.focus()
  }, [view])
  const index = views.indexOf(view)
  const next = views[index + 1]

  return (
    <>
      <header className="app-header">
        <h1>Mythras Character Generator</h1>
        <FileControls character={character} dispatch={dispatch} onGenerated={() => setCurrent('sheet')} />
      </header>
      <div className={`layout${view === 'sheet' ? ' sheet-view' : ''}`}>
        <nav className="panel step-nav" aria-label="Creation steps">
          <ol className="step-list">
            {views.map((v, i) => {
              const done = v !== 'sheet' && derived.steps[v].complete
              return (
                <li key={v}>
                  <button
                    type="button"
                    aria-current={v === view ? 'step' : undefined}
                    disabled={!isReachable(v, derived)}
                    onClick={() => setCurrent(v)}
                  >
                    <span className="step-label">
                      {i + 1}. {VIEW_LABELS[v]}
                    </span>
                    <span className={`step-mark${done ? ' done' : ''}`}>{done ? 'Done' : ''}</span>
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>

        <main className="panel" ref={mainRef}>
          {view === 'sheet' ? (
            <>
              <div className="sheet-toolbar">
                <h2>Character Sheet</h2>
                <button type="button" className="button" onClick={() => window.print()}>
                  Print or save as PDF
                </button>
              </div>
              <CharacterSheet character={character} derived={derived} />
            </>
          ) : (
            <>
              <StepView step={view} character={character} derived={derived} dispatch={dispatch} />
              <Problems status={derived.steps[view]} />
            </>
          )}
          <div className="step-footer">
            <button type="button" className="button secondary" disabled={index === 0} onClick={() => setCurrent(views[index - 1])}>
              Back
            </button>
            {next && (
              <button type="button" className="button" disabled={!isReachable(next, derived)} onClick={() => setCurrent(next)}>
                Next: {VIEW_LABELS[next]}
              </button>
            )}
          </div>
        </main>

        {view !== 'sheet' && <SummaryPanel character={character} derived={derived} step={view} />}
      </div>
    </>
  )
}

function StepView({ step, ...props }: StepProps & { step: StepId }) {
  const Step = STEP_COMPONENTS[step]
  return <Step {...props} />
}
