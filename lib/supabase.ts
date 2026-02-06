import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

let client: SupabaseClient | null = null

/**
 * Server-side Supabase client with service role (full access).
 * Use only in API routes or server code. Do not expose service role key to the client.
 */
export function getSupabase(): SupabaseClient | null {
  if (!url || !serviceRoleKey) return null
  if (!client) {
    client = createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
    })
  }
  return client
}

export function isSupabaseConfigured(): boolean {
  return Boolean(url && serviceRoleKey)
}
