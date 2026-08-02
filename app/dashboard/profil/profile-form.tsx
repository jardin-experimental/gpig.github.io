'use client'

import { useActionState } from 'react'
import { updateProfile } from '../../(auth)/actions'

export function ProfileForm({
    username,
    displayName,
    bio,
    avatarUrl,
}: {
    username: string
    displayName: string | null
    bio: string | null
    avatarUrl: string | null
}) {
    const [state, formAction, isPending] = useActionState(updateProfile, {
        error: null,
        success: null,
    })

    return (
        <form action={formAction} className="flex flex-col gap-4">
            <div>
                <label htmlFor="username" className="mb-1 block text-sm font-medium text-ink">
                    Nom d&apos;utilisateur
                </label>
                <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    defaultValue={username}
                    pattern="[a-z0-9_-]{3,20}"
                    title="3 à 20 caractères : lettres minuscules, chiffres, tirets, underscores"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-moss-600"
                />
                <p className="mt-1 text-xs text-ink-soft">
                    3 à 20 caractères, minuscules, chiffres, tirets ou underscores.
                </p>
            </div>

            <div>
                <label htmlFor="display_name" className="mb-1 block text-sm font-medium text-ink">
                    Nom affiché
                </label>
                <input
                    id="display_name"
                    name="display_name"
                    type="text"
                    maxLength={50}
                    defaultValue={displayName ?? ''}
                    placeholder="Ex. Tino le jardinier"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-moss-600"
                />
            </div>

            <div>
                <label htmlFor="avatar_url" className="mb-1 block text-sm font-medium text-ink">
                    URL de l&apos;avatar
                </label>
                <input
                    id="avatar_url"
                    name="avatar_url"
                    type="url"
                    defaultValue={avatarUrl ?? ''}
                    placeholder="https://…"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-moss-600"
                />
            </div>

            <div>
                <label htmlFor="bio" className="mb-1 block text-sm font-medium text-ink">
                    Bio
                </label>
                <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    maxLength={280}
                    defaultValue={bio ?? ''}
                    placeholder="Quelques mots sur toi…"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-moss-600"
                />
            </div>

            {state.error && (
                <p role="alert" className="text-sm text-red-600">
                    {state.error}
                </p>
            )}
            {state.success && <p className="text-sm text-moss-700">{state.success}</p>}

            <button
                type="submit"
                disabled={isPending}
                className="w-fit rounded-md bg-moss-700 px-4 py-2 text-sm text-white transition hover:bg-moss-800 disabled:opacity-50"
            >
                {isPending ? 'Enregistrement…' : 'Enregistrer'}
            </button>
        </form>
    )
}