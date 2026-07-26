'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type ActionState = { error: string | null; success: string | null }

export async function redeemGiftCard(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const code = (formData.get('code') as string)?.trim().toUpperCase()

  if (!code) {
    return { error: 'Merci de saisir un code.', success: null }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('redeem_gift_card', { p_code: code }).single()

  if (error) {
    return { error: error.message, success: null }
  }

  revalidatePath('/dashboard')

  if (data.type === 'formation' && data.formation_slug) {
    return { error: null, success: `Accès débloqué : ${data.formation_slug}` }
  }

  return {
    error: null,
    success: `${((data.credit_ajoute ?? 0) / 100).toFixed(2)} € de crédit ajoutés à votre compte.`,
  }
}
