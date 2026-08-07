'use client'

import type { VideoInteraction } from '@/lib/video-interactions/types'
// Remplace par ton composant de quiz existant (Bloc 3) — il appelle déjà
// submit_quiz_attempt côté serveur, donc l'XP et le déverrouillage de la
// leçon suivante suivent la même mécanique qu'un quiz classique.
// import { QuizPlayer } from '@/components/quiz/quiz-player'

export function VideoInteractionOverlay({
  interaction,
  onComplete,
  onReplay,
}: {
  interaction: VideoInteraction
  onComplete: () => void
  onReplay: () => void
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-line bg-white p-6 shadow-lg">
        {interaction.type === 'quiz' && interaction.quiz_id && (
          <div className="space-y-3">
            {interaction.titre && (
              <h3 className="font-display text-lg text-ink">{interaction.titre}</h3>
            )}
            {/* <QuizPlayer quizId={interaction.quiz_id} onSubmitted={onComplete} /> */}
            <p className="text-xs text-ink-soft">
              À brancher : ton composant de quiz existant
              (quiz_id: {interaction.quiz_id})
            </p>

            <button
              onClick={onReplay}
              className="text-sm text-ink-soft hover:text-moss-700"
            >
              ↺ Revoir la séquence
            </button>
          </div>
        )}

        {interaction.type === 'texte' && (
          <div className="space-y-4">
            {interaction.titre && (
              <h3 className="font-display text-lg text-ink">{interaction.titre}</h3>
            )}
            {interaction.contenu && (
              <p className="text-sm leading-relaxed text-ink-soft">
                {interaction.contenu}
              </p>
            )}
            <div className="flex items-center gap-4">
              <button
                onClick={onComplete}
                className="rounded-full bg-moss-700 px-4 py-1.5 text-sm text-white hover:bg-moss-800"
              >
                Continuer
              </button>
              <button
                onClick={onReplay}
                className="text-sm text-ink-soft hover:text-moss-700"
              >
                ↺ Revoir
              </button>
            </div>
          </div>
        )}

        {interaction.type === 'image' && interaction.image_url && (
          <div className="space-y-4">
            {interaction.titre && (
              <h3 className="font-display text-lg text-ink">{interaction.titre}</h3>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={interaction.image_url}
              alt={interaction.titre ?? ''}
              className="rounded-lg border border-line"
            />
            <div className="flex items-center gap-4">
              <button
                onClick={onComplete}
                className="rounded-full bg-moss-700 px-4 py-1.5 text-sm text-white hover:bg-moss-800"
              >
                Continuer
              </button>
              <button
                onClick={onReplay}
                className="text-sm text-ink-soft hover:text-moss-700"
              >
                ↺ Revoir
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}