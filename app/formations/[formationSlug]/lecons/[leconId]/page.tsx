import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CompleteLessonButton } from './complete-lesson-button'
import { QuizPlayer, type QuizData } from './quiz-player'
import { SIMULATION_REGISTRY, type SimulationKey } from '@/components/simulations/registry'
import { getLessonNavigation } from '@/lib/formations/get-formation-tree'
import { LessonNav } from './lesson-nav'
import SecureVideo from '@/components/SecureVideo'
import { InteractiveVdoCipherVideo } from '@/components/video-interactions/interactive-vdocipher'
import { loadVideoInteractions } from '@/lib/video-interactions/load-video-interactions'
import { loadCompletedInteractionIds } from '@/lib/video-interactions/load-completed-interactions'
import H5PPlayer from '@/components/H5PPlayer'

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

  const navigation = await getLessonNavigation(formationSlug, leconId)

  if (lecon.type === 'quiz') {
    const quiz = await loadQuiz(supabase, leconId)

    if (!quiz) {
      return (
        <main className="mx-auto max-w-2xl px-6 py-10">
          <p className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            🔒 Ce quiz est verrouillé. Terminez la leçon précédente ou débloquez
            l&apos;accès à la formation.
          </p>
          <LessonNav formationSlug={formationSlug} navigation={navigation} />
        </main>
      )
    }

    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="mb-6 text-2xl font-semibold">{quiz.titre}</h1>
        <QuizPlayer quiz={quiz} formationSlug={formationSlug} />
        <LessonNav formationSlug={formationSlug} navigation={navigation} />
      </main>
    )
  }

  // RLS ne renverra une ligne ici que si is_lesson_unlocked() est vrai pour l'utilisateur courant
  const { data: content } = await supabase
    .from('lecon_contents')
    .select('video_url, contenu_texte, ressources, vdoCipher_id, h5p_content_id')
    .eq('lecon_id', leconId)
    .maybeSingle()

  if (!content) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-10">
        <p className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
          🔒 Cette leçon est verrouillée. Terminez la leçon précédente ou débloquez
          l&apos;accès à la formation.
        </p>
        <LessonNav formationSlug={formationSlug} navigation={navigation} />
      </main>
    )
  }

  // Même garde RLS que lecon_contents ci-dessus : si la leçon n'est pas
  // déverrouillée pour cet utilisateur, la requête renvoie simplement [].
  const interactions = content.video_url
    ? await loadVideoInteractions(supabase, leconId)
    : []
  const completedInteractionIds = content.video_url
    ? await loadCompletedInteractionIds(supabase, leconId)
    : []

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">{lecon.titre}</h1>

      {content.video_url && (
        <InteractiveVdoCipherVideo
          interactions={interactions}
          completedInteractionIds={completedInteractionIds}
        >
          <SecureVideo vdoCipher_id={content.vdoCipher_id}></SecureVideo>
        </InteractiveVdoCipherVideo>
      )}

      {content.contenu_texte && (
        <div className="prose mb-6 max-w-none">{content.contenu_texte}</div>
      )}

      {(() => {
        const ressources = content.ressources as { component?: string } | null
        const key = ressources?.component as SimulationKey | undefined
        const Simulation = key ? SIMULATION_REGISTRY[key] : null
        return Simulation ? (
          <div className="mb-6">
            <Simulation />
          </div>
        ) : null
      })()}

      {content.h5p_content_id && (
        <div className="mb-6">
          <H5PPlayer
            contentId={content.h5p_content_id}
            lessonId={leconId}
            storageBaseUrl={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/h5p-content`}
          />
        </div>
      )}

      <CompleteLessonButton
        leconId={lecon.id}
        formationSlug={formationSlug}
        alreadyCompleted={Boolean(progress)}
      />

      <LessonNav formationSlug={formationSlug} navigation={navigation} />
    </main>
  )
}