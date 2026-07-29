'use client'

import { useMemo, useState, useTransition } from 'react'
import { submitQuizAttempt, type QuizReponseInput } from '../../../actions'

type QuestionType =
  | 'qcm'
  | 'choix_multiple'
  | 'vrai_faux'
  | 'texte_libre'
  | 'association'
  | 'ordonnancement'
  | 'image'
  | 'code'

export interface QuizOption {
  id: string
  contenu: string | null
  image_url: string | null
}

export interface QuizQuestion {
  id: string
  type: QuestionType
  enonce: string
  image_url: string | null
  points: number
  options: QuizOption[]
  // Pour 'association' uniquement : liste des libellés de gauche à associer
  // (les libellés de droite sont déduits des options)
  paires_gauche?: string[]
}

export interface QuizData {
  id: string
  titre: string
  description: string | null
  temps_limite_secondes: number | null
  note_passage_pourcentage: number
  questions: QuizQuestion[]
}

interface DetailResult {
  question_id: string
  is_correct: boolean | null
  points_obtenus: number
  points_max: number
  explication: string | null
}

export function QuizPlayer({
  quiz,
  formationSlug,
}: {
  quiz: QuizData
  formationSlug: string
}) {
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{
    score: number
    reussi: boolean
    details: DetailResult[]
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const startedAt = useMemo(() => Date.now(), [])

  function setAnswer(questionId: string, value: unknown) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  function handleSubmit() {
    const reponses: QuizReponseInput[] = quiz.questions.map((q) => ({
      question_id: q.id,
      type: q.type,
      reponse: answers[q.id] ?? null,
    }))
    const dureeSecondes = Math.round((Date.now() - startedAt) / 1000)

    startTransition(async () => {
      const { error, result: res } = await submitQuizAttempt(
        quiz.id,
        reponses,
        formationSlug,
        dureeSecondes
      )
      if (error) {
        setError(error)
        return
      }
      if (res) {
        setResult({
          score: res.score_pourcentage,
          reussi: res.reussi,
          details: res.details as DetailResult[],
        })
      }
    })
  }

  if (result) {
    return (
      <div className="flex flex-col gap-4">
        <div
          className={`rounded-md p-4 text-sm ${result.reussi
            ? 'bg-moss-50 text-moss-800'
            : 'bg-amber-50 text-amber-800'
            }`}
        >
          Score : {result.score}% — {result.reussi ? 'Réussi' : 'Non validé'}{' '}
          (seuil requis : {quiz.note_passage_pourcentage}%)
        </div>

        <div className="flex flex-col gap-3">
          {quiz.questions.map((q) => {
            const detail = result.details.find((d) => d.question_id === q.id)
            return (
              <div key={q.id} className="rounded-md border border-gray-200 p-3 text-sm">
                <p className="font-medium">{q.enonce}</p>
                {detail?.is_correct === null ? (
                  <p className="mt-1 text-gray-500">
                    Réponse enregistrée — correction manuelle à venir.
                  </p>
                ) : (
                  <p className={detail?.is_correct ? 'text-moss-700' : 'text-red-600'}>
                    {detail?.is_correct ? '✓ Correct' : '✗ Incorrect'} (
                    {detail?.points_obtenus}/{detail?.points_max} pt)
                  </p>
                )}
                {detail?.explication && (
                  <p className="mt-1 text-gray-600">{detail.explication}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {quiz.description && <p className="text-gray-600">{quiz.description}</p>}

      {quiz.questions.map((q, index) => (
        <QuestionInput
          key={q.id}
          index={index}
          question={q}
          value={answers[q.id]}
          onChange={(v) => setAnswer(q.id, v)}
        />
      ))}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="self-start rounded-md bg-moss-700 px-4 py-2 text-sm text-white transition hover:bg-moss-800 disabled:opacity-50"
      >
        {isPending ? 'Correction…' : 'Valider mes réponses'}
      </button>
    </div>
  )
}

function QuestionInput({
  index,
  question,
  value,
  onChange,
}: {
  index: number
  question: QuizQuestion
  value: unknown
  onChange: (v: unknown) => void
}) {
  return (
    <fieldset className="rounded-md border border-gray-200 p-4">
      <legend className="px-1 text-sm font-medium">
        {index + 1}. {question.enonce}
      </legend>
      {question.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={question.image_url} alt="" className="my-2 max-h-48 rounded-md" />
      )}

      <div className="mt-2">
        {(question.type === 'qcm' || question.type === 'vrai_faux' || question.type === 'image') && (
          <div className="flex flex-col gap-2">
            {question.options.map((opt) => (
              <label key={opt.id} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={question.id}
                  checked={value === opt.id}
                  onChange={() => onChange(opt.id)}
                />
                {opt.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={opt.image_url} alt={opt.contenu ?? ''} className="h-16 rounded" />
                ) : (
                  opt.contenu
                )}
              </label>
            ))}
          </div>
        )}

        {question.type === 'choix_multiple' && (
          <div className="flex flex-col gap-2">
            {question.options.map((opt) => {
              const selected = Array.isArray(value) ? (value as string[]) : []
              return (
                <label key={opt.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.includes(opt.id)}
                    onChange={(e) =>
                      onChange(
                        e.target.checked
                          ? [...selected, opt.id]
                          : selected.filter((id) => id !== opt.id)
                      )
                    }
                  />
                  {opt.contenu}
                </label>
              )
            })}
          </div>
        )}

        {question.type === 'texte_libre' && (
          <input
            type="text"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Votre réponse"
          />
        )}

        {question.type === 'code' && (
          <>
            <textarea
              value={(value as string) ?? ''}
              onChange={(e) => onChange(e.target.value)}
              rows={6}
              className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm"
              placeholder="// Votre code"
            />
            <p className="mt-1 text-xs text-gray-500">
              Correction automatique non disponible pour l&apos;instant — soumission
              enregistrée pour relecture.
            </p>
          </>
        )}

        {question.type === 'ordonnancement' && (
          <OrderableList
            options={question.options}
            value={(value as string[]) ?? question.options.map((o) => o.id)}
            onChange={onChange}
          />
        )}

        {question.type === 'association' && (
          <AssociationInput
            question={question}
            value={(value as Record<string, string>) ?? {}}
            onChange={onChange}
          />
        )}
      </div>
    </fieldset>
  )
}

function OrderableList({
  options,
  value,
  onChange,
}: {
  options: QuizOption[]
  value: string[]
  onChange: (v: string[]) => void
}) {
  function move(fromIndex: number, direction: -1 | 1) {
    const toIndex = fromIndex + direction
    if (toIndex < 0 || toIndex >= value.length) return
    const next = [...value]
      ;[next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]]
    onChange(next)
  }

  return (
    <ol className="flex flex-col gap-2">
      {value.map((id, i) => {
        const opt = options.find((o) => o.id === id)
        return (
          <li
            key={id}
            className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm"
          >
            <span>
              {i + 1}. {opt?.contenu}
            </span>
            <span className="flex gap-1">
              <button
                type="button"
                onClick={() => move(i, -1)}
                className="rounded px-2 py-0.5 text-gray-500 hover:bg-gray-100"
                aria-label="Monter"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                className="rounded px-2 py-0.5 text-gray-500 hover:bg-gray-100"
                aria-label="Descendre"
              >
                ↓
              </button>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

function AssociationInput({
  question,
  value,
  onChange,
}: {
  question: QuizQuestion
  value: Record<string, string>
  onChange: (v: Record<string, string>) => void
}) {
  const gauches = question.paires_gauche ?? []
  const droites = question.options.map((o) => o.contenu ?? '')

  return (
    <div className="flex flex-col gap-2">
      {gauches.map((gauche) => (
        <div key={gauche} className="flex items-center gap-3 text-sm">
          <span className="w-1/3">{gauche}</span>
          <select
            value={value[gauche] ?? ''}
            onChange={(e) => onChange({ ...value, [gauche]: e.target.value })}
            className="flex-1 rounded-md border border-gray-300 px-2 py-1"
          >
            <option value="">— choisir —</option>
            {droites.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  )
}
