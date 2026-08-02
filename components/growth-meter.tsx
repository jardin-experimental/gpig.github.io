const STAGES = [
  'Amateur scientifique',
  'Expérimentateur',
  'Chercheur',
  'Inventeur',
  'Génie'
] as const;

function StageIcon({
  stage,
  active,
  reached,
}: {
  stage: number
  active: boolean
  reached: boolean
}) {
  const color = reached ? 'text-moss-700' : 'text-line'
  const className = `h-6 w-6 ${color} ${active ? 'scale-110' : ''} transition-transform`

  switch (stage) {
    // Amateur scientifique — Loupe
    case 0:
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          aria-hidden
        >
          <circle cx="10.5" cy="10.5" r="4.5" />
          <path d="M14 14l4 4" strokeLinecap="round" />
          {/* <path d="M10.5 8.5v4M8.5 10.5h4" strokeLinecap="round" /> */}
        </svg>
      )

    // Expérimentateur — Erlenmeyer
    case 1:
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          aria-hidden
        >
          <path d="M10 3h4" strokeLinecap="round" />
          <path d="M12 3v5l4.5 7.2A2 2 0 0 1 14.8 19H9.2a2 2 0 0 1-1.7-3.8L12 8" strokeLinejoin="round" />
          <path d="M9.5 13h5M10.5 15.5h3" strokeLinecap="round" />
        </svg>
      )

    // Chercheur — Microscope
    case 2:
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          aria-hidden
        >
          <path d="M8 20h9" strokeLinecap="round" />
          <path d="M12 6l3 3" strokeLinecap="round" />
          <path d="M11 5l4 4-2 2-4-4z" strokeLinejoin="round" />
          <path d="M13 11v3a4 4 0 0 0 4 4" strokeLinecap="round" />
          <path d="M7 20a5 5 0 0 0 5-5" strokeLinecap="round" />
          <path d="M6 20h12" strokeLinecap="round" />
        </svg>
      )

    // Inventeur — Ampoule
    case 3:
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          aria-hidden
        >
          <path d="M12 4a5 5 0 0 1 3.5 8.6c-.8.8-1.2 1.5-1.4 2.4h-4.2c-.2-.9-.6-1.6-1.4-2.4A5 5 0 0 1 12 4Z" />
          <path d="M10 18h4M10.5 20h3" strokeLinecap="round" />
          <circle cx="18" cy="8" r="2" />
          <path d="M18 5.2v1M18 9.8v1M15.2 8h1M19.8 8h1" strokeLinecap="round" />
        </svg>
      )

    // Génie — Étoile
    default:
      return (
        <svg
          viewBox="0 0 24 24"
          className={className}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          aria-hidden
        >
          <path
            d="M12 3.5l2.3 5 5.5.6-4.1 3.8 1.2 5.3L12 15.9 7.1 18.2l1.2-5.3-4.1-3.8 5.5-.6L12 3.5Z"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="11.5" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      )
  }
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
            <StageIcon
              stage={i}
              active={i === stageIndex}
              reached={i <= stageIndex}
            />
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
