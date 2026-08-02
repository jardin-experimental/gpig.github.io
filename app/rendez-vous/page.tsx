import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { buyConsultationPack10h } from './actions'
import { SlotRow } from './slot-row'
import { MyBookingRow } from './my-booking-row'

export default async function RendezVousPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/rendez-vous')
  }

  const [{ data: heuresDisponibles }, { data: creneauxLibres }, { data: mesRdv }] =
    await Promise.all([
      supabase.rpc('mes_heures_consultation_disponibles'),
      supabase
        .from('consultation_slots')
        .select('id, start_at, end_at, statut, hold_expires_at')
        .gt('start_at', new Date().toISOString())
        .order('start_at', { ascending: true })
        .limit(100),
      supabase
        .from('consultation_slots')
        .select('id, start_at, end_at, zoom_join_url, source')
        .eq('user_id', user.id)
        .eq('statut', 'reservee')
        .gt('start_at', new Date().toISOString())
        .order('start_at', { ascending: true }),
    ])

  const disponibles = (creneauxLibres ?? []).filter(
    (s) => s.statut === 'libre' || (s.statut === 'en_attente_paiement' && s.hold_expires_at && new Date(s.hold_expires_at) < new Date())
  )

  // Regroupement par jour pour l'affichage du planning
  const parJour = new Map<string, typeof disponibles>()
  for (const slot of disponibles) {
    const jour = new Date(slot.start_at).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
    parJour.set(jour, [...(parJour.get(jour) ?? []), slot])
  }

  const solde = heuresDisponibles ?? 0

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-wide text-moss-700">Consultation</p>
        <h1 className="mt-1 font-display text-2xl text-ink">
          Réserver un appel vidéo avec le scientifique
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Chaque créneau dure 1h et se déroule sur Zoom. Le lien de connexion t&apos;est
          communiqué dès la réservation confirmée.
        </p>
      </header>

      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-line bg-white/60 p-5">
          <p className="font-medium text-ink">À l&apos;unité</p>
          <p className="mt-1 text-2xl font-display text-ink">85 €</p>
          <p className="mt-1 text-xs text-ink-soft">1 appel d&apos;1h, choisi ci-dessous.</p>
        </div>

        <div className="rounded-lg border border-moss-600 bg-moss-50/60 p-5">
          <p className="font-medium text-ink">Forfait 10 appels</p>
          <p className="mt-1 text-2xl font-display text-ink">800 €</p>
          <p className="mt-1 text-xs text-ink-soft">
            10h à consommer librement sur les créneaux disponibles. Tu as actuellement{' '}
            <strong>{solde}h</strong> de forfait.
          </p>
          <form action={buyConsultationPack10h} className="mt-3">
            <button
              type="submit"
              className="rounded-md bg-moss-700 px-4 py-2 text-sm text-white transition hover:bg-moss-800"
            >
              Acheter le forfait 10h
            </button>
          </form>
        </div>
      </section>

      {mesRdv && mesRdv.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 font-display text-lg text-ink">Mes prochains rendez-vous</h2>
          <div className="flex flex-col gap-2">
            {mesRdv.map((slot) => (
              <MyBookingRow key={slot.id} slot={slot} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-display text-lg text-ink">Créneaux disponibles</h2>

        {parJour.size === 0 && (
          <p className="text-sm text-ink-soft">
            Aucun créneau ouvert pour le moment — reviens un peu plus tard.
          </p>
        )}

        <div className="flex flex-col gap-5">
          {Array.from(parJour.entries()).map(([jour, slots]) => (
            <div key={jour}>
              <p className="mb-2 text-xs uppercase tracking-wide text-moss-700">{jour}</p>
              <div className="flex flex-col gap-2">
                {slots.map((slot) => (
                  <SlotRow key={slot.id} slot={slot} soldeHeures={solde} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
