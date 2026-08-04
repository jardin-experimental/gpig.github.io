import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  acheterPanierAtomes,
  changerQuantitePanier,
  checkoutPanierPhysique,
  retirerDuPanier,
} from '../actions'

type Produit = {
  id: string
  slug: string
  nom: string
  type: 'numerique' | 'physique'
  prix_atomes: number | null
  prix_centimes: number | null
}

export default async function PanierPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; achat?: string; paiement?: string }>
}) {
  const { erreur, achat, paiement } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/boutique/panier')

  const { data: items } = await supabase
    .from('panier_items')
    .select('quantite, produits(id, slug, nom, type, prix_atomes, prix_centimes)')
    .order('created_at', { ascending: true })

  const { data: solde } = await supabase.rpc('mes_atomes_disponibles')

  const lignes = (items ?? []) as unknown as { quantite: number; produits: Produit }[]

  // Un article payable en Atomes (numérique ou physique) passe uniquement
  // par le bouton "Payer en Atomes" ; le circuit Stripe/euros ne concerne
  // que les articles physiques sans prix en Atomes.
  const articlesAtomes = lignes.filter((l) => l.produits?.prix_atomes != null)
  const articlesPhysiquesEuros = lignes.filter(
    (l) => l.produits?.type === 'physique' && l.produits.prix_atomes == null
  )
  const contientPhysiqueEnAtomes = articlesAtomes.some((l) => l.produits.type === 'physique')

  const totalAtomes = articlesAtomes.reduce(
    (t, l) => t + l.quantite * (l.produits.prix_atomes ?? 0),
    0
  )
  const totalEuros = articlesPhysiquesEuros.reduce(
    (t, l) => t + l.quantite * (l.produits.prix_centimes ?? 0),
    0
  )

  const soldeAtomes = solde ?? 0

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-display text-2xl text-ink">Mon panier</h1>

      {achat === 'succes' && (
        <p className="mt-4 rounded-md bg-moss-50 px-4 py-3 text-sm text-moss-700">
          Achat validé avec tes Atomes !
        </p>
      )}
      {paiement === 'succes' && (
        <p className="mt-4 rounded-md bg-moss-50 px-4 py-3 text-sm text-moss-700">
          Paiement reçu, ta commande est en cours de préparation.
        </p>
      )}
      {erreur && (
        <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{erreur}</p>
      )}

      {lignes.length === 0 ? (
        <p className="mt-6 text-sm text-ink-soft">
          Ton panier est vide.{' '}
          <Link href="/boutique" className="text-moss-700 underline">
            Parcourir la boutique
          </Link>
        </p>
      ) : (
        <div className="mt-6 space-y-10">
          {articlesAtomes.length > 0 && (
            <section>
              <h2 className="text-sm font-medium uppercase tracking-wide text-moss-700">
                Payable en Atomes
              </h2>
              <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
                {articlesAtomes.map((ligne) => (
                  <li
                    key={ligne.produits.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">{ligne.produits.nom}</p>
                      <p className="text-xs text-ink-soft">
                        {ligne.produits.prix_atomes} Atomes × {ligne.quantite}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <form
                        action={changerQuantitePanier.bind(null, ligne.produits.id)}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="number"
                          name="quantite"
                          min={1}
                          defaultValue={ligne.quantite}
                          className="w-14 rounded-md border border-line px-2 py-1 text-sm"
                        />
                        <button
                          type="submit"
                          className="text-xs text-ink-soft underline hover:text-ink"
                        >
                          Mettre à jour
                        </button>
                      </form>
                      <form action={retirerDuPanier.bind(null, ligne.produits.id)}>
                        <button type="submit" className="text-xs text-ink-soft hover:text-red-600">
                          Retirer
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>

              <p className="mt-2 text-sm text-ink-soft">
                Total : <strong className="text-ink">{totalAtomes} Atomes</strong> — solde
                actuel : {soldeAtomes} Atomes
              </p>

              <form action={acheterPanierAtomes} className="mt-3">
                {contientPhysiqueEnAtomes && (
                  <fieldset className="mb-4 rounded-lg border border-line p-4">
                    <legend className="px-1 text-xs uppercase tracking-wide text-moss-700">
                      Adresse de livraison
                    </legend>
                    <p className="mb-3 text-xs text-ink-soft">
                      Requise car ton panier contient un objet physique.
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <input
                        type="text"
                        name="adresse_nom"
                        placeholder="Nom complet"
                        required
                        className="rounded-md border border-line px-3 py-2 text-sm sm:col-span-2"
                      />
                      <input
                        type="text"
                        name="adresse_ligne1"
                        placeholder="Adresse"
                        required
                        className="rounded-md border border-line px-3 py-2 text-sm sm:col-span-2"
                      />
                      <input
                        type="text"
                        name="adresse_code_postal"
                        placeholder="Code postal"
                        required
                        className="rounded-md border border-line px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        name="adresse_ville"
                        placeholder="Ville"
                        required
                        className="rounded-md border border-line px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        name="adresse_pays"
                        placeholder="Pays"
                        defaultValue="France"
                        className="rounded-md border border-line px-3 py-2 text-sm sm:col-span-2"
                      />
                    </div>
                  </fieldset>
                )}

                <button
                  type="submit"
                  disabled={soldeAtomes < totalAtomes}
                  className="rounded-md bg-moss-700 px-4 py-2 text-sm text-white transition hover:bg-moss-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Payer en Atomes
                </button>
              </form>
              {soldeAtomes < totalAtomes && (
                <p className="mt-2 text-xs text-red-600">
                  Solde insuffisant —{' '}
                  <Link href="/boutique/packs-atomes" className="underline">
                    acheter des Atomes
                  </Link>
                </p>
              )}
            </section>
          )}

          {articlesPhysiquesEuros.length > 0 && (
            <section>
              <h2 className="text-sm font-medium uppercase tracking-wide text-moss-700">
                Objets physiques — payables en euros
              </h2>
              <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
                {articlesPhysiquesEuros.map((ligne) => (
                  <li
                    key={ligne.produits.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">{ligne.produits.nom}</p>
                      <p className="text-xs text-ink-soft">
                        {((ligne.produits.prix_centimes ?? 0) / 100).toFixed(2)} € ×{' '}
                        {ligne.quantite}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <form
                        action={changerQuantitePanier.bind(null, ligne.produits.id)}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="number"
                          name="quantite"
                          min={1}
                          defaultValue={ligne.quantite}
                          className="w-14 rounded-md border border-line px-2 py-1 text-sm"
                        />
                        <button
                          type="submit"
                          className="text-xs text-ink-soft underline hover:text-ink"
                        >
                          Mettre à jour
                        </button>
                      </form>
                      <form action={retirerDuPanier.bind(null, ligne.produits.id)}>
                        <button type="submit" className="text-xs text-ink-soft hover:text-red-600">
                          Retirer
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-ink-soft">
                  Total : <strong className="text-ink">{(totalEuros / 100).toFixed(2)} €</strong>
                </p>
                <form action={checkoutPanierPhysique}>
                  <button
                    type="submit"
                    className="rounded-md bg-moss-700 px-4 py-2 text-sm text-white transition hover:bg-moss-800"
                  >
                    Payer en euros
                  </button>
                </form>
              </div>
              <p className="mt-2 text-xs text-ink-soft">
                L&apos;adresse de livraison est demandée lors du paiement Stripe.
              </p>
            </section>
          )}
        </div>
      )}
    </main>
  )
}
