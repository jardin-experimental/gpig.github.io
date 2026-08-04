import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type SearchParams = { categorie?: string; type?: 'numerique' | 'physique' }

export default async function BoutiquePage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>
}) {
    const { categorie, type } = await searchParams
    const supabase = await createClient()

    const { data: toutesLesCategories } = await supabase
        .from('produits')
        .select('categorie')
        .eq('disponible', true)

    const categoriesUniques = Array.from(
        new Set((toutesLesCategories ?? []).map((p) => p.categorie))
    ).sort()

    let query = supabase.from('produits').select('*').eq('disponible', true)
    if (categorie) query = query.eq('categorie', categorie)
    if (type) query = query.eq('type', type)

    const { data: produits } = await query.order('created_at', { ascending: false })

    const buildHref = (params: Partial<SearchParams>) => {
        const merged = { categorie, type, ...params }
        const next = new URLSearchParams()
        if (merged.categorie) next.set('categorie', merged.categorie)
        if (merged.type) next.set('type', merged.type)
        const qs = next.toString()
        return qs ? `/boutique?${qs}` : '/boutique'
    }

    const pill = (actif: boolean) =>
        `rounded-full border px-3 py-1 text-sm transition ${actif
            ? 'border-moss-700 bg-moss-50 text-moss-700'
            : 'border-line text-ink-soft hover:text-ink'
        }`

    return (
        <main className="mx-auto max-w-5xl px-6 py-10">
            <header className="mb-8">
                <p className="text-xs uppercase tracking-wide text-moss-700">Boutique</p>
                <h1 className="mt-1 font-display text-2xl text-ink">Objets scientifiques</h1>
                <p className="mt-2 text-sm text-ink-soft">
                    Cosmétiques, contenus et objets à collectionner — payables en Atomes ou en euros.
                </p>
            </header>

            <div className="mb-6 flex flex-wrap items-center gap-2">
                <Link href={buildHref({ type: undefined })} className={pill(!type)}>
                    Tout
                </Link>
                <Link href={buildHref({ type: 'numerique' })} className={pill(type === 'numerique')}>
                    Numérique
                </Link>
                <Link href={buildHref({ type: 'physique' })} className={pill(type === 'physique')}>
                    Physique
                </Link>

                {categoriesUniques.length > 0 && <span className="mx-1 h-4 w-px bg-line" />}

                {categoriesUniques.map((cat) => (
                    <Link
                        key={cat}
                        href={buildHref({ categorie: cat === categorie ? undefined : cat })}
                        className={`${pill(categorie === cat)} capitalize`}
                    >
                        {cat}
                    </Link>
                ))}
            </div>

            {!produits || produits.length === 0 ? (
                <p className="text-sm text-ink-soft">
                    Aucun produit ne correspond à ces filtres pour le moment.
                </p>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {produits.map((produit) => (
                        <Link
                            key={produit.id}
                            href={`/boutique/${produit.slug}`}
                            className="group flex flex-col overflow-hidden rounded-lg border border-line bg-white/60 transition hover:border-moss-600"
                        >
                            <div className="flex aspect-square w-full items-center justify-center overflow-hidden bg-moss-50">
                                {produit.image_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={produit.image_url}
                                        alt={produit.nom}
                                        className="h-full w-full object-cover transition group-hover:scale-105"
                                    />
                                ) : (
                                    <span className="text-3xl" aria-hidden>
                                        🔬
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-1 flex-col gap-1 p-4">
                                <p className="text-xs uppercase tracking-wide text-moss-700">
                                    {produit.categorie}
                                </p>
                                <p className="font-medium text-ink">{produit.nom}</p>
                                <div className="mt-auto flex items-baseline gap-2 pt-2">
                                    {produit.prix_atomes != null && (
                                        <span className="font-display text-lg text-ink">
                                            {produit.prix_atomes} Atomes
                                        </span>
                                    )}
                                    {produit.prix_centimes != null && (
                                        <span
                                            className={
                                                produit.prix_atomes != null
                                                    ? 'text-xs text-ink-soft'
                                                    : 'font-display text-lg text-ink'
                                            }
                                        >
                                            {produit.prix_atomes != null ? 'ou ' : ''}
                                            {(produit.prix_centimes / 100).toFixed(2)} €
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </main>
    )
}