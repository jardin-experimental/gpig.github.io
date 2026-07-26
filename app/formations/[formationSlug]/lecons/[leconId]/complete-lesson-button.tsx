'use client'

import { useState, useTransition } from 'react'
import { completeLesson } from '../../../actions'

export function CompleteLessonButton({
  leconId,
  formationSlug,
  alreadyCompleted,
}: {
  leconId: string
  formationSlug: string
  alreadyCompleted: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<string | null>(null)
  const [done, setDone] = useState(alreadyCompleted)

  function handleClick() {
    startTransition(async () => {
      const { error, result } = await completeLesson(leconId, formationSlug)
      if (error) {
        setFeedback("Une erreur est survenue, réessayez.")
        return
      }
      setDone(true)
      if (result && result.xp_gagne > 0) {
        setFeedback(
          result.level_up
            ? `+${result.xp_gagne} XP — niveau ${result.niveau} atteint !`
            : `+${result.xp_gagne} XP`
        )
      }
    })
  }

  if (done) {
    return <p className="text-sm font-medium text-moss-700">✓ Leçon terminée {feedback}</p>
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="rounded-md bg-moss-700 px-4 py-2 text-sm text-white transition hover:bg-moss-800 disabled:opacity-50"
      >
        {isPending ? 'Validation…' : 'Marquer comme terminée'}
      </button>
      {feedback && <span className="text-sm text-gray-600">{feedback}</span>}
    </div>
  )
}
