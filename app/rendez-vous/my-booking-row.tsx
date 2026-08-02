'use client'

import { useActionState } from 'react'
import { cancelConsultationSlot } from './actions'

type Booking = {
  id: string
  start_at: string
  end_at: string
  zoom_join_url: string | null
  source: string | null
}

export function MyBookingRow({ slot }: { slot: Booking }) {
  const [state, formAction, isPending] = useActionState(
    cancelConsultationSlot.bind(null, slot.id),
    { error: null }
  )

  const annulable = new Date(slot.start_at).getTime() - Date.now() > 24 * 60 * 60 * 1000

  return (
    <div className="rounded-md border border-line bg-white/60 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-ink">
            {new Date(slot.start_at).toLocaleString('fr-FR', {
              dateStyle: 'long',
              timeStyle: 'short',
            })}
          </p>
          {slot.source === 'credit_pack' && (
            <p className="text-xs text-ink-soft">Payé via le forfait 10h</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {slot.zoom_join_url ? (
            <a
              href={slot.zoom_join_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-moss-700 px-3 py-1.5 text-xs text-white transition hover:bg-moss-800"
            >
              Rejoindre sur Zoom
            </a>
          ) : (
            <span className="text-xs text-ink-soft">Lien Zoom en préparation…</span>
          )}

          {annulable ? (
            <form action={formAction}>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-md border border-line px-3 py-1.5 text-xs text-ink-soft transition hover:bg-paper-alt disabled:opacity-50"
              >
                {isPending ? 'Annulation…' : 'Annuler'}
              </button>
            </form>
          ) : (
            <span className="text-xs text-ink-soft" title="Annulation possible jusqu'à 24h avant">
              Non annulable
            </span>
          )}
        </div>
      </div>

      {state.error && <p className="mt-2 text-xs text-red-600">{state.error}</p>}
    </div>
  )
}
