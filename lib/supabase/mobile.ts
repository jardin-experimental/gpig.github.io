import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

/**
 * Équivalent de lib/supabase/server.ts, mais pour les requêtes venant de
 * l'app mobile (Expo), qui n'a pas de cookies partagés avec le site et
 * envoie son jeton de session dans le header Authorization.
 *
 * Important : ce client garde bien le contexte RLS de l'utilisateur (on ne
 * bascule PAS sur la clé service-role) — les mêmes règles de sécurité que
 * sur le web s'appliquent.
 */
export function createMobileClient(accessToken: string) {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  )
}

/**
 * À utiliser en tête de chaque route API destinée au mobile :
 *
 *   const { user, supabase } = await getMobileUser(request)
 *   if (!user || !supabase) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 */
export async function getMobileUser(request: Request) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '')

  if (!token) return { user: null, supabase: null }

  const supabase = createMobileClient(token)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { user: null, supabase: null }

  return { user, supabase }
}
