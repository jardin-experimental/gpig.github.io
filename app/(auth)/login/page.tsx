'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signIn } from '../actions'

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(signIn, { error: null })

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="mb-6 text-2xl font-semibold">Connexion</h1>

      <form action={formAction} className="flex flex-col gap-4">
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
            autoComplete="current-password"
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
          {isPending ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>

      <p className="mt-6 text-sm text-gray-600">
        Pas encore de compte ?{' '}
        <Link href="/register" className="font-medium text-moss-700 underline">
          Créer un compte
        </Link>
      </p>
    </main>
  )
}
