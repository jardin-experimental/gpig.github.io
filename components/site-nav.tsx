import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/(auth)/actions'
import { SiteNavClient } from './site-nav-client'

export async function SiteNav() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isAdmin = false
  let atomes = 0
  let articlesPanier = 0

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.role === 'administrateur'

    const [{ data: soldeAtomes }, { data: panier }] = await Promise.all([
      supabase.rpc('mes_atomes_disponibles'),
      supabase.from('panier_items').select('quantite'),
    ])

    atomes = soldeAtomes ?? 0
    articlesPanier = panier?.reduce((total, item) => total + item.quantite, 0) ?? 0
  }

  return (
    <SiteNavClient
      isLoggedIn={!!user}
      isAdmin={isAdmin}
      atomes={atomes}
      articlesPanier={articlesPanier}
      signOut={signOut}
    />
  )
}