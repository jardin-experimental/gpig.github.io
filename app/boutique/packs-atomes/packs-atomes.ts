// Tarifs de départ — à ajuster librement, ce sont des valeurs
// d'exemple pour avoir un flux fonctionnel dès maintenant.
// Le "bonus" sur les packs supérieurs incite à acheter plus gros
// (pattern classique de monnaie de jeu).
export const PACKS_ATOMES = [
    {
        id: 'decouverte',
        nom: 'Pack Découverte',
        atomes: 500,
        prixCentimes: 500, // 5,00 €
    },
    {
        id: 'laborantin',
        nom: 'Pack Laborantin',
        atomes: 3000, // 2500 + 500 bonus
        prixCentimes: 2500, // 25,00 €
    },
    {
        id: 'chercheur',
        nom: 'Pack Chercheur',
        atomes: 7000, // 5000 + 2000 bonus
        prixCentimes: 5000, // 50,00 €
    },
] as const

export type PackAtomesId = (typeof PACKS_ATOMES)[number]['id']