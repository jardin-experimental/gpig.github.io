'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Json } from '@/types/database.types'

export interface QuizReponseInput {
  question_id: string
  type: string
  reponse: unknown
}

export async function submitQuizAttempt(
  quizId: string,
  reponses: QuizReponseInput[],
  formationSlug: string,
  dureeSecondes?: number
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .rpc('submit_quiz_attempt', {
      p_quiz_id: quizId,
      p_reponses: reponses as unknown as Json,
      p_duree_secondes: dureeSecondes,
    })
    .single()

  if (error) {
    return { error: error.message, result: null }
  }

  revalidatePath(`/formations/${formationSlug}`)
  revalidatePath('/dashboard')

  return { error: null, result: data }
}

export async function completeLesson(leconId: string, formationSlug: string, score?: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .rpc('complete_lesson', { p_lecon_id: leconId, p_score: score })
    .single()

  if (error) {
    return { error: error.message, result: null }
  }

  revalidatePath(`/formations/${formationSlug}`)
  revalidatePath('/dashboard')

  return { error: null, result: data }
}
