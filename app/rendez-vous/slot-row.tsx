'use client'

import { useActionState } from 'react'
import { bookConsultationSlotWithPayment, bookConsultationSlotWithCredit } from './actions'

type Slot = {
  id: string
  start_at: string
  end_at: string
}

export function SlotRow({ slot, soldeHeures }: { slot: Slot; soldeHeures: number }) {
  const [state, formAction, isPending] = useActionState(
    bookConsultationSlotWithCredit.bind(null, slot.id),
    { error: null }
  )

  const heure = new Date(slot.start_at).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="rounded-md border border-line bg-white/60 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-sm text-ink">{heure}</span>

        <div className="flex items-center gap-2">
          {soldeHeures >= 1 && (
            <form action={formAction}>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-md border border-moss-600 px-3 py-1.5 text-xs text-moss-700 transition hover:bg-moss-50 disabled:opacity-50"
              >
                {isPending ? 'Réservation…' : 'Utiliser 1h du forfait'}
              </button>
            </form>
          )}

          <form action={bookConsultationSlotWithPayment.bind(null, slot.id)}>
            <button
              type="submit"
              className="rounded-md bg-moss-700 px-3 py-1.5 text-xs text-white transition hover:bg-moss-800"
            >
              Payer 85 € et réserver
            </button>
          </form>
        </div>
      </div>

      {state.error && <p className="mt-2 text-xs text-red-600">{state.error}</p>}
    </div>
  )
}
