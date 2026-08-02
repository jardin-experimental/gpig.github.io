import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '../(auth)/actions'
import { GrowthMeter } from '@/components/growth-meter'

// XP requis pour passer au niveau suivant (courbe simple, à ajuster plus tard)
function xpForNextLevel(level: number) {
  return level * 100
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, display_name, avatar_url, role, xp, level, streak_count')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  const xpNext = xpForNextLevel(profile.level)

  const { count } = await supabase
    .from('user_badges')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Bonjour {profile.display_name ?? profile.username}
          </h1>
          <p className="text-sm text-gray-500">Rôle : {profile.role}</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/dashboard/profil"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Mettre à jour mon profil
          </a>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Déconnexion
            </button>
          </form>
        </div>
      </header>

      <section className="mb-8 rounded-lg border border-line bg-white/60 p-5">
        <GrowthMeter niveau={profile.level} xp={profile.xp} xpProchainNiveau={xpNext} />
        {profile.streak_count > 0 && (
          <p className="mt-3 text-sm text-ink-soft">
            🔥 Série de {profile.streak_count} jour{profile.streak_count > 1 ? 's' : ''}
          </p>
        )}
      </section>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <DashboardCard label="Formations suivies" value="—" href="/dashboard/formations" />
        <DashboardCard label="Quiz réalisés" value="—" href="/dashboard/quiz" />
        <DashboardCard label="Badges" value={count} href="/dashboard/badges" />
        <DashboardCard label="Certificats" value="—" href="/dashboard/certificats" />
        <DashboardCard label="Factures" value="—" href="/dashboard/factures" />
        <DashboardCard label="Appels réservés" value="—" href="/dashboard/appels" />
      </section>
    </main>
  )
}

function DashboardCard({
  label,
  value,
  href,
}: {
  label: string
  value: string | number | null
  href: string
}) {
  return (
    <a
      href={href}
      className="rounded-lg border border-gray-200 p-4 transition hover:border-moss-300 hover:bg-moss-50/40"
    >
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </a>
  )
}
