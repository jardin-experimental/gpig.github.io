import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CompleteLessonButton } from './complete-lesson-button'
import { QuizPlayer, type QuizData } from './quiz-player'
import { VideoPlayer } from '@/components/VideoPlayer'

async function loadQuiz(
  supabase: Awaited<ReturnType<typeof createClient>>,
  leconId: string
): Promise<QuizData | null> {
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('id, titre, description, temps_limite_secondes, note_passage_pourcentage')
    .eq('lecon_id', leconId)
    .single()

  if (!quiz) return null

  const { data: questions } = await supabase
    .from('questions')
    .select(
      `id, type, enonce, image_url, points, position,
       question_options ( id, contenu, image_url, position ),
       question_pairs ( id, gauche )`
    )
    .eq('quiz_id', quiz.id)
    .order('position')

  return {
    ...quiz,
    questions: (questions ?? []).map((q) => ({
      id: q.id,
      type: q.type,
      enonce: q.enonce,
      image_url: q.image_url,
      points: q.points,
      options: (q.question_options ?? []).sort((a, b) => a.position - b.position),
      paires_gauche: (q.question_pairs ?? []).map((p) => p.gauche),
    })),
  }
}

export default async function LeconPage({
  params,
}: {
  params: Promise<{ formationSlug: string; leconId: string }>
}) {
  const { formationSlug, leconId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(`/login?next=/formations/${formationSlug}`)

  const { data: lecon } = await supabase
    .from('lecons')
    .select('id, titre, type')
    .eq('id', leconId)
    .single()

  if (!lecon) notFound()

  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('lecon_id')
    .eq('user_id', user.id)
    .eq('lecon_id', leconId)
    .maybeSingle()

  if (lecon.type === 'quiz') {
    const quiz = await loadQuiz(supabase, leconId)

    if (!quiz) {
      return (
        <main className="mx-auto max-w-2xl px-6 py-10">
          <p className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            🔒 Ce quiz est verrouillé. Terminez la leçon précédente ou débloquez
            l&apos;accès à la formation.
          </p>
        </main>
      )
    }

    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="mb-6 text-2xl font-semibold">{quiz.titre}</h1>
        <QuizPlayer quiz={quiz} formationSlug={formationSlug} />
      </main>
    )
  }

  // RLS ne renverra une ligne ici que si is_lesson_unlocked() est vrai pour l'utilisateur courant
  const { data: content } = await supabase
    .from('lecon_contents')
    .select('video_url, contenu_texte, ressources')
    .eq('lecon_id', leconId)
    .maybeSingle()

  if (!content) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <p className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
          🔒 Cette leçon est verrouillée. Terminez la leçon précédente ou débloquez
          l&apos;accès à la formation.
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">{lecon.titre}</h1>

      {content.video_url && (
        <div className="mb-6 aspect-video w-full overflow-hidden rounded-lg bg-black">
          <VideoPlayer url={content.video_url} />
        </div>
      )}

      {content.contenu_texte && (
        <div className="prose mb-6 max-w-none">{content.contenu_texte}</div>
      )}

      <CompleteLessonButton
        leconId={lecon.id}
        formationSlug={formationSlug}
        alreadyCompleted={Boolean(progress)}
      />
    </main>
  )
}
