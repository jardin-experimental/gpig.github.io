import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PACKS_ATOMES } from './packs-atomes'
import { buyAtomesPack } from './actions'

export default async function PacksAtomesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/boutique/packs-atomes')
  }

  const { data: solde } = await supabase.rpc('mes_atomes_disponibles')

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-wide text-moss-700">Boutique</p>
        <h1 className="mt-1 font-display text-2xl text-ink">Packs d&apos;Atomes</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Les Atomes servent à débloquer les objets numériques de la boutique.
          Tu as actuellement <strong>{solde ?? 0}</strong> Atomes.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {PACKS_ATOMES.map((pack) => (
          <div
            key={pack.id}
            className="flex flex-col justify-between rounded-lg border border-line bg-white/60 p-5"
          >
            <div>
              <p className="font-medium text-ink">{pack.nom}</p>
              <p className="mt-1 font-display text-2xl text-ink">
                {(pack.prixCentimes / 100).toFixed(2)} €
              </p>
              <p className="mt-1 text-xs text-ink-soft">{pack.atomes} Atomes</p>
            </div>

            <form action={buyAtomesPack.bind(null, pack.id)} className="mt-4">
              <button
                type="submit"
                className="w-full rounded-md bg-moss-700 px-4 py-2 text-sm text-white transition hover:bg-moss-800"
              >
                Acheter
              </button>
            </form>
          </div>
        ))}
      </section>
    </main>
  )
}
