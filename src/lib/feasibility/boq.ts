/**
 * Trade-level bill of quantities.
 *
 * The BoQ starts as the Quick construction number split across nine trade
 * categories. While it is untouched it changes nothing — the rate-library
 * figure stays in effect. The moment a client edits a quantity, rate or label
 * it becomes the construction cost, so a real QS estimate or builder quote can
 * be typed in line by line without rebuilding the model.
 */

import { TRADE_ORDER, TRADE_SPLIT } from './rates'
import type { BoqLine, BoqState, TradeKey } from './types'

/** Line total including its waste allowance. */
export function boqLineTotal(line: BoqLine): number {
  return line.qty * line.rate * (1 + (line.waste || 0))
}

export function boqTotal(lines: BoqLine[]): number {
  return lines.reduce((sum, line) => sum + boqLineTotal(line), 0)
}

export function boqTradeTotal(lines: BoqLine[], trade: TradeKey): number {
  return boqTotal(lines.filter((l) => l.trade === trade))
}

let lineCounter = 0
function nextId(prefix: string): string {
  lineCounter += 1
  return `${prefix}-${lineCounter}`
}

/**
 * Seed a BoQ from a construction total, one lump-sum line per trade.
 *
 * The seed is deliberately a single line per trade rather than a fully
 * exploded estimate — the split is indicative, and pretending to more precision
 * than the rate library has would be misleading.
 */
export function seedBoq(constructionTotal: number): BoqState {
  const lines: BoqLine[] = TRADE_ORDER.map((trade) => ({
    id: nextId(trade),
    trade,
    label: 'Lump sum (seeded from the Quick construction figure)',
    qty: 1,
    unit: 'item',
    rate: constructionTotal * TRADE_SPLIT[trade],
    waste: 0,
  }))

  return { touched: false, lines, seedTotal: constructionTotal }
}

/**
 * Re-seed while preserving anything that came from the assemblies catalogue —
 * those are real priced lines the client built deliberately.
 */
export function reseedBoq(state: BoqState, constructionTotal: number): BoqState {
  const kept = state.lines.filter((l) => l.fromAssembly)
  const keptTotal = boqTotal(kept)
  const remaining = Math.max(0, constructionTotal - keptTotal)

  const seeded: BoqLine[] = TRADE_ORDER.map((trade) => ({
    id: nextId(trade),
    trade,
    label: 'Lump sum (seeded from the Quick construction figure)',
    qty: 1,
    unit: 'item',
    rate: remaining * TRADE_SPLIT[trade],
    waste: 0,
  }))

  return {
    touched: kept.length > 0,
    lines: [...seeded, ...kept],
    seedTotal: constructionTotal,
  }
}

export function addBoqLine(state: BoqState, trade: TradeKey): BoqState {
  return {
    ...state,
    touched: true,
    lines: [
      ...state.lines,
      { id: nextId(trade), trade, label: 'New line', qty: 1, unit: 'item', rate: 0, waste: 0 },
    ],
  }
}

export function updateBoqLine(
  state: BoqState,
  id: string,
  patch: Partial<BoqLine>
): BoqState {
  return {
    ...state,
    touched: true,
    lines: state.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)),
  }
}

export function removeBoqLine(state: BoqState, id: string): BoqState {
  return { ...state, touched: true, lines: state.lines.filter((l) => l.id !== id) }
}

/** Import assembly-derived lines as ordinary, editable BoQ rows. */
export function appendLines(state: BoqState, lines: Omit<BoqLine, 'id'>[]): BoqState {
  return {
    ...state,
    touched: true,
    lines: [
      ...state.lines,
      ...lines.map((l) => ({ ...l, id: nextId('asm'), fromAssembly: true })),
    ],
  }
}
