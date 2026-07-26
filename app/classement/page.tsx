import { createClient } from '@/lib/supabase/server'

export default async function ClassementPage() {
  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('username, display_name, xp, level')
    .order('xp', { ascending: false })
    .limit(50)

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-8 font-display text-2xl text-ink">Classement</h1>

      <ol className="flex flex-col gap-1">
        {(profiles ?? []).map((p, i) => (
          <li
            key={p.username}
            className="flex items-center justify-between rounded-md border border-line bg-white/60 px-4 py-3 text-sm"
          >
            <span className="flex items-center gap-3">
              <span className="font-mono text-ink-soft">{String(i + 1).padStart(2, '0')}</span>
              <span className="text-ink">{p.display_name ?? p.username}</span>
            </span>
            <span className="specimen-tag rounded bg-moss-50 px-2 py-1 font-mono text-xs text-moss-700">
              Niv. {p.level} · {p.xp} XP
            </span>
          </li>
        ))}

        {(profiles ?? []).length === 0 && (
          <p className="text-sm text-ink-soft">Aucun membre pour le moment.</p>
        )}
      </ol>
    </main>
  )
}
