import Link from 'next/link'

export default function VerifiezVosEmailsPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 text-3xl" aria-hidden>
        🌱
      </div>
      <h1 className="mb-3 font-display text-2xl text-ink">Vérifiez votre boîte mail</h1>
      <p className="text-sm text-ink-soft">
        Nous venons de vous envoyer un lien de confirmation. Cliquez dessus pour
        activer votre compte et commencer votre première formation.
      </p>
      <p className="mt-6 text-sm text-ink-soft">
        Pas reçu d&apos;email ?{' '}
        <Link href="/login" className="text-moss-700 underline">
          Retourner à la connexion
        </Link>
      </p>
    </main>
  )
}
