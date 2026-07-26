'use client'

import { useActionState } from 'react'
import { redeemGiftCard } from './actions'

export default function BonCadeauPage() {
  const [state, formAction, isPending] = useActionState(redeemGiftCard, {
    error: null,
    success: null,
  })

  return (
    <main className="mx-auto max-w-sm px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Utiliser un bon cadeau</h1>

      <form action={formAction} className="flex flex-col gap-4">
        <input
          name="code"
          type="text"
          required
          placeholder="Ex. GPIG-XXXX-XXXX"
          className="w-full rounded-md border border-gray-300 px-3 py-2 uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-moss-600"
        />

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state.success && <p className="text-sm text-moss-700">{state.success}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-moss-700 px-4 py-2 text-sm text-white transition hover:bg-moss-800 disabled:opacity-50"
        >
          {isPending ? 'Validation…' : 'Valider le code'}
        </button>
      </form>
    </main>
  )
}
