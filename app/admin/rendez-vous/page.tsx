import { createClient } from '@/lib/supabase/server'
import { OuvrirCreneauForm } from './ouvrir-creneau-form'
import { FermerCreneauButton } from './fermer-creneau-button'

export default async function AdminRendezVousPage() {
  const supabase = await createClient()

  const { data: slots } = await supabase
    .from('consultation_slots')
    .select('id, start_at, statut, user_id, source')
    .neq('statut', 'annulee')
    .gt('start_at', new Date().toISOString())
    .order('start_at', { ascending: true })
    .limit(200)

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-6 font-display text-2xl text-ink">Planning des consultations</h1>

      <section className="mb-8 rounded-lg border border-line bg-white/60 p-5">
        <h2 className="mb-3 font-display text-lg text-ink">Ouvrir un créneau</h2>
        <OuvrirCreneauForm />
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg text-ink">Créneaux à venir</h2>
        <div className="flex flex-col gap-2">
          {(slots ?? []).map((slot) => (
            <div
              key={slot.id}
              className="flex items-center justify-between rounded-md border border-line bg-white/60 px-4 py-3 text-sm"
            >
              <span className="text-ink">
                {new Date(slot.start_at).toLocaleString('fr-FR', {
                  dateStyle: 'long',
                  timeStyle: 'short',
                })}
              </span>
              <span className="flex items-center gap-3">
                <span
                  className={`specimen-tag rounded px-2 py-1 font-mono text-xs ${
                    slot.statut === 'reservee'
                      ? 'bg-moss-50 text-moss-700'
                      : slot.statut === 'en_attente_paiement'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-paper-alt text-ink-soft'
                  }`}
                >
                  {slot.statut === 'reservee'
                    ? `Réservé${slot.source === 'credit_pack' ? ' (forfait)' : ''}`
                    : slot.statut === 'en_attente_paiement'
                      ? 'Paiement en cours'
                      : 'Libre'}
                </span>
                <FermerCreneauButton slotId={slot.id} />
              </span>
            </div>
          ))}

          {(slots ?? []).length === 0 && (
            <p className="text-sm text-ink-soft">Aucun créneau ouvert pour le moment.</p>
          )}
        </div>
      </section>
    </main>
  )
}
