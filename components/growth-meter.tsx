const STAGES = ['Graine', 'Pousse', 'Jeune plant', 'Floraison', 'Arbre'] as const

function StageIcon({ active, reached }: { active: boolean; reached: boolean }) {
  const color = reached ? 'text-moss-700' : 'text-line'
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-6 w-6 ${color} ${active ? 'scale-110' : ''} transition-transform`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      aria-hidden
    >
      <path d="M12 21c0-6 0-11 0-14" strokeLinecap="round" />
      <path d="M12 10c0-3 2.5-5 6-5 0 3.5-2 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 13c0-2.5-2-4.2-5-4.2 0 3 1.8 5 5 5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="21.4" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

/**
 * Jauge de progression signature : remplace la barre générique par une
 * représentation en stades de croissance (graine → arbre), cohérente avec
 * l'identité "jardin expérimental" de GPIG.
 */
export function GrowthMeter({
  niveau,
  xp,
  xpProchainNiveau,
}: {
  niveau: number
  xp: number
  xpProchainNiveau: number
}) {
  const stageIndex = Math.min(Math.floor((niveau - 1) / 2), STAGES.length - 1)
  const progressDansStage = niveau % 2 === 0 ? 0.5 : 0

  return (
    <div>
      <div className="flex items-center justify-between">
        {STAGES.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col items-center gap-1">
            <StageIcon active={i === stageIndex} reached={i <= stageIndex} />
            <span
              className={`text-xs ${i === stageIndex ? 'font-medium text-ink' : 'text-ink-soft'}`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-paper-alt">
        <div
          className="h-1.5 rounded-full bg-moss-700 transition-all"
          style={{
            width: `${((stageIndex + progressDansStage) / (STAGES.length - 1)) * 100}%`,
          }}
        />
      </div>

      <p className="mt-2 font-mono text-xs text-ink-soft">
        Niveau {niveau} — {xp} / {xpProchainNiveau} XP
      </p>
    </div>
  )
}
