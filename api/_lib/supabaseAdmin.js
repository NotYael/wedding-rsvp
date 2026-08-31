import { createClient } from '@supabase/supabase-js'

/**
 * Server-only Supabase client.
 *
 * The secret key bypasses RLS, which is required here: `guests` has no UPDATE
 * policy and its SELECT policy is admin-only, so neither the party lookup nor
 * the confirmation write-back is possible with the publishable key.
 *
 * This module must never be imported from anything under src/ -- that would
 * pull the secret key into the browser bundle.
 */
const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
const secretKey = process.env.SUPABASE_SECRET_KEY

export const missingConfig = () => {
  const missing = []
  if (!url) missing.push('SUPABASE_URL')
  if (!secretKey) missing.push('SUPABASE_SECRET_KEY')
  return missing
}

export const supabaseAdmin = () =>
  createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } })
