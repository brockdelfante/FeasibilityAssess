/**
 * Wizard state.
 *
 * Results recompute on every input change, which is what makes the assessment
 * feel live.
 *
 * The expensive analyses — the scale grid alone runs 300 full engine passes —
 * are deliberately NOT computed here. They are memoised inside the panels that
 * display them, keyed on `inputs`. That gives the same laziness (a panel only
 * mounts once its accordion section is opened) and the same caching, without a
 * store write during render, which React rightly warns about.
 */

import { create } from 'zustand'
import { appendLines, reseedBoq, seedBoq } from './boq'
import { assemblyToBoqLines } from './assemblies'
import { computeCore, defaultFeasibilityInputs, runFeasibility } from './engine'
import type {
  AppliedAssembly,
  BoqLine,
  FeasibilityInputs,
  FeasibilityResults,
  FeasibilityOverrides,
} from './types'

/** The wizard's steps, in order. */
export const STEPS = [
  {
    key: 'intent',
    title: 'Your goal',
    blurb: 'What are you trying to do with this property?',
  },
  {
    key: 'site',
    title: 'The site',
    blurb: 'Where it is, what you would build, and what it is worth.',
  },
  {
    key: 'quality',
    title: 'Quality & risk',
    blurb: 'How it is built, how hard the site is, and how it is funded.',
  },
  {
    key: 'money',
    title: 'Tax & timing',
    blurb: 'Duty, land tax, GST, program length and your target return.',
  },
  {
    key: 'results',
    title: 'Does it stack up?',
    blurb: 'Your feasibility, with every number traceable.',
  },
  {
    key: 'funding',
    title: 'Can I fund it?',
    blurb: 'What a lender will advance, what you have to find, and how to cover a gap.',
  },
  {
    key: 'report',
    title: 'Your report',
    blurb: 'Take the whole assessment away as a PDF.',
  },
] as const

export type StepKey = (typeof STEPS)[number]['key']

interface FeasibilityStore {
  inputs: FeasibilityInputs
  results: FeasibilityResults
  stepIndex: number
  /** Steps the client has completed, so the stepper can show progress. */
  visited: Set<number>
  disclaimerAccepted: boolean

  setInputs: (patch: Partial<FeasibilityInputs>) => void
  setOverride: (key: keyof FeasibilityOverrides, value: number | null) => void
  clearAllOverrides: () => void
  replaceInputs: (inputs: FeasibilityInputs) => void
  resetAll: () => void

  goToStep: (index: number) => void
  next: () => void
  back: () => void
  acceptDisclaimer: () => void

  // Bill of quantities
  seedBoqFromQuick: () => void
  updateBoqLine: (id: string, patch: Partial<BoqLine>) => void
  addBoqLine: (trade: BoqLine['trade']) => void
  removeBoqLine: (id: string) => void

  // Assemblies
  applyAssembly: (assemblyKey: string, driverQty: number) => void
  removeAppliedAssembly: (id: string) => void
  popAssemblyIntoBoq: (id: string) => void

}

let assemblyCounter = 0

/**
 * Some inputs only make sense for some modes. Rather than showing a client an
 * irrelevant field, switching mode normalises the values that would otherwise
 * quietly distort the answer — a renovation has no purchase price, an
 * owner-occupier builds one home.
 */
function normaliseForMode(inputs: FeasibilityInputs): FeasibilityInputs {
  const next = { ...inputs }

  if (next.mode === 'ppr') {
    next.yield = 1
    next.gstTreatment = 'none'
    next.landTaxExempt = true
    if (next.pprSubMode === 'knock_down_rebuild') next.purchasePrice = 0
  }

  if (next.mode === 'renovate') {
    next.yield = 1
    next.devType = 'renovation'
    next.gstTreatment = 'none'
    next.landTaxExempt = true
    // A renovation is on a home already owned, so there is nothing to buy.
    next.purchasePrice = 0
  }

  if (next.mode === 'buy_to_hold') {
    next.gstTreatment = 'none'
  }

  return next
}

export const useFeasibilityStore = create<FeasibilityStore>((set, get) => ({
  inputs: defaultFeasibilityInputs,
  results: runFeasibility(defaultFeasibilityInputs),
  stepIndex: 0,
  visited: new Set([0]),
  disclaimerAccepted: false,

  setInputs: (patch) =>
    set((state) => {
      const inputs = normaliseForMode({ ...state.inputs, ...patch })
      return {
        inputs,
        results: runFeasibility(inputs),
      }
    }),

  setOverride: (key, value) =>
    set((state) => {
      const inputs = {
        ...state.inputs,
        overrides: { ...state.inputs.overrides, [key]: value },
      }
      return { inputs, results: runFeasibility(inputs) }
    }),

  clearAllOverrides: () =>
    set((state) => {
      const inputs = {
        ...state.inputs,
        overrides: { ...defaultFeasibilityInputs.overrides },
        boq: { ...state.inputs.boq, touched: false },
      }
      return { inputs, results: runFeasibility(inputs) }
    }),

  replaceInputs: (inputs) =>
    set(() => ({
      inputs,
      results: runFeasibility(inputs),
    })),

  resetAll: () =>
    set(() => ({
      inputs: defaultFeasibilityInputs,
      results: runFeasibility(defaultFeasibilityInputs),
      stepIndex: 0,
      visited: new Set([0]),
    })),

  goToStep: (index) =>
    set((state) => {
      const clamped = Math.max(0, Math.min(STEPS.length - 1, index))
      const visited = new Set(state.visited)
      visited.add(clamped)
      return { stepIndex: clamped, visited }
    }),

  next: () => get().goToStep(get().stepIndex + 1),
  back: () => get().goToStep(get().stepIndex - 1),
  acceptDisclaimer: () => set({ disclaimerAccepted: true }),

  // --- bill of quantities ---

  seedBoqFromQuick: () =>
    set((state) => {
      const construction = computeCore({
        ...state.inputs,
        boq: { touched: false, lines: [], seedTotal: 0 },
        overrides: { ...state.inputs.overrides, construction: null },
      }).amounts.construction
      const boq =
        state.inputs.boq.lines.length > 0
          ? reseedBoq(state.inputs.boq, construction)
          : seedBoq(construction)
      const inputs = { ...state.inputs, boq }
      return { inputs, results: runFeasibility(inputs) }
    }),

  updateBoqLine: (id, patch) =>
    set((state) => {
      const boq = {
        ...state.inputs.boq,
        touched: true,
        lines: state.inputs.boq.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)),
      }
      const inputs = { ...state.inputs, boq }
      return { inputs, results: runFeasibility(inputs) }
    }),

  addBoqLine: (trade) =>
    set((state) => {
      assemblyCounter += 1
      const boq = {
        ...state.inputs.boq,
        touched: true,
        lines: [
          ...state.inputs.boq.lines,
          {
            id: `manual-${assemblyCounter}`,
            trade,
            label: 'New line',
            qty: 1,
            unit: 'item',
            rate: 0,
            waste: 0,
          },
        ],
      }
      const inputs = { ...state.inputs, boq }
      return { inputs, results: runFeasibility(inputs) }
    }),

  removeBoqLine: (id) =>
    set((state) => {
      const boq = {
        ...state.inputs.boq,
        touched: true,
        lines: state.inputs.boq.lines.filter((l) => l.id !== id),
      }
      const inputs = { ...state.inputs, boq }
      return { inputs, results: runFeasibility(inputs) }
    }),

  // --- assemblies ---

  applyAssembly: (assemblyKey, driverQty) =>
    set((state) => {
      assemblyCounter += 1
      const applied: AppliedAssembly = {
        id: `applied-${assemblyCounter}`,
        assemblyKey,
        driverQty,
        poppedIntoBoq: false,
      }
      const inputs = {
        ...state.inputs,
        appliedAssemblies: [...state.inputs.appliedAssemblies, applied],
      }
      return { inputs, results: runFeasibility(inputs) }
    }),

  removeAppliedAssembly: (id) =>
    set((state) => {
      const inputs = {
        ...state.inputs,
        appliedAssemblies: state.inputs.appliedAssemblies.filter((a) => a.id !== id),
      }
      return { inputs, results: runFeasibility(inputs) }
    }),

  popAssemblyIntoBoq: (id) =>
    set((state) => {
      const applied = state.inputs.appliedAssemblies.find((a) => a.id === id)
      if (!applied) return state

      // Seed the BoQ first if it is still empty, otherwise the assembly lines
      // would become the entire construction cost.
      let boq = state.inputs.boq
      if (boq.lines.length === 0) {
        const construction = computeCore({
          ...state.inputs,
          boq: { touched: false, lines: [], seedTotal: 0 },
        }).amounts.construction
        boq = seedBoq(construction)
      }

      boq = appendLines(boq, assemblyToBoqLines(applied))

      const inputs = {
        ...state.inputs,
        boq,
        appliedAssemblies: state.inputs.appliedAssemblies.map((a) =>
          a.id === id ? { ...a, poppedIntoBoq: true } : a
        ),
      }
      return { inputs, results: runFeasibility(inputs) }
    }),

}))
