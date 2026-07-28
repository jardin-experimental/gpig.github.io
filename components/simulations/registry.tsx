import dynamic from 'next/dynamic'

/**
 * Registre des simulations interactives. Chaque leçon de type 'exercice'
 * peut référencer une clé ici via lecon_contents.ressources ->> 'component'
 * (ex. {"component": "pendulum-quiz"} dans la colonne jsonb).
 *
 * Pour ajouter une nouvelle simulation : créer le composant dans ce dossier
 * puis l'enregistrer ici sous une nouvelle clé.
 */
export const SIMULATION_REGISTRY = {
  'pendulum-quiz': dynamic(() => import('./pendulum-quiz')),
  'density-quiz': dynamic(() => import('./density-quiz')),
  'circuit-quiz': dynamic(() => import('./circuit-quiz')),
  'parabola-quiz': dynamic(() => import('./parabola-quiz')),
  'pythagoras-quiz': dynamic(() => import('./pythagoras-quiz')),
  'wave-quiz': dynamic(() => import('./wave-quiz')),
  'optics-quiz': dynamic(() => import('./optics-quiz')),
  'projectile-quiz': dynamic(() => import('./projectile-quiz')),
} as const

export type SimulationKey = keyof typeof SIMULATION_REGISTRY
