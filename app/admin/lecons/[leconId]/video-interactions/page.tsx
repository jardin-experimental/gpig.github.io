import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { listVideoInteractions } from './actions'
import { VideoInteractionsManager } from './manager'

// Cette route est déjà couverte par middleware.ts (protection /admin/*,
// vérifie role = 'administrateur') — pas besoin de re-checker ici, mais
// chaque RPC appelée par le manager revérifie quand même le rôle en base
// (defense in depth, comme le reste du projet).

export default async function AdminVideoInteractionsPage({
    params,
}: {
    params: Promise<{ formationSlug: string; leconId: string }>
}) {
    const { formationSlug, leconId } = await params
    const supabase = await createClient()

    const { data: lecon } = await supabase
        .from('lecons')
        .select('id, titre, type')
        .eq('id', leconId)
        .single()

    if (!lecon || lecon.type === 'quiz') notFound()

    const interactions = await listVideoInteractions(leconId)

    // Liste des quiz existants pour le sélecteur — ajuste la table/colonnes
    // si ton schéma de quizzes diffère de celui du Bloc 3.
    const { data: quizzes } = await supabase
        .from('quizzes')
        .select('id, titre')
        .order('titre')

    return (
        <main className="mx-auto max-w-3xl px-6 py-10">
            <h1 className="mb-1 text-2xl font-semibold">Interactions vidéo</h1>
            <p className="mb-6 text-sm text-ink-soft">{lecon.titre}</p>

            <VideoInteractionsManager
                leconId={leconId}
                formationSlug={formationSlug}
                initialInteractions={interactions}
                availableQuizzes={quizzes ?? []}
            />
        </main>
    )
}