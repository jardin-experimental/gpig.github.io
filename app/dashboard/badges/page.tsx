import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const CONDITION_LABELS: Record<string, string> = {
    lecons_completees: 'Leçons terminées',
    quiz_reussis: 'Quiz réussis',
    streak_jours: 'Jours de série',
    formations_terminees: 'Formations terminées',
    niveau_atteint: 'Niveau atteint',
    xp_total: 'XP cumulée',
}

export default async function BadgesPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const [{ data: profile }, { data: badges }, { data: userBadges }] = await Promise.all([
        supabase
            .from('profiles')
            .select('level, xp, streak_count')
            .eq('id', user.id)
            .single(),
        supabase.from('badges').select('*').order('seuil', { ascending: true }),
        supabase.from('user_badges').select('badge_id, obtenu_at').eq('user_id', user.id),
    ])

    // Compteurs nécessaires pour afficher une progression sur les badges non obtenus
    const [{ count: leconsCompletees }, { count: quizReussis }] = await Promise.all([
        supabase
            .from('lesson_progress')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id),
        supabase
            .from('quiz_attempts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('reussi', true),
    ])

    const obtenus = new Map((userBadges ?? []).map((ub) => [ub.badge_id, ub.obtenu_at]))

    function currentValue(conditionType: string): number | null {
        switch (conditionType) {
            case 'lecons_completees':
                return leconsCompletees ?? 0
            case 'quiz_reussis':
                return quizReussis ?? 0
            case 'streak_jours':
                return profile?.streak_count ?? 0
            case 'niveau_atteint':
                return profile?.level ?? 0
            case 'xp_total':
                return profile?.xp ?? 0
            default:
                // formations_terminees demande une logique de complétion par formation,
                // pas de valeur approchée fiable à afficher ici pour l'instant
                return null
        }
    }

    const total = badges?.length ?? 0
    const nbObtenus = obtenus.size

    return (
        <main className="mx-auto max-w-3xl px-6 py-10">
            <header className="mb-8">
                <p className="text-xs uppercase tracking-wide text-moss-700">Carnet de collection</p>
                <h1 className="mt-1 font-display text-2xl text-ink">Mes badges</h1>
                <p className="mt-1 text-sm text-ink-soft">
                    {nbObtenus} / {total} badge{total > 1 ? 's' : ''} récolté{nbObtenus > 1 ? 's' : ''}
                </p>
            </header>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {(badges ?? []).map((badge) => {
                    const obtenuAt = obtenus.get(badge.id)
                    const isObtenu = Boolean(obtenuAt)
                    const valeur = currentValue(badge.condition_type)
                    const progress =
                        valeur !== null ? Math.min(100, Math.round((valeur / badge.seuil) * 100)) : null

                    return (
                        <article
                            key={badge.id}
                            className={`specimen-tag rounded-md border p-4 transition ${isObtenu
                                    ? 'border-moss-600 bg-moss-50/60'
                                    : 'border-line bg-white/40 opacity-80'
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <BadgeIcon iconUrl={badge.icone_url} obtenu={isObtenu} />
                                <div className="flex-1">
                                    <p className={`font-medium ${isObtenu ? 'text-ink' : 'text-ink-soft'}`}>
                                        {badge.nom}
                                    </p>
                                    {badge.description && (
                                        <p className="mt-0.5 text-xs text-ink-soft">{badge.description}</p>
                                    )}

                                    <p className="mt-2 font-mono text-xs text-moss-700">
                                        {CONDITION_LABELS[badge.condition_type] ?? badge.condition_type} · seuil{' '}
                                        {badge.seuil}
                                    </p>

                                    {isObtenu ? (
                                        <p className="mt-1 text-xs text-moss-700">
                                            ✓ Obtenu le{' '}
                                            {new Date(obtenuAt as string).toLocaleDateString('fr-FR', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                            })}
                                        </p>
                                    ) : progress !== null ? (
                                        <div className="mt-2">
                                            <div className="h-1.5 w-full rounded-full bg-paper-alt">
                                                <div
                                                    className="h-1.5 rounded-full bg-moss-600"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            <p className="mt-1 text-xs text-ink-soft">
                                                {valeur} / {badge.seuil}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="mt-1 text-xs text-ink-soft">🔒 Pas encore obtenu</p>
                                    )}
                                </div>
                            </div>
                        </article>
                    )
                })}

                {total === 0 && (
                    <p className="text-sm text-ink-soft">Aucun badge n&apos;est encore au catalogue.</p>
                )}
            </section>
        </main>
    )
}

function BadgeIcon({ iconUrl, obtenu }: { iconUrl: string | null; obtenu: boolean }) {
    if (iconUrl) {
        // eslint-disable-next-line @next/next/no-img-element
        return (
            <img
                src={iconUrl}
                alt=""
                className={`h-10 w-10 shrink-0 rounded-full border object-cover ${obtenu ? 'border-moss-600' : 'border-line grayscale'
                    }`}
            />
        )
    }

    return (
        <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border font-display text-lg ${obtenu
                    ? 'border-moss-600 bg-moss-100 text-moss-700'
                    : 'border-line bg-paper-alt text-ink-soft'
                }`}
        >
            {obtenu ? '✓' : '?'}
        </div>
    )
}