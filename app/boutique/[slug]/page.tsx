import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AddToCartButton } from '@/components/boutique/add-to-card-button'
import { ProduitGallery } from '@/components/boutique/produit-gallery'
import { AtomeIcon } from '@/components/icons/atome-icon'

export default async function ProduitPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params

    const supabase = await createClient()

    const { data: produit } = await supabase
        .from('produits')
        .select('*')
        .eq('slug', slug)
        .eq('disponible', true)
        .single()

    if (!produit) {
        notFound()
    }

    return (
        <main className="mx-auto max-w-6xl px-6 py-10">
            <Link
                href="/boutique"
                className="mb-8 inline-flex text-sm text-moss-700 hover:underline"
            >
                ← Retour à la boutique
            </Link>

            <div className="grid gap-10 lg:grid-cols-2">
                <ProduitGallery images={produit.images_url} nom={produit.nom} />

                <div className="flex flex-col">
                    <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-moss-50 px-3 py-1 text-xs uppercase tracking-wide text-moss-700">
                            {produit.categorie}
                        </span>

                        <span className="rounded-full border border-line px-3 py-1 text-xs uppercase tracking-wide text-ink-soft">
                            {produit.type}
                        </span>
                    </div>

                    <h1 className="mt-4 font-display text-4xl text-ink">
                        {produit.nom}
                    </h1>

                    {produit.description && (
                        <p className="mt-6 whitespace-pre-line leading-7 text-ink-soft">
                            {produit.description}
                        </p>
                    )}

                    <div className="mt-8 rounded-xl border border-line bg-white p-6">
                        <p className="mb-4 text-sm text-ink-soft">
                            Prix
                        </p>

                        <div className="flex flex-wrap items-center gap-3">
                            {produit.prix_atomes != null && (
                                <span className="flex items-center gap-1.5 font-display text-3xl text-ink">
                                    {produit.prix_atomes} Atomes
                                    <AtomeIcon className="h-6 w-6 text-moss-700" />
                                </span>
                            )}

                            {produit.prix_centimes != null && (
                                <span
                                    className={
                                        produit.prix_atomes != null
                                            ? 'text-lg text-ink-soft'
                                            : 'font-display text-3xl text-ink'
                                    }
                                >
                                    {produit.prix_atomes != null && 'ou '}
                                    {(produit.prix_centimes / 100).toFixed(2)} €
                                </span>
                            )}
                        </div>

                        <AddToCartButton produitId={produit.id} />

                        <p className="mt-3 text-xs text-ink-soft">
                            Le mode de paiement sera proposé à l'étape suivante.
                        </p>
                    </div>

                    <div className="mt-8 rounded-lg border border-line p-4">
                        <h2 className="mb-2 font-medium text-ink">
                            Informations
                        </h2>

                        <dl className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-ink-soft">Type</dt>
                                <dd className="capitalize">{produit.type}</dd>
                            </div>

                            <div className="flex justify-between">
                                <dt className="text-ink-soft">Catégorie</dt>
                                <dd className="capitalize">{produit.categorie}</dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </main>
    )
}