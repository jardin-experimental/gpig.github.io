'use client'

import { useState, useTransition } from 'react'
import type { VideoInteraction } from '@/lib/video-interactions/use-video-interactions'
import {
    createVideoInteraction,
    updateVideoInteraction,
    deleteVideoInteraction,
    listVideoInteractions,
} from './actions'

type Quiz = { id: string; titre: string }

const EMPTY_FORM = {
    id: null as string | null,
    timestampSeconds: '',
    type: 'texte' as VideoInteraction['type'],
    titre: '',
    contenu: '',
    imageUrl: '',
    quizId: '',
    pauseVideo: true,
}

export function VideoInteractionsManager({
    leconId,
    formationSlug,
    initialInteractions,
    availableQuizzes,
}: {
    leconId: string
    formationSlug: string
    initialInteractions: VideoInteraction[]
    availableQuizzes: Quiz[]
}) {
    const [interactions, setInteractions] = useState(initialInteractions)
    const [form, setForm] = useState(EMPTY_FORM)
    const [feedback, setFeedback] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const editing = form.id !== null

    function resetForm() {
        setForm(EMPTY_FORM)
    }

    function editInteraction(i: VideoInteraction) {
        setFeedback(null)
        setForm({
            id: i.id,
            timestampSeconds: String(i.timestamp_seconds),
            type: i.type,
            titre: i.titre ?? '',
            contenu: i.contenu ?? '',
            imageUrl: i.image_url ?? '',
            quizId: i.quiz_id ?? '',
            pauseVideo: i.pause_video,
        })
    }

    function handleSubmit() {
        setFeedback(null)

        const timestampSeconds = Number(form.timestampSeconds)
        if (Number.isNaN(timestampSeconds) || timestampSeconds < 0) {
            setFeedback('Le timestamp doit être un nombre positif (en secondes).')
            return
        }
        if (form.type === 'quiz' && !form.quizId) {
            setFeedback('Choisis un quiz pour une interaction de type "quiz".')
            return
        }

        const input = {
            leconId,
            timestampSeconds,
            type: form.type,
            titre: form.titre || undefined,
            contenu: form.contenu || undefined,
            imageUrl: form.imageUrl || undefined,
            quizId: form.quizId || undefined,
            pauseVideo: form.pauseVideo,
        }

        startTransition(async () => {
            const { error } = editing && form.id
                ? await updateVideoInteraction(form.id, input, formationSlug)
                : await createVideoInteraction(input, formationSlug)

            if (error) {
                setFeedback('Une erreur est survenue, réessayez.')
                return
            }

            setInteractions(await listVideoInteractions(leconId))
            setFeedback(editing ? 'Interaction mise à jour.' : 'Interaction ajoutée.')
            resetForm()
        })
    }

    function handleDelete(id: string) {
        setFeedback(null)
        startTransition(async () => {
            const { error } = await deleteVideoInteraction(id, leconId, formationSlug)
            if (error) {
                setFeedback('Une erreur est survenue, réessayez.')
                return
            }
            setInteractions((prev) => prev.filter((i) => i.id !== id))
            if (form.id === id) resetForm()
        })
    }

    return (
        <div className="space-y-8">
            <section>
                <h2 className="mb-3 text-lg font-semibold">Interactions existantes</h2>
                {interactions.length === 0 ? (
                    <p className="text-sm text-gray-600">Aucune interaction pour cette leçon.</p>
                ) : (
                    <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
                        {interactions.map((i) => (
                            <li key={i.id} className="flex items-center justify-between gap-3 p-3">
                                <div className="min-w-0">
                                    <p className="font-mono text-xs text-gray-600">
                                        {i.timestamp_seconds}s · {i.type}
                                    </p>
                                    <p className="truncate text-sm">
                                        {i.titre || i.contenu || i.quiz_id || '(sans titre)'}
                                    </p>
                                </div>
                                <div className="flex shrink-0 gap-2">
                                    <button
                                        onClick={() => editInteraction(i)}
                                        className="rounded-md border border-gray-200 px-3 py-1 text-xs transition hover:bg-gray-50"
                                    >
                                        Modifier
                                    </button>
                                    <button
                                        onClick={() => handleDelete(i.id)}
                                        disabled={isPending}
                                        className="rounded-md border border-gray-200 px-3 py-1 text-xs text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                                    >
                                        Supprimer
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section>
                <h2 className="mb-3 text-lg font-semibold">
                    {editing ? 'Modifier l’interaction' : 'Nouvelle interaction'}
                </h2>

                <div className="space-y-3">
                    <div className="flex gap-3">
                        <label className="flex-1 text-sm">
                            Timestamp (secondes)
                            <input
                                type="number"
                                min="0"
                                step="0.1"
                                value={form.timestampSeconds}
                                onChange={(e) => setForm((f) => ({ ...f, timestampSeconds: e.target.value }))}
                                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                            />
                        </label>

                        <label className="flex-1 text-sm">
                            Type
                            <select
                                value={form.type}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, type: e.target.value as VideoInteraction['type'] }))
                                }
                                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                            >
                                <option value="texte">Texte</option>
                                <option value="image">Image</option>
                                <option value="quiz">Quiz</option>
                            </select>
                        </label>
                    </div>

                    {form.type === 'quiz' ? (
                        <label className="block text-sm">
                            Quiz
                            <select
                                value={form.quizId}
                                onChange={(e) => setForm((f) => ({ ...f, quizId: e.target.value }))}
                                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                            >
                                <option value="">— choisir un quiz —</option>
                                {availableQuizzes.map((q) => (
                                    <option key={q.id} value={q.id}>
                                        {q.titre}
                                    </option>
                                ))}
                            </select>
                        </label>
                    ) : (
                        <>
                            <label className="block text-sm">
                                Titre
                                <input
                                    type="text"
                                    value={form.titre}
                                    onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))}
                                    className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                                />
                            </label>

                            {form.type === 'texte' && (
                                <label className="block text-sm">
                                    Contenu
                                    <textarea
                                        value={form.contenu}
                                        onChange={(e) => setForm((f) => ({ ...f, contenu: e.target.value }))}
                                        rows={3}
                                        className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                                    />
                                </label>
                            )}

                            {form.type === 'image' && (
                                <label className="block text-sm">
                                    URL de l’image
                                    <input
                                        type="text"
                                        value={form.imageUrl}
                                        onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                                        className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm"
                                    />
                                </label>
                            )}
                        </>
                    )}

                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={form.pauseVideo}
                            onChange={(e) => setForm((f) => ({ ...f, pauseVideo: e.target.checked }))}
                        />
                        Met la vidéo en pause à ce moment
                    </label>

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            onClick={handleSubmit}
                            disabled={isPending}
                            className="rounded-md bg-moss-700 px-4 py-2 text-sm text-white transition hover:bg-moss-800 disabled:opacity-50"
                        >
                            {isPending ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Ajouter'}
                        </button>
                        {editing && (
                            <button
                                onClick={resetForm}
                                className="rounded-md border border-gray-200 px-4 py-2 text-sm transition hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                        )}
                        {feedback && <span className="text-sm text-gray-600">{feedback}</span>}
                    </div>
                </div>
            </section>
        </div>
    )
}