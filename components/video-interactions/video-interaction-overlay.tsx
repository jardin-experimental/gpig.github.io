'use client'

import { createClient } from '@/lib/supabase/server'
import type { VideoInteraction } from '@/lib/video-interactions/use-video-interactions'

async function loadVideoInteractions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  leconId: string
): Promise<VideoInteraction[]> {          // <-- ajoute ça
  const { data } = await supabase
    .from('video_interactions')
    .select('id, timestamp_seconds, type, quiz_id, titre, contenu, image_url, pause_video')
    .eq('lecon_id', leconId)
    .order('timestamp_seconds')

  if (!data) return []                     // <-- corrige le return nu

  return data.flatMap((row): VideoInteraction[] => {
    if (row.type !== 'quiz' && row.type !== 'texte' && row.type !== 'image') {
      console.warn(`video_interactions: type inattendu "${row.type}" (id=${row.id})`)
      return []
    }
    return [{ ...row, type: row.type }]
  })
}

// Remplace par ton composant de quiz existant (Bloc 3) — il appelle déjà
// submit_quiz_attempt côté serveur, donc l'XP et le déverrouillage de la
// leçon suivante suivent la même mécanique qu'un quiz classique.
// import { QuizPlayer } from '@/components/quiz/quiz-player'

export function VideoInteractionOverlay({
  interaction,
  onComplete,
}: {
  interaction: VideoInteraction
  onComplete: () => void
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-line bg-paper p-6 text-ink shadow-xl">
        {interaction.type === 'quiz' && interaction.quiz_id && (
          <div className="space-y-3">
            {interaction.titre && (
              <h3 className="font-serif text-lg">{interaction.titre}</h3>
            )}
            {/* <QuizPlayer quizId={interaction.quiz_id} onSubmitted={onComplete} /> */}
            <p className="font-mono text-xs text-ink-soft">
              À brancher : ton composant de quiz existant
              (quiz_id: {interaction.quiz_id})
            </p>
          </div>
        )}

        {interaction.type === 'texte' && (
          <div className="space-y-4">
            {interaction.titre && (
              <h3 className="font-serif text-lg">{interaction.titre}</h3>
            )}
            {interaction.contenu && (
              <p className="text-sm leading-relaxed">{interaction.contenu}</p>
            )}
            <button
              onClick={onComplete}
              className="rounded-md bg-moss px-4 py-2 text-sm font-medium text-paper hover:opacity-90"
            >
              Continuer
            </button>
          </div>
        )}

        {interaction.type === 'image' && interaction.image_url && (
          <div className="space-y-4">
            {interaction.titre && (
              <h3 className="font-serif text-lg">{interaction.titre}</h3>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={interaction.image_url}
              alt={interaction.titre ?? ''}
              className="rounded-md"
            />
            <button
              onClick={onComplete}
              className="rounded-md bg-moss px-4 py-2 text-sm font-medium text-paper hover:opacity-90"
            >
              Continuer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}