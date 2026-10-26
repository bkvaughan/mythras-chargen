import type { SkillRow } from '../../engine/skills.ts'

/** Every skill the character has, with the points from each stage. */
export function SkillTable({ skills }: { skills: SkillRow[] }) {
  return (
    <table className="table" aria-label="All skills">
      <thead>
        <tr>
          <th>Skill</th>
          <th className="num">Base</th>
          <th className="num">Culture</th>
          <th className="num">Career</th>
          <th className="num">Bonus</th>
          <th className="num">Total</th>
        </tr>
      </thead>
      <tbody>
        {skills.map((r) => (
          <tr key={r.key}>
            <td>{r.key}</td>
            <td className="num">{r.base}</td>
            <td className="num">{r.culture || ''}</td>
            <td className="num">{r.career || ''}</td>
            <td className="num">{r.bonus || ''}</td>
            <td className="num">{r.total}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
