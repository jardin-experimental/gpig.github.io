import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from './profile-form'

export default async function ProfilPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select(
            'username, display_name, avatar_url, bio, role, xp, level, streak_count, created_at'
        )
        .eq('id', user.id)
        .single()

    if (!profile) {
        redirect('/login')
    }

    return (
        <main className="mx-auto max-w-2xl px-6 py-10">
            <header className="mb-8">
                <p className="text-xs uppercase tracking-wide text-moss-700">Carnet perso</p>
                <h1 className="mt-1 font-display text-2xl text-ink">Mon profil</h1>
                <p className="mt-1 text-sm text-ink-soft">
                    Membre depuis le{' '}
                    {new Date(profile.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                    })}{' '}
                    · Rôle : {profile.role}
                </p>
            </header>

            <section className="mb-8 flex items-center gap-4 rounded-lg border border-line bg-white/60 p-5">
                <Avatar avatarUrl={profile.avatar_url} label={profile.display_name ?? profile.username} />
                <div>
                    <p className="font-medium text-ink">
                        {profile.display_name ?? profile.username}
                    </p>
                    <p className="text-sm text-ink-soft">@{profile.username}</p>
                    <p className="mt-1 text-xs text-ink-soft">
                        Niveau {profile.level} · {profile.xp} XP
                        {profile.streak_count > 0 &&
                            ` · 🔥 ${profile.streak_count} jour${profile.streak_count > 1 ? 's' : ''}`}
                    </p>
                </div>
            </section>

            <section className="rounded-lg border border-line bg-white/60 p-5">
                <h2 className="mb-4 font-display text-lg text-ink">Mettre à jour mes informations</h2>
                <ProfileForm
                    username={profile.username}
                    displayName={profile.display_name}
                    bio={profile.bio}
                    avatarUrl={profile.avatar_url}
                />
            </section>
        </main>
    )
}

function Avatar({ avatarUrl, label }: { avatarUrl: string | null; label: string }) {
    if (avatarUrl) {
        // eslint-disable-next-line @next/next/no-img-element
        return (
            <img
                src={avatarUrl}
                alt={label}
                className="h-14 w-14 rounded-full border border-line object-cover"
            />
        )
    }

    return (
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-line bg-moss-50 font-display text-lg text-moss-700">
            {label.slice(0, 1).toUpperCase()}
        </div>
    )
}