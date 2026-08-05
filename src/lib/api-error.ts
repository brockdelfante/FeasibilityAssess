import { NextResponse } from 'next/server'

import { SupabaseNotConfiguredError } from './supabase'

/**
 * Turn a thrown route error into an honest HTTP response.
 *
 * A missing database is a 503, not a 500. The distinction matters more than it
 * sounds: a 500 says "this application is broken", which sent someone looking
 * for a bug in the code when the actual answer was "an environment variable is
 * not set". The public feasibility tool needs no database at all, so a
 * misconfigured one must never make the site look broken.
 */
export function apiError(context: string, err: unknown): NextResponse {
  if (err instanceof SupabaseNotConfiguredError) {
    console.warn(`${context}: database not configured`)
    return NextResponse.json(
      { error: err.message, code: 'database_not_configured' },
      { status: 503 }
    )
  }

  const message = err instanceof Error ? err.message : 'Unexpected error'
  console.error(`${context}:`, err)
  return NextResponse.json({ error: message }, { status: 500 })
}
