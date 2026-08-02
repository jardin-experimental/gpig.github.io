'use client'

import { useActionState } from 'react'
import { ouvrirCreneau } from './actions'

export function OuvrirCreneauForm() {
  const [state, formAction, isPending] = useActionState(ouvrirCreneau, {
    error: null,
    success: null,
  })

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor="start_at" className="mb-1 block text-sm font-medium text-ink">
          Date et heure de début
        </label>
        <input
          id="start_at"
          name="start_at"
          type="datetime-local"
          required
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-moss-600"
        />
        <p className="mt-1 text-xs text-ink-soft">Le créneau dure 1h.</p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-moss-700 px-4 py-2 text-sm text-white transition hover:bg-moss-800 disabled:opacity-50"
      >
        {isPending ? 'Ouverture…' : 'Ouvrir le créneau'}
      </button>

      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="w-full text-sm text-moss-700">{state.success}</p>}
    </form>
  )
}
