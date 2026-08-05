import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Lazily-constructed Supabase client.
 *
 * `createClient` throws when the URL is empty, and constructing it at module
 * scope meant that throw happened while Next.js collected page data at build
 * time — so the whole build failed on any machine without the environment
 * variables set, even though nothing actually talks to Supabase during a build.
 *
 * Deferring construction to first property access keeps the export shape
 * identical for every existing caller, lets the build succeed without secrets,
 * and turns a missing configuration into a clear runtime error on the one route
 * that needed it rather than an opaque build crash.
 */

let client: SupabaseClient | null = null

/**
 * Whether the database is available at all.
 *
 * The public assessment tool never touches Supabase — it is entirely
 * client-side arithmetic — so the site must work with these unset. Only the
 * internal credit pages need a database, and they should say so plainly rather
 * than returning a 500 that reads as "the whole app is broken".
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

/** Thrown when a database-backed route is called without configuration. */
export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super(
      'This feature needs a database. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment. The feasibility assessment does not require it.'
    )
    this.name = 'SupabaseNotConfiguredError'
  }
}

function getClient(): SupabaseClient {
  if (client) return client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) throw new SupabaseNotConfiguredError()

  client = createClient(url, anonKey)
  return client
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, property, receiver) {
    const resolved = getClient()
    const value = Reflect.get(resolved, property, receiver)
    // Methods have to stay bound to the real client, or `this` is the proxy.
    return typeof value === 'function' ? value.bind(resolved) : value
  },
})
