import { FeasibilityApp } from '@/components/feasibility/app'

/**
 * The whole product, at the root.
 *
 * This is a public, single-page tool: no sign-in, no navigation, no dashboard.
 * A visitor lands here and starts a project. Everything they need is one linear
 * flow — what they are doing, the site, the scheme, the money, whether it
 * stacks up, whether it can be funded, and a PDF to take away.
 */
export default function Home() {
  return <FeasibilityApp />
}
