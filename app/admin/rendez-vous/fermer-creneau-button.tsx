'use client'

import { useTransition } from 'react'
import { fermerCreneau } from './actions'

export function FermerCreneauButton({ slotId }: { slotId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(() => fermerCreneau(slotId))}
      disabled={isPending}
      className="text-xs text-red-600 underline decoration-dotted disabled:opacity-50"
    >
      {isPending ? '…' : 'Fermer'}
    </button>
  )
}
