'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'

// Ajoute un produit au panier de l'utilisateur connecté puis redirige vers
// le panier. Passe par la fonction RPC ajouter_au_panier (voir migration
// 0013_boutique.sql) qui vérifie la disponibilité du produit côté serveur.
export async function ajouterAuPanier(produitId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/boutique')

  const { error } = await supabase.rpc('ajouter_au_panier', {
    p_produit_id: produitId,
    p_quantite: 1,
  })

  if (error) {
    console.error('Ajout au panier impossible', error)
  }

  revalidatePath('/boutique/panier')
  redirect('/boutique/panier')
}

// Retire complètement un produit du panier.
export async function retirerDuPanier(produitId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/boutique/panier')

  await supabase.rpc('modifier_quantite_panier', {
    p_produit_id: produitId,
    p_quantite: 0,
  })

  revalidatePath('/boutique/panier')
}

// Change la quantité d'un article du panier (formulaire avec input number).
export async function changerQuantitePanier(produitId: string, formData: FormData) {
  const quantite = Number(formData.get('quantite') ?? 1)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/boutique/panier')

  await supabase.rpc('modifier_quantite_panier', {
    p_produit_id: produitId,
    p_quantite: quantite,
  })

  revalidatePath('/boutique/panier')
}

// Paie en une fois, via la monnaie Atomes, tous les articles du panier
// (numériques ou physiques) qui ont un prix_atomes — voir la fonction RPC
// acheter_panier_atomes. Si le panier contient un article physique, une
// adresse de livraison est requise (collectée via le formulaire du panier).
export async function acheterPanierAtomes(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/boutique/panier')

  const nom = formData.get('adresse_nom')?.toString().trim()
  const ligne1 = formData.get('adresse_ligne1')?.toString().trim()
  const codePostal = formData.get('adresse_code_postal')?.toString().trim()
  const ville = formData.get('adresse_ville')?.toString().trim()
  const pays = formData.get('adresse_pays')?.toString().trim()

  const adresse =
    nom || ligne1 || codePostal || ville
      ? {
          nom: nom || null,
          ligne1: ligne1 || null,
          code_postal: codePostal || null,
          ville: ville || null,
          pays: pays || 'FR',
        }
      : null

  const { error } = await supabase.rpc('acheter_panier_atomes', { p_adresse: adresse })

  if (error) {
    redirect(`/boutique/panier?erreur=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/boutique/panier')
  redirect('/boutique/panier?achat=succes')
}

// Fige les articles physiques du panier dans une commande 'en_attente'
// (preparer_commande_panier_physique) puis part vers un Checkout Stripe
// itemisé, avec collecte de l'adresse de livraison. Le webhook finalise
// la commande à réception de checkout.session.completed.
export async function checkoutPanierPhysique() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/boutique/panier')

  const { data: commande, error } = await supabase.rpc('preparer_commande_panier_physique')

  if (error || !commande) {
    redirect(
      `/boutique/panier?erreur=${encodeURIComponent(
        error?.message ?? 'Panier physique vide'
      )}`
    )
    return
  }

  const { data: lignes } = await supabase
    .from('boutique_commande_items')
    .select('quantite, prix_unitaire_centimes, produits(nom)')
    .eq('order_id', commande.id)

  const lineItems = (lignes ?? []).map((ligne) => ({
    price_data: {
      currency: 'eur',
      unit_amount: ligne.prix_unitaire_centimes ?? 0,
      product_data: { name: ligne.produits?.nom ?? 'Produit GPIG' },
      tax_behavior: 'exclusive' as const,
    },
    quantity: ligne.quantite,
  }))

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: user.email,
    line_items: lineItems,
    shipping_address_collection: { allowed_countries: ['FR', 'BE', 'CH', 'LU'] },
    automatic_tax: { enabled: true },
    metadata: {
      user_id: user.id,
      type: 'boutique',
      order_id: commande.id,
    },
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/boutique/panier?paiement=succes`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/boutique/panier?paiement=annule`,
  })

  if (!session.url) throw new Error('Session Stripe invalide')
  redirect(session.url)
}
