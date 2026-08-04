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
    p_user_id: user!.id,
  })

  const { data: progress } = user
    ? await supabase.from('lesson_progress').select('lecon_id').eq('user_id', user.id)
    : { data: [] as { lecon_id: string }[] }

  const completedIds = new Set((progress ?? []).map((p) => p.lecon_id))

  // Ordre global pour déterminer le déverrouillage séquentiel côté affichage.
  // Important : lecon.position ne compte que DANS son chapitre (chaque
  // chapitre repart à 1) — il faut donc trier modules → chapitres → leçons
  // de façon imbriquée avant d'aplatir, exactement comme le fait la fonction
  // SQL is_lesson_unlocked. Trier uniquement par lecon.position ferait
  // apparaître la 1ère leçon du chapitre suivant avant la 2e leçon du
  // chapitre courant.
  const modulesTries = [...(modules ?? [])].sort((a, b) => a.position - b.position)
  const allLecons = modulesTries.flatMap((m) =>
    [...(m.chapitres ?? [])]
      .sort((a, b) => a.position - b.position)
      .flatMap((c) => [...(c.lecons ?? [])].sort((a, b) => a.position - b.position))
  )

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
    modules: modulesTries.map((m) => ({
      id: m.id,
      titre: m.titre,
      chapitres: [...(m.chapitres ?? [])]
        .sort((a, b) => a.position - b.position)
        .map((c) => ({
          id: c.id,
          titre: c.titre,
          lecons: [...(c.lecons ?? [])]
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

export interface LessonNavItem {
  id: string
  titre: string
  is_unlocked: boolean
}

export interface LessonNavigation {
  previous: LessonNavItem | null
  next: LessonNavItem | null
}

/**
 * Trouve la leçon précédente/suivante dans l'ordre global de la formation
 * (même ordre que getFormationTree : module → chapitre → leçon). Réutilise
 * getFormationTree plutôt que de recalculer l'ordre séparément, pour ne
 * jamais risquer une deuxième logique de tri qui diverge de la première.
 */
export async function getLessonNavigation(
  formationSlug: string,
  leconId: string
): Promise<LessonNavigation> {
  const formation = await getFormationTree(formationSlug)
  if (!formation) return { previous: null, next: null }

  const allLecons = formation.modules.flatMap((m) =>
    m.chapitres.flatMap((c) => c.lecons)
  )

  const index = allLecons.findIndex((l) => l.id === leconId)
  if (index === -1) return { previous: null, next: null }

  const previous = index > 0 ? allLecons[index - 1] : null
  const next = index < allLecons.length - 1 ? allLecons[index + 1] : null

  return {
    previous: previous && { id: previous.id, titre: previous.titre, is_unlocked: previous.is_unlocked },
    next: next && { id: next.id, titre: next.titre, is_unlocked: next.is_unlocked },
  }
}