import { createClient } from '@/lib/supabase/server'

export interface LeconNode {
  id: string
  titre: string
  type: 'video' | 'exercice' | 'quiz' | 'telechargement' | 'texte'
  duree_minutes: number | null
  is_free_preview: boolean
  is_unlocked: boolean
  is_completed: boolean
}

export interface ChapitreNode {
  id: string
  titre: string
  lecons: LeconNode[]
}

export interface ModuleNode {
  id: string
  titre: string
  chapitres: ChapitreNode[]
}

export interface FormationTree {
  id: string
  slug: string
  titre: string
  description: string | null
  is_premium: boolean
  has_access: boolean
  modules: ModuleNode[]
}

/**
 * Construit l'arbre complet d'une formation avec, pour l'utilisateur courant,
 * le statut débloqué/terminé de chaque leçon.
 * Le verrouillage réel est appliqué en base (RLS + is_lesson_unlocked) —
 * cette fonction ne fait qu'assembler l'affichage, elle ne doit jamais
 * être la seule barrière de sécurité.
 */
export async function getFormationTree(slug: string): Promise<FormationTree | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: formation } = await supabase
    .from('formations')
    .select('id, slug, titre, description, is_premium')
    .eq('slug', slug)
    .single()

  if (!formation) return null

  const { data: modules } = await supabase
    .from('modules')
    .select(
      `id, titre, position,
       chapitres (
         id, titre, position,
         lecons ( id, titre, type, duree_minutes, is_free_preview, position )
       )`
    )
    .eq('formation_id', formation.id)
    .order('position')

  const { data: hasAccess } = await supabase.rpc('has_formation_access', {
    p_formation_id: formation.id,
    p_user_id: user?.id ?? null,
  })

  const { data: progress } = user
    ? await supabase.from('lesson_progress').select('lecon_id').eq('user_id', user.id)
    : { data: [] as { lecon_id: string }[] }

  const completedIds = new Set((progress ?? []).map((p) => p.lecon_id))

  // Ordre global pour déterminer le déverrouillage séquentiel côté affichage
  const allLecons = (modules ?? [])
    .flatMap((m) => m.chapitres ?? [])
    .flatMap((c) => c.lecons ?? [])
    .sort((a, b) => a.position - b.position)

  let previousCompleted = true // la première leçon est toujours "débloquée par défaut" si preview ou accès formation

  const unlockedById = new Map<string, boolean>()
  for (const lecon of allLecons) {
    const unlocked = lecon.is_free_preview || (Boolean(hasAccess) && previousCompleted)
    unlockedById.set(lecon.id, unlocked)
    previousCompleted = completedIds.has(lecon.id)
  }

  return {
    id: formation.id,
    slug: formation.slug,
    titre: formation.titre,
    description: formation.description,
    is_premium: formation.is_premium,
    has_access: Boolean(hasAccess),
    modules: (modules ?? [])
      .sort((a, b) => a.position - b.position)
      .map((m) => ({
        id: m.id,
        titre: m.titre,
        chapitres: (m.chapitres ?? [])
          .sort((a, b) => a.position - b.position)
          .map((c) => ({
            id: c.id,
            titre: c.titre,
            lecons: (c.lecons ?? [])
              .sort((a, b) => a.position - b.position)
              .map((l) => ({
                id: l.id,
                titre: l.titre,
                type: l.type,
                duree_minutes: l.duree_minutes,
                is_free_preview: l.is_free_preview,
                is_unlocked: unlockedById.get(l.id) ?? false,
                is_completed: completedIds.has(l.id),
              })),
          })),
      })),
  }
}
