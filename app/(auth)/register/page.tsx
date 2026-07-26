'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signUp } from '../actions'

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(signUp, { error: null })

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="mb-6 text-2xl font-semibold">Créer un compte</h1>

      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label htmlFor="username" className="mb-1 block text-sm font-medium">
            Pseudo
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            minLength={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-moss-600"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-moss-600"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-moss-600"
          />
        </div>

        {state.error && (
          <p role="alert" className="text-sm text-red-600">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-moss-700 px-4 py-2 text-white transition hover:bg-moss-800 disabled:opacity-50"
        >
          {isPending ? 'Création…' : 'Créer mon compte'}
        </button>
      </form>

      <p className="mt-6 text-sm text-gray-600">
        Déjà membre ?{' '}
        <Link href="/login" className="font-medium text-moss-700 underline">
          Se connecter
        </Link>
      </p>
    </main>
  )
}
