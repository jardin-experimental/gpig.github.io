import Image from "next/image"
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/(auth)/actions'

export async function SiteNav() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isAdmin = false
  let atomes = 0
  let articlesPanier = 0

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.role === 'administrateur'

    const [{ data: soldeAtomes }, { data: panier }] = await Promise.all([
      supabase.rpc('mes_atomes_disponibles'),
      supabase.from('panier_items').select('quantite'),
    ])

    atomes = soldeAtomes ?? 0
    articlesPanier = panier?.reduce((total, item) => total + item.quantite, 0) ?? 0
  }

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-lg tracking-tight text-ink">
          <Image
            src="/image/GPIG_logo.png"
            alt="GPIG"
            width={40}
            height={40}
            priority
          />
          <span className="text-moss-700">GPIG</span>
        </Link>

        <nav className="flex items-center gap-5 text-sm">
          <Link href="/formations" className="text-ink-soft hover:text-ink">
            Formations
          </Link>
          <Link href="/classement" className="text-ink-soft hover:text-ink">
            Classement
          </Link>
          <Link href="/boutique" className="text-ink-soft hover:text-ink">
            Boutique
          </Link>

          {user ? (
            <>
              <Link
                href="/boutique/packs-atomes"
                className="flex items-center gap-1 rounded-full border border-line px-3 py-1 text-ink-soft hover:border-moss-600 hover:text-moss-700"
                title="Solde d'Atomes"
              >
                <span aria-hidden>⚛️</span>
                <span>{atomes}</span>
              </Link>
              <Link
                href="/boutique/panier"
                className="relative flex items-center text-ink-soft hover:text-ink"
                title="Panier"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                  aria-hidden
                >
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                {articlesPanier > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-moss-700 text-[10px] text-white">
                    {articlesPanier}
                  </span>
                )}
              </Link>
              <Link href="/dashboard" className="text-ink-soft hover:text-ink">
                Tableau de bord
              </Link>
              {/* <Link href="/dashboard/profil" className="text-ink-soft hover:text-ink">
                Profil
              </Link> */}
              {!isAdmin && (<Link href="/rendez-vous" className="text-ink-soft hover:text-ink">
                Rendez-vous
              </Link>)}
              {isAdmin && (
                <Link
                  href="/admin/rendez-vous"
                  className="text-ink-soft hover:text-ink"
                >
                  Rendez-vous
                </Link>
              )}
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-full border border-line px-3 py-1.5 text-ink-soft hover:border-moss-600 hover:text-moss-700"
                >
                  Déconnexion
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-moss-700 px-4 py-1.5 text-white hover:bg-moss-800"
            >
              Connexion
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}