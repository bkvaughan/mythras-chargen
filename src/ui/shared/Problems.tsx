import type { StepStatus } from '../../state/derive.ts'

/** What is still needed to complete a step, in plain words. */
export function Problems({ status }: { status: StepStatus }) {
  if (status.complete) {
    return (
      <p className="complete" role="status">
        This step is complete.
      </p>
    )
  }
  return (
    <div className="problems" role="status">
      <strong>To complete this step:</strong>
      <ul>
        {status.problems.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>
    </div>
  )
}
