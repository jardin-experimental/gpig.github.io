import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function FormationsCataloguePage() {
  const supabase = await createClient()

  const { data: formations } = await supabase
    .from('formations')
    .select('slug, titre, description, image_url, is_premium, prix_centimes')
    .eq('is_published', true)

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-8 text-2xl font-semibold">Formations</h1>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(formations ?? []).map((f) => (
          <Link
            key={f.slug}
            href={`/formations/${f.slug}`}
            className="rounded-lg border border-gray-200 p-5 transition hover:border-moss-300 hover:shadow-sm"
          >
            <h2 className="mb-1 font-medium">{f.titre}</h2>
            {f.description && (
              <p className="mb-3 line-clamp-2 text-sm text-gray-600">{f.description}</p>
            )}
            <span className="text-xs font-medium text-moss-700">
              {f.is_premium ? `${((f.prix_centimes ?? 0) / 100).toFixed(2)} €` : 'Gratuit'}
            </span>
          </Link>
        ))}

        {(formations ?? []).length === 0 && (
          <p className="text-sm text-gray-500">Aucune formation publiée pour le moment.</p>
        )}
      </div>
    </main>
  )
}
