/**
 * Assemblies catalogue — bottom-up takeoff for the parts of a build a client
 * actually has a feel for.
 *
 * Most people cannot tell you a $/m² rate, but they can tell you "four
 * townhouses, two bathrooms each, one premium kitchen". Each assembly explodes
 * into priced sub-items that can be popped into the bill of quantities as
 * ordinary editable lines.
 *
 * Rates are indicative Sydney metro 2025–26, GST-exclusive, including labour
 * and materials but excluding builder's margin (which sits in its own trade).
 */

import type { Assembly, AppliedAssembly, BoqLine } from './types'

export const ASSEMBLIES: Assembly[] = [
  {
    key: 'standard_bathroom',
    name: 'Standard bathroom',
    description:
      'Around 5 m²: waterproofing, floor and wall tiling, vanity, tapware, toilet, shower screen, door, exhaust fan.',
    trade: 'fitout',
    driver: 'bathroom',
    subItems: [
      { label: 'Waterproofing', qty: 5, unit: 'm²', rate: 95, waste: 0.05 },
      { label: 'Floor & wall tiling (supply + lay)', qty: 22, unit: 'm²', rate: 145, waste: 0.1 },
      { label: 'Vanity & basin', qty: 1, unit: 'item', rate: 1_450, waste: 0 },
      { label: 'Tapware & shower set', qty: 1, unit: 'set', rate: 950, waste: 0 },
      { label: 'Toilet suite', qty: 1, unit: 'item', rate: 650, waste: 0 },
      { label: 'Shower screen', qty: 1, unit: 'item', rate: 900, waste: 0 },
      { label: 'Door, frame & hardware', qty: 1, unit: 'item', rate: 620, waste: 0 },
      { label: 'Exhaust fan & light', qty: 1, unit: 'item', rate: 380, waste: 0 },
    ],
  },
  {
    key: 'premium_ensuite',
    name: 'Premium ensuite',
    description:
      'Around 7 m² with a double vanity, freestanding shower, premium tile and tapware, heated towel rail.',
    trade: 'fitout',
    driver: 'ensuite',
    subItems: [
      { label: 'Waterproofing', qty: 7, unit: 'm²', rate: 95, waste: 0.05 },
      { label: 'Premium tiling (supply + lay)', qty: 30, unit: 'm²', rate: 260, waste: 0.12 },
      { label: 'Double vanity, stone top', qty: 1, unit: 'item', rate: 4_200, waste: 0 },
      { label: 'Premium tapware & shower set', qty: 1, unit: 'set', rate: 2_400, waste: 0 },
      { label: 'Wall-hung toilet suite', qty: 1, unit: 'item', rate: 1_650, waste: 0 },
      { label: 'Frameless shower screen', qty: 1, unit: 'item', rate: 2_100, waste: 0 },
      { label: 'Heated towel rail & underfloor heating', qty: 1, unit: 'item', rate: 1_800, waste: 0 },
      { label: 'Door, frame & hardware', qty: 1, unit: 'item', rate: 850, waste: 0 },
    ],
  },
  {
    key: 'standard_kitchen',
    name: 'Standard kitchen',
    description:
      'Mid-range kitchen: stone benchtops, laminate joinery, standard appliance package, tiled splashback.',
    trade: 'fitout',
    driver: 'kitchen',
    subItems: [
      { label: 'Base & overhead joinery', qty: 7, unit: 'lm', rate: 1_150, waste: 0.05 },
      { label: 'Stone benchtop (supply + install)', qty: 5.5, unit: 'm²', rate: 780, waste: 0.1 },
      { label: 'Appliance package (oven, cooktop, rangehood, dishwasher)', qty: 1, unit: 'set', rate: 4_800, waste: 0 },
      { label: 'Sink & tapware', qty: 1, unit: 'set', rate: 950, waste: 0 },
      { label: 'Tiled splashback', qty: 4, unit: 'm²', rate: 180, waste: 0.12 },
      { label: 'Electrical & plumbing rough-in', qty: 1, unit: 'item', rate: 1_850, waste: 0 },
      { label: 'Install & adjust', qty: 1, unit: 'item', rate: 1_200, waste: 0 },
    ],
  },
  {
    key: 'premium_kitchen',
    name: 'Premium kitchen',
    description:
      'Premium two-pack joinery, integrated appliances, butler’s pantry, stone island with waterfall ends.',
    trade: 'fitout',
    driver: 'kitchen',
    subItems: [
      { label: 'Two-pack joinery, base & overhead', qty: 9, unit: 'lm', rate: 2_650, waste: 0.05 },
      { label: 'Butler’s pantry joinery', qty: 4, unit: 'lm', rate: 1_950, waste: 0.05 },
      { label: 'Stone benchtop & waterfall island', qty: 11, unit: 'm²', rate: 1_450, waste: 0.12 },
      { label: 'Integrated appliance package', qty: 1, unit: 'set', rate: 18_500, waste: 0 },
      { label: 'Undermount sink & premium tapware', qty: 1, unit: 'set', rate: 2_600, waste: 0 },
      { label: 'Electrical & plumbing rough-in', qty: 1, unit: 'item', rate: 2_800, waste: 0 },
      { label: 'Install & adjust', qty: 1, unit: 'item', rate: 3_200, waste: 0 },
    ],
  },
  {
    key: 'suspended_slab',
    name: 'Suspended concrete slab',
    description: 'Reinforced suspended slab — formwork, reinforcement, concrete supply, place and finish.',
    trade: 'substructure',
    driver: 'm² of slab',
    subItems: [
      { label: 'Formwork & propping', qty: 1, unit: 'm²', rate: 145, waste: 0.05 },
      { label: 'Reinforcement (supply & fix)', qty: 1, unit: 'm²', rate: 95, waste: 0.05 },
      { label: 'Concrete supply & place', qty: 1, unit: 'm²', rate: 135, waste: 0.05 },
      { label: 'Finish, cure & strip', qty: 1, unit: 'm²', rate: 45, waste: 0 },
    ],
  },
  {
    key: 'colorbond_roof',
    name: 'Colorbond roof',
    description: 'Pitched Colorbond sheet roof with sarking, battens, gutters and downpipes.',
    trade: 'envelope',
    driver: 'm² of roof',
    subItems: [
      { label: 'Roof sheeting (supply & fix)', qty: 1, unit: 'm²', rate: 78, waste: 0.1 },
      { label: 'Sarking & insulation', qty: 1, unit: 'm²', rate: 28, waste: 0.08 },
      { label: 'Battens & fixings', qty: 1, unit: 'm²', rate: 32, waste: 0.08 },
      { label: 'Gutters & downpipes (pro rata)', qty: 1, unit: 'm²', rate: 31, waste: 0.05 },
    ],
  },
  {
    key: 'basement_bay',
    name: 'Basement carpark bay',
    description: 'Per-bay all-in: excavation and slab share, ventilation, lighting, paint, line-marking.',
    trade: 'substructure',
    driver: 'bay',
    subItems: [
      { label: 'Excavation & spoil removal (share)', qty: 1, unit: 'bay', rate: 5_600, waste: 0 },
      { label: 'Slab, walls & waterproofing (share)', qty: 1, unit: 'bay', rate: 5_800, waste: 0.05 },
      { label: 'Ventilation & fire services (share)', qty: 1, unit: 'bay', rate: 1_900, waste: 0 },
      { label: 'Lighting, paint & line-marking', qty: 1, unit: 'bay', rate: 800, waste: 0 },
    ],
  },
  {
    key: 'concrete_driveway',
    name: 'Concrete driveway',
    description: 'Reinforced concrete driveway with sub-base preparation and a finished surface.',
    trade: 'external_works',
    driver: 'm² of driveway',
    subItems: [
      { label: 'Excavate & prepare sub-base', qty: 1, unit: 'm²', rate: 42, waste: 0.05 },
      { label: 'Reinforcement & concrete supply', qty: 1, unit: 'm²', rate: 78, waste: 0.05 },
      { label: 'Place, finish & cure', qty: 1, unit: 'm²', rate: 35, waste: 0 },
    ],
  },
  {
    key: 'landscaping_package',
    name: 'Landscaping package',
    description: 'Turf, garden beds, planting, irrigation, fencing and a paved courtyard per dwelling.',
    trade: 'external_works',
    driver: 'dwelling',
    subItems: [
      { label: 'Site preparation & topsoil', qty: 1, unit: 'dwelling', rate: 2_400, waste: 0 },
      { label: 'Turf & planting', qty: 1, unit: 'dwelling', rate: 3_200, waste: 0.05 },
      { label: 'Irrigation', qty: 1, unit: 'dwelling', rate: 1_400, waste: 0 },
      { label: 'Fencing & gates', qty: 1, unit: 'dwelling', rate: 4_100, waste: 0.05 },
      { label: 'Paved courtyard', qty: 1, unit: 'dwelling', rate: 3_600, waste: 0.08 },
    ],
  },
]

export function assemblyByKey(key: string): Assembly | undefined {
  return ASSEMBLIES.find((a) => a.key === key)
}

/** Cost of one driver unit of an assembly, waste included. */
export function assemblyUnitCost(assembly: Assembly): number {
  return assembly.subItems.reduce(
    (sum, item) => sum + item.qty * item.rate * (1 + (item.waste || 0)),
    0
  )
}

export function appliedAssemblyCost(applied: AppliedAssembly): number {
  const assembly = assemblyByKey(applied.assemblyKey)
  if (!assembly) return 0
  const qty = Math.max(assembly.moq ?? 0, applied.driverQty)
  return assemblyUnitCost(assembly) * qty
}

/**
 * Explode an applied assembly into BoQ lines, scaling each sub-item by the
 * driver quantity.
 */
export function assemblyToBoqLines(applied: AppliedAssembly): Omit<BoqLine, 'id'>[] {
  const assembly = assemblyByKey(applied.assemblyKey)
  if (!assembly) return []
  const qty = Math.max(assembly.moq ?? 0, applied.driverQty)

  return assembly.subItems.map((item) => ({
    trade: assembly.trade,
    label: `${assembly.name} — ${item.label}`,
    qty: item.qty * qty,
    unit: item.unit,
    rate: item.rate,
    waste: item.waste,
    fromAssembly: true,
  }))
}
