import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

/**
 * Ce client contourne RLS entièrement (clé service_role).
 * À N'UTILISER QUE dans des Route Handlers serveur non exposés au client,
 * typiquement le webhook Stripe. Ne jamais importer ce fichier dans un
 * Client Component ni dans du code qui pourrait finir dans le bundle navigateur.
 */
export function createServiceRoleClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
