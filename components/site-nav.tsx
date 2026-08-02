import Image from "next/image"
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/(auth)/actions'

export async function SiteNav() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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

          {user ? (
            <>
              <Link href="/dashboard" className="text-ink-soft hover:text-ink">
                Tableau de bord
              </Link>
              <Link href="/dashboard/profil" className="text-ink-soft hover:text-ink">
                Profil
              </Link>
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