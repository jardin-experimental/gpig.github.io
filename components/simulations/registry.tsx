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
} as const

export type SimulationKey = keyof typeof SIMULATION_REGISTRY
