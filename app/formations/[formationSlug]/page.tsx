import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getFormationTree } from '@/lib/formations/get-formation-tree'
import { createFormationCheckout } from '../checkout-actions'

const ICONS: Record<string, string> = {
  video: '▶',
  exercice: '✎',
  quiz: '?',
  telechargement: '↓',
  texte: '≡',
}

export default async function FormationDetailPage({
  params,
}: {
  params: Promise<{ formationSlug: string }>
}) {
  const { formationSlug } = await params
  const formation = await getFormationTree(formationSlug)

  if (!formation) notFound()

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-2 text-2xl font-semibold">{formation.titre}</h1>
      {formation.description && (
        <p className="mb-6 text-gray-600">{formation.description}</p>
      )}

      {formation.is_premium && !formation.has_access && (
        <div className="mb-6 flex flex-col gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p>
            Cette formation est premium. Les leçons marquées « aperçu » sont
            accessibles gratuitement ; le reste nécessite un accès.
          </p>
          <form action={createFormationCheckout.bind(null, formation.slug)}>
            <button
              type="submit"
              className="rounded-md bg-moss-700 px-4 py-2 text-sm text-white transition hover:bg-moss-800"
            >
              Débloquer l&apos;accès
            </button>
          </form>
        </div>
      )}

      <div className="flex flex-col gap-8">
        {formation.modules.map((module, mi) => (
          <section key={module.id}>
            <h2 className="mb-3 text-lg font-medium">
              Module {mi + 1} — {module.titre}
            </h2>

            <div className="flex flex-col gap-4">
              {module.chapitres.map((chapitre) => (
                <div key={chapitre.id}>
                  <h3 className="mb-2 text-sm font-semibold text-gray-500">
                    {chapitre.titre}
                  </h3>
                  <ul className="flex flex-col gap-1">
                    {chapitre.lecons.map((lecon) => (
                      <li key={lecon.id}>
                        {lecon.is_unlocked ? (
                          <Link
                            href={`/formations/${formation.slug}/lecons/${lecon.id}`}
                            className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm hover:border-moss-300 hover:bg-moss-50/40"
                          >
                            <span className="flex items-center gap-2">
                              <span aria-hidden>{ICONS[lecon.type]}</span>
                              {lecon.titre}
                            </span>
                            {lecon.is_completed && (
                              <span className="text-moss-600" aria-label="Terminée">
                                ✓
                              </span>
                            )}
                          </Link>
                        ) : (
                          <div className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-400">
                            <span className="flex items-center gap-2">
                              <span aria-hidden>🔒</span>
                              {lecon.titre}
                            </span>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
