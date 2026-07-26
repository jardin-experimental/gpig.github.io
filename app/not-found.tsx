import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 text-3xl" aria-hidden>
        🍂
      </div>
      <h1 className="mb-3 font-display text-2xl text-ink">Rien ne pousse ici</h1>
      <p className="text-sm text-ink-soft">
        Cette page n&apos;existe pas ou a été déplacée.
      </p>
      <Link href="/" className="mt-6 text-sm text-moss-700 underline">
        Retour à l&apos;accueil
      </Link>
    </main>
  )
}
