import Link from 'next/link'

/**
 * À poser sur chaque ligne "leçon" de ton back-office formations, à côté
 * des autres actions. N'a de sens que pour les leçons vidéo — la page
 * cible fait notFound() pour une leçon de type "quiz".
 */
export function VideoInteractionsLink({
    leconId,
    leconType,
}: {
    leconId: string
    leconType: string
}) {
    if (leconType === 'quiz') return null

    return (
        <Link
            href={`/admin/lecons/${leconId}/video-interactions`}
            className="rounded-md bg-moss-700 px-4 py-2 text-sm text-white transition hover:bg-moss-800"
        >
            Interactions
        </Link>
    )
}