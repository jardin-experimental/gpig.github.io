'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type ActionState = { error: string | null }

export async function signUp(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string

  if (!email || !password || !username) {
    return { error: 'Tous les champs sont requis.' }
  }
  if (password.length < 8) {
    return { error: 'Le mot de passe doit contenir au moins 8 caractères.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username, display_name: username },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    // On ne remonte jamais le message brut de Supabase (évite l'énumération de comptes)
    return { error: "Inscription impossible. Vérifiez vos informations." }
  }

  redirect('/verifiez-vos-emails')
}

export async function signIn(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email et mot de passe requis.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Identifiants incorrects.' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

type ProfileActionState = { error: string | null; success: string | null }

const USERNAME_REGEX = /^[a-z0-9_-]{3,20}$/

export async function updateProfile(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non authentifié.', success: null }
  }

  const display_name = (formData.get('display_name') as string)?.trim() || null
  const bio = (formData.get('bio') as string)?.trim() || null
  const avatar_url = (formData.get('avatar_url') as string)?.trim() || null
  const usernameRaw = (formData.get('username') as string)?.trim().toLowerCase()

  if (!usernameRaw || !USERNAME_REGEX.test(usernameRaw)) {
    return {
      error:
        "Le nom d'utilisateur doit contenir entre 3 et 20 caractères (lettres minuscules, chiffres, tirets, underscores).",
      success: null,
    }
  }

  if (bio && bio.length > 280) {
    return { error: 'La bio ne peut pas dépasser 280 caractères.', success: null }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ username: usernameRaw, display_name, bio, avatar_url })
    .eq('id', user.id)

  if (error) {
    // Code 23505 = violation de contrainte unique (username déjà pris)
    if (error.code === '23505') {
      return { error: 'Ce nom d’utilisateur est déjà pris.', success: null }
    }
    return { error: 'Mise à jour impossible.', success: null }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/profil')
  return { error: null, success: 'Profil mis à jour.' }
}
