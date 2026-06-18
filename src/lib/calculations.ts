import { addMonths } from 'date-fns'

export interface Product {
  numLots: number
  description: string
  areaSqm: number
  grossAICValuation: number
  qualifyingPresaleValue: number
  nonQualifyingPresaleValue: number
}

export interface DealInputs {
  dealType: 'construction' | 'subdivision'
  customerGroup: string
  projectAddress: string
  products: Product[]
  loanTermMonths: number
  buildTermMonths: number
  startDate: Date
  interestRate: number
  interestMargin: number
  lineFeeRate: number
  lafRate: number
  gstMethod: 'standard' | 'margin_scheme'
  salesCommissionRate: number
  presaleCommissionRate: number
  landAcquisitionCost: number

  // Costs
  siteValue: number
  preliminaries: number
  construction: number
  constructionContingency: number
  professionalFees: number
  councilContributions: number
  authorityFees: number
  establishmentFees: number
  legalFees: number
  developmentContingency: number
  customerCashEquity: number

  // Finance
  interestCapitalizationEnabled: boolean
  gstOverdraftLimit: number
  targetRoc?: number

  // Mezzanine
  mezzEnabled: boolean
  mezzAmount: number
  mezzInterestRate: number
  mezzAppFeeRate: number
  mezzBrokerFeeRate: number
  mezzLegalFees: number

  // Indirect
  marketingSellingCost: number
  legalFeesIndirect: number
  ratesTaxes: number
  financeCostsIndirect: number
  otherIndirectCosts: number

  // Security
  additionalSecurityFmv: number
  additionalSecurityExtended: number
}

export interface MonthlyRow {
  month: number
  date: Date
  draws: number
  gstIncurred: number
  gstReturns: number
  interestCharge: number
  lineFee: number
  repayment: number
  openingBalance: number
  closingBalance: number
  gstOverdraftOpening: number
  gstOverdraftClosing: number
}

export interface CalculationResults {
  grv: number
  totalLots: number
  totalGFA: number
  gst: number
  nrv: number
  sellingCosts: number
  totalSellingCosts: number
  netRealisations: number
  netRealisationsPerSqm: number
  peakDebt: number
  totalInterest: number
  totalLineFees: number
  averagePDFBalance: number
  totalDirectCosts: number
  totalIndirectCosts: number
  totalDevelopmentCosts: number
  seniorFunding: number
  ltc: number
  lvrGross: number
  lvrNet: number
  roc: number
  roe: number
  profitAmount: number
  profitMargin: number

  // Exit Scenarios
  residualANZDebt: number
  residualLVRBase: number
  residualLVRWithSecurity: number
  residualLVRWithGSTOD: number

  // For UI compatibility
  grossResidualValue: number
  netResidualValue: number
  residualLVR: number

  salesToRepay: number
  qualifyingPresalesCover: number
  allPresalesCover: number
  constructionCostPerSqm: number
  rlv: number
  blendedRate: number
  profitPerUnit: number
  costPerUnit: number
  mezzTotalInterest?: number
  mezzTotalRepayment?: number
  blendedTotalDebt?: number
  mezzLVR?: number
  mezzLTC?: number
  cashflow: MonthlyRow[]
  fundingTable: any[]
}

export interface ScenarioAdjustment {
  grvAdjustment: number
  costAdjustment: number
  interestAdjustment: number
}

const S_CURVE_TABLE: [number, number][] = [
  [0.00, 0.000], [0.02, 0.010], [0.04, 0.020], [0.06, 0.030],
  [0.08, 0.040], [0.10, 0.050], [0.12, 0.061], [0.14, 0.073],
  [0.16, 0.085], [0.18, 0.098], [0.20, 0.110], [0.22, 0.123],
  [0.24, 0.135], [0.26, 0.148], [0.28, 0.160], [0.30, 0.175],
  [0.32, 0.190], [0.34, 0.205], [0.36, 0.225], [0.38, 0.248],
  [0.40, 0.275], [0.42, 0.305], [0.44, 0.340], [0.46, 0.378],
  [0.48, 0.418], [0.50, 0.460], [0.52, 0.502], [0.54, 0.543],
  [0.56, 0.582], [0.58, 0.620], [0.60, 0.656], [0.62, 0.690],
  [0.64, 0.722], [0.66, 0.752], [0.68, 0.780], [0.70, 0.806],
  [0.72, 0.830], [0.74, 0.852], [0.76, 0.872], [0.78, 0.890],
  [0.80, 0.906], [0.82, 0.921], [0.84, 0.934], [0.86, 0.946],
  [0.88, 0.957], [0.90, 0.967], [0.92, 0.976], [0.94, 0.984],
  [0.96, 0.991], [0.98, 0.996], [1.00, 1.000]
]

function sCurveCumulative(progress: number): number {
  const clamped = Math.max(0, Math.min(1, progress))
  for (let i = 0; i < S_CURVE_TABLE.length - 1; i++) {
    const [t0, v0] = S_CURVE_TABLE[i]
    const [t1, v1] = S_CURVE_TABLE[i + 1]
    if (clamped >= t0 && clamped <= t1) {
      return v0 + (v1 - v0) * ((clamped - t0) / (t1 - t0))
    }
  }
  return 1
}

function monthlyDraw(month: number, buildTerm: number, totalCost: number): number {
  if (month > buildTerm || buildTerm === 0) return 0
  const progressEnd = month / buildTerm
  const progressStart = (month - 1) / buildTerm
  return totalCost * (sCurveCumulative(progressEnd) - sCurveCumulative(progressStart))
}

export function calculateAll(inputs: DealInputs): CalculationResults {
  const grv = (inputs.products || []).reduce((sum, p) => sum + p.numLots * p.grossAICValuation, 0)
  const totalLots = (inputs.products || []).reduce((sum, p) => sum + p.numLots, 0)
  const totalGFA = (inputs.products || []).reduce((sum, p) => sum + p.numLots * p.areaSqm, 0)

  let gst = 0
  if (inputs.gstMethod === 'standard') {
    gst = grv / 11
  } else {
    gst = Math.max(0, (grv - (inputs.landAcquisitionCost || 0)) / 11)
  }
  const nrv = grv - gst

  const sellingCosts = nrv * inputs.salesCommissionRate
  const qualifyingPresales = (inputs.products || []).reduce((sum, p) => sum + (Number(p.qualifyingPresaleValue) || 0), 0)
  const nonQualifyingPresales = (inputs.products || []).reduce((sum, p) => sum + (Number(p.nonQualifyingPresaleValue) || 0), 0)
  const totalPresales = qualifyingPresales + nonQualifyingPresales
  const presaleSellingCosts = totalPresales * inputs.presaleCommissionRate
  const totalSellingCosts = sellingCosts + presaleSellingCosts
  const netRealisations = nrv - totalSellingCosts
  const netRealisationsPerSqm = totalGFA > 0 ? netRealisations / totalGFA : 0

  const cashflow: MonthlyRow[] = []
  let balance = 0
  let gstOverdraftBalance = 0
  const totalInterestRate = (Number(inputs.interestRate) || 0) + (Number(inputs.interestMargin) || 0)
  const monthlyRate = totalInterestRate / 12
  const lineFeeRate = (inputs.lineFeeRate || 0) / 12
  let totalInterest = 0
  let totalLineFees = 0

  for (let m = 1; m <= inputs.loanTermMonths; m++) {
    const opening = balance
    const gstOpening = gstOverdraftBalance
    let draws = 0
    let gstIncurred = 0

    const constDraw = monthlyDraw(m, inputs.buildTermMonths, inputs.construction || 0)
    const prelimsDraw = m === 1 ? (inputs.preliminaries || 0) : 0
    const contingencyDraw = monthlyDraw(m, inputs.buildTermMonths, inputs.constructionContingency || 0)

    draws += m === 1 ? (inputs.siteValue || 0) : 0
    draws += prelimsDraw
    draws += constDraw
    draws += contingencyDraw

    let profFeesDraw = 0
    if (m === 1) {
      profFeesDraw += (inputs.professionalFees || 0) * 0.5
      if (inputs.buildTermMonths > 0) profFeesDraw += ((inputs.professionalFees || 0) * 0.5) / inputs.buildTermMonths
    } else if (m <= inputs.buildTermMonths) {
      profFeesDraw += ((inputs.professionalFees || 0) * 0.5) / inputs.buildTermMonths
    }
    draws += profFeesDraw

    draws += m === 1 ? (inputs.councilContributions || 0) : 0
    draws += m === 1 ? (inputs.authorityFees || 0) : 0
    draws += m === 1 ? (inputs.establishmentFees || 0) : 0
    draws += m === 1 ? (inputs.legalFees || 0) : 0
    draws += (inputs.developmentContingency || 0) / Math.max(1, inputs.loanTermMonths)

    gstIncurred = (constDraw + prelimsDraw + contingencyDraw + profFeesDraw) * 0.1
    let gstReturns = 0
    if (m > 3 && (m - 1) % 3 === 0) {
        gstReturns = cashflow.slice(m-4, m-1).reduce((s, r) => s + r.gstIncurred, 0)
    }

    const interest = opening * monthlyRate
    const lineFee = (opening + draws) * lineFeeRate

    totalInterest += interest
    totalLineFees += lineFee

    if (inputs.interestCapitalizationEnabled) {
        balance = opening + draws + interest + lineFee
    } else {
        balance = opening + draws
    }

    gstOverdraftBalance = Math.max(0, gstOpening + gstIncurred - gstReturns)
    if (gstOverdraftBalance > (inputs.gstOverdraftLimit || 0)) {
        const excess = gstOverdraftBalance - (inputs.gstOverdraftLimit || 0)
        balance += excess
        gstOverdraftBalance = inputs.gstOverdraftLimit || 0
    }

    cashflow.push({
      month: m,
      date: addMonths(inputs.startDate, m - 1),
      draws,
      gstIncurred,
      gstReturns,
      interestCharge: interest,
      lineFee,
      repayment: m === inputs.loanTermMonths ? -balance : 0,
      openingBalance: opening,
      closingBalance: balance,
      gstOverdraftOpening: gstOpening,
      gstOverdraftClosing: gstOverdraftBalance
    })
  }

  const peakDebt = cashflow.length > 0 ? Math.max(...cashflow.map(r => r.closingBalance)) : 0
  const averagePDFBalance = cashflow.length > 0 ? cashflow.reduce((sum, r) => sum + r.closingBalance, 0) / cashflow.length : 0

  const totalDirectCosts = (inputs.siteValue || 0) + (inputs.preliminaries || 0) + (inputs.construction || 0) +
    (inputs.constructionContingency || 0) + (inputs.professionalFees || 0) + (inputs.councilContributions || 0) +
    (inputs.authorityFees || 0) + (inputs.establishmentFees || 0) + (inputs.legalFees || 0) +
    (inputs.developmentContingency || 0) + totalInterest + totalLineFees

  const totalIndirectCosts = (inputs.marketingSellingCost || 0) + (inputs.legalFeesIndirect || 0) + (inputs.ratesTaxes || 0) + (inputs.financeCostsIndirect || 0) + (inputs.otherIndirectCosts || 0)
  const totalDevelopmentCosts = totalDirectCosts + totalIndirectCosts

  const seniorFunding = totalDirectCosts - (inputs.customerCashEquity || 0) - (inputs.mezzEnabled ? (inputs.mezzAmount || 0) : 0)

  const ltc = totalDirectCosts > 0 ? seniorFunding / totalDirectCosts : 0
  const lvrGross = grv > 0 ? seniorFunding / grv : 0
  const lvrNet = nrv > 0 ? seniorFunding / nrv : 0

  const profitAmount = netRealisations - totalDevelopmentCosts
  const roc = totalDevelopmentCosts > 0 ? profitAmount / totalDevelopmentCosts : 0
  const profitMargin = netRealisations > 0 ? profitAmount / netRealisations : 0
  const roe = (inputs.customerCashEquity || 0) > 0 ? profitAmount / (inputs.customerCashEquity || 0) : 0

  // Residual Position Analysis
  const residualANZDebt = seniorFunding
  const residualLVRBase = netRealisations > 0 ? residualANZDebt / netRealisations : 0

  const netResidualValueWithSecurity = netRealisations + (Number(inputs.additionalSecurityFmv) || 0);
  const residualLVRWithSecurity = netResidualValueWithSecurity > 0 ? residualANZDebt / netResidualValueWithSecurity : 0;

  const residualLVRWithGSTOD = netRealisations > 0 ? (residualANZDebt + (inputs.gstOverdraftLimit || 0)) / netRealisations : 0;

  const avgSalePriceNetOfCosts = totalLots > 0 ? (netRealisations / totalLots) : 0
  const salesToRepay = avgSalePriceNetOfCosts > 0 ? Math.ceil(residualANZDebt / avgSalePriceNetOfCosts) : 0

  const qualifyingPresalesCover = seniorFunding > 0 ? qualifyingPresales / seniorFunding : 0
  const allPresalesCover = seniorFunding > 0 ? (qualifyingPresales + nonQualifyingPresales) / seniorFunding : 0

  const constructionCostPerSqm = totalGFA > 0 ? (inputs.construction || 0) / totalGFA : 0

  const targetROC = inputs.targetRoc ?? 0.20
  const totalCostsExLand = totalDirectCosts - (inputs.siteValue || 0)
  const rlv = (netRealisations - totalCostsExLand * (1 + targetROC)) / (1 + targetROC)

  const profitPerUnit = totalLots > 0 ? profitAmount / totalLots : 0
  const costPerUnit = totalLots > 0 ? totalDevelopmentCosts / totalLots : 0

  const costLines = [
      { label: 'Site Value', amount: inputs.siteValue || 0 },
      { label: 'Preliminaries', amount: inputs.preliminaries || 0 },
      { label: 'Construction', amount: inputs.construction || 0 },
      { label: 'Construction Contingency', amount: inputs.constructionContingency || 0 },
      { label: 'Professional Fees', amount: inputs.professionalFees || 0 },
      { label: 'Council Contributions', amount: inputs.councilContributions || 0 },
      { label: 'Authority Fees', amount: inputs.authorityFees || 0 },
      { label: 'Establishment/LAF', amount: inputs.establishmentFees || 0 },
      { label: 'Legal Fees', amount: inputs.legalFees || 0 },
      { label: 'Dev Contingency', amount: inputs.developmentContingency || 0 },
      { label: 'Financing Costs', amount: totalInterest + totalLineFees },
      { label: 'Indirect Costs', amount: totalIndirectCosts }
  ];

  const fundingTable = costLines.map(line => {
      const pctOfTotal = totalDevelopmentCosts > 0 ? line.amount / totalDevelopmentCosts : 0;
      const anzFunding = line.amount * ltc;
      const equity = line.amount - anzFunding;
      const lcr = line.amount > 0 ? anzFunding / line.amount : 0;
      const costPerSqm = totalGFA > 0 ? line.amount / totalGFA : 0;
      return {
          ...line,
          pctOfTotal,
          anzFunding,
          equity,
          lcr,
          costPerSqm
      };
  });

  const results: CalculationResults = {
    grv, totalLots, totalGFA, gst, nrv, sellingCosts, totalSellingCosts, netRealisations, netRealisationsPerSqm,
    peakDebt, totalInterest, totalLineFees, averagePDFBalance, totalDirectCosts, totalDevelopmentCosts, totalIndirectCosts, seniorFunding,
    ltc, lvrGross, lvrNet, roc, roe, profitAmount, profitMargin,
    residualANZDebt, residualLVRBase, residualLVRWithSecurity, residualLVRWithGSTOD,
    grossResidualValue: grv, netResidualValue: netRealisations, residualLVR: residualLVRBase, salesToRepay,
    qualifyingPresalesCover, allPresalesCover, constructionCostPerSqm, rlv, blendedRate: 0, profitPerUnit, costPerUnit,
    cashflow,
    fundingTable
  }

  if (inputs.mezzEnabled && (inputs.mezzAmount || 0) > 0) {
    const mezzMonthlyRate = (inputs.mezzInterestRate || 0) / 12
    let mezzBalance = inputs.mezzAmount || 0
    let mezzTotalInterest = 0
    for (let m = 1; m <= inputs.loanTermMonths; m++) {
      const interest = mezzBalance * mezzMonthlyRate
      mezzBalance += interest
      mezzTotalInterest += interest
    }
    const mezzAppFee = (inputs.mezzAmount || 0) * (inputs.mezzAppFeeRate || 0)
    const mezzBrokerFee = (inputs.mezzAmount || 0) * (inputs.mezzBrokerFeeRate || 0)
    results.mezzTotalInterest = mezzTotalInterest
    results.mezzTotalRepayment = (inputs.mezzAmount || 0) + mezzTotalInterest + mezzAppFee + mezzBrokerFee + (inputs.mezzLegalFees || 0)
    results.blendedTotalDebt = seniorFunding + results.mezzTotalRepayment
    results.mezzLVR = grv > 0 ? (seniorFunding + (inputs.mezzAmount || 0)) / grv : 0
    results.mezzLTC = totalDirectCosts > 0 ? (seniorFunding + (inputs.mezzAmount || 0)) / totalDirectCosts : 0
  }

  const totalActualDebt = seniorFunding + (inputs.mezzEnabled ? (inputs.mezzAmount || 0) : 0);
  results.blendedRate = totalActualDebt > 0 ?
    (seniorFunding * totalInterestRate + (inputs.mezzEnabled ? (inputs.mezzAmount || 0) * (inputs.mezzInterestRate || 0) : 0)) / totalActualDebt : 0;

  return results
}

export function runScenario(baseInputs: DealInputs, adjustment: ScenarioAdjustment): CalculationResults {
  const adjusted = {
    ...baseInputs,
    products: (baseInputs.products || []).map(p => ({
      ...p,
      grossAICValuation: p.grossAICValuation * (1 + adjustment.grvAdjustment)
    })),
    construction: (baseInputs.construction || 0) * (1 + adjustment.costAdjustment),
    constructionContingency: (baseInputs.constructionContingency || 0) * (1 + adjustment.costAdjustment),
    interestRate: (baseInputs.interestRate || 0) + adjustment.interestAdjustment
  }
  return calculateAll(adjusted)
}

export function executeScenarios(inputs: DealInputs, policy: any) {
  return {
    base: calculateAll(inputs),
    upside: runScenario(inputs, {
      grvAdjustment: policy?.scenario_upside_grv ?? 0.10,
      costAdjustment: policy?.scenario_upside_costs ?? -0.05,
      interestAdjustment: policy?.scenario_upside_rate ?? -0.01
    }),
    downside: runScenario(inputs, {
      grvAdjustment: policy?.scenario_downside_grv ?? -0.10,
      costAdjustment: policy?.scenario_downside_costs ?? 0.10,
      interestAdjustment: policy?.scenario_downside_rate ?? 0.01
    })
  }
}
