'use client'

/**
 * The tool used to live here. It is now the whole site, at the root.
 *
 * This redirect exists for share links that were created before the move. The
 * project is encoded in the URL fragment, and a fragment never reaches the
 * server, so the redirect has to happen client-side to carry it across —
 * `next.config` rewrites would silently drop it and the recipient would land on
 * a blank form.
 */

import * as React from 'react'
import { useRouter } from 'next/navigation'

export default function FeasibilityRedirect() {
  const router = useRouter()

  React.useEffect(() => {
    router.replace(`/${window.location.hash}`)
  }, [router])

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <p className="text-sm text-muted-foreground">Taking you to your assessment…</p>
    </div>
  )
}
