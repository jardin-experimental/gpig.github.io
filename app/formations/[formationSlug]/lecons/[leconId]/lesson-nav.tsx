import Link from 'next/link'
import type { LessonNavigation } from '@/lib/formations/get-formation-tree'

export function LessonNav({
  formationSlug,
  navigation,
}: {
  formationSlug: string
  navigation: LessonNavigation
}) {
  const { previous, next } = navigation

  if (!previous && !next) return null

  return (
    <nav className="mt-10 flex items-center justify-between border-t border-line pt-6">
      {previous ? (
        <Link
          href={`/formations/${formationSlug}/lecons/${previous.id}`}
          className="flex items-center gap-1.5 text-sm text-ink-soft hover:text-moss-700"
        >
          <span aria-hidden>←</span> Précédent
        </Link>
      ) : (
        <Link
          href={`/formations/${formationSlug}`}
          className="flex items-center gap-1.5 text-sm text-ink-soft hover:text-moss-700"
        >
          <span aria-hidden>←</span> Retour à la formation
        </Link>
      )}

      {next &&
        (next.is_unlocked ? (
          <Link
            href={`/formations/${formationSlug}/lecons/${next.id}`}
            className="flex items-center gap-1.5 text-sm font-medium text-moss-700 hover:text-moss-800"
          >
            Suivant <span aria-hidden>→</span>
          </Link>
        ) : (
          <span
            className="flex items-center gap-1.5 text-sm text-ink-soft/50"
            title="Terminez cette leçon pour débloquer la suivante"
          >
            <span aria-hidden>🔒</span> Suivant
          </span>
        ))}
    </nav>
  )
}
