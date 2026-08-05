import { NextRequest, NextResponse } from 'next/server'

import { supabase } from '@/lib/supabase'
import { feasibilityToDealSeed } from '@/lib/feasibility/bridge'
import { defaultFeasibilityInputs } from '@/lib/feasibility/engine'
import type { FeasibilityInputs } from '@/lib/feasibility/types'
import { apiError } from '@/lib/api-error'

/**
 * Create a lender-side assessment seeded from a client feasibility.
 *
 * The feasibility itself lives entirely in the browser, so this is the one
 * point where a client's numbers reach the database — and only when they
 * explicitly ask to hand the deal over to the credit side.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Merge over the defaults so a payload from an older share link still
    // produces a complete seed rather than nulls in numeric columns.
    const inputs: FeasibilityInputs = {
      ...defaultFeasibilityInputs,
      ...(body?.inputs ?? {}),
      overrides: {
        ...defaultFeasibilityInputs.overrides,
        ...(body?.inputs?.overrides ?? {}),
      },
      boq: body?.inputs?.boq ?? defaultFeasibilityInputs.boq,
      appliedAssemblies: body?.inputs?.appliedAssemblies ?? [],
    }

    const { deal_products, ...seed } = feasibilityToDealSeed(inputs)

    const { data: deal, error } = await supabase
      .from('deals')
      .insert([seed])
      .select()
      .single()

    if (error) throw error

    // Products live in their own table, keyed off the new deal.
    if (deal?.id && deal_products.length > 0) {
      const { error: productError } = await supabase
        .from('deal_products')
        .insert(deal_products.map((p) => ({ ...p, deal_id: deal.id })))

      // A failed product insert is worth surfacing, but the deal itself was
      // created — so report it rather than losing the whole hand-off.
      if (productError) {
        console.error('deal_products insert failed:', productError)
        return NextResponse.json({
          id: deal.id,
          warning: `Assessment created, but the product lines did not save: ${productError.message}`,
        })
      }
    }

    return NextResponse.json({ id: deal.id })
  } catch (err) {
    return apiError('POST /api/feasibility/to-deal', err)
  }
}
