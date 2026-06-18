import { create } from 'zustand'
import { calculateAll } from './calculations'

interface DealState {
  inputs: {
    dealType: 'construction' | 'subdivision'
    customerGroup: string
    projectAddress: string
    addressStreet: string
    addressCity: string
    addressState: string
    addressPostcode: string
    addressCountry: string
    products: any[]
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

    // Mezzanine
    mezzEnabled: boolean
    mezzProvider: string
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

    // Finance Features
    interestCapitalizationEnabled: boolean
    gstOverdraftLimit: number
    targetRoc: number
    ownerBuilder: boolean

    developerExperienceYears: number
    developerProjectsCompleted: number
    developerTnw: number
    developerLiquidity: number
    developerNotes: string
    delayContingencyMonths: number
    indirectCostNotes: string
    additionalSecurityFmv: number
    additionalSecurityExtended: number
    sponsorRecourse: boolean
    tangibleNetWorth: number
    riskScoreLocation: number
    riskScoreDeveloperExp: number
    riskScorePresales: number
    riskScoreLvr: number
    riskScoreContingency: number
    riskScoreNotes: string
    assumptionsGrvBasis: string
    assumptionsConstructionBasis: string
    assumptionsProgrammeBasis: string
    assumptionsOther: string
    presales: any[]

    // Property Intelligence
    estimateLower: number | null
    estimateMid: number | null
    estimateUpper: number | null
    estimateConfidence: string | null
    propertyImageUrl: string | null
    propertyType: string | null
    propertyBedrooms: number | null
    propertyBathrooms: number | null
    propertyParking: number | null
    propertyLandArea: number | null
    propertyInternalArea: number | null
    propertyYearBuilt: number | null
    propertyLatitude: number | null
    propertyLongitude: number | null
  }
  results: any
  isLoading: boolean
  setInputs: (inputs: Partial<DealState['inputs']>) => void
  updateProduct: (index: number, product: any) => void
  addProduct: () => void
  removeProduct: (index: number) => void
  updatePresale: (index: number, presale: any) => void
  addPresale: () => void
  removePresale: (index: number) => void
  loadDeal: (deal: any) => void
  setLoading: (loading: boolean) => void
}

const defaultInputs: DealState['inputs'] = {
  dealType: 'construction',
  customerGroup: '',
  projectAddress: '',
  addressStreet: '',
  addressCity: '',
  addressState: '',
  addressPostcode: '',
  addressCountry: '',
  products: [{ numLots: 1, description: 'Example Lot', areaSqm: 100, grossAICValuation: 0, qualifyingPresaleValue: 0, nonQualifyingPresaleValue: 0 }],
  loanTermMonths: 18,
  buildTermMonths: 12,
  startDate: new Date(),
  interestRate: 0.0999,
  interestMargin: 0,
  lineFeeRate: 0,
  lafRate: 0.015,
  gstMethod: 'standard',
  salesCommissionRate: 0.015,
  presaleCommissionRate: 0,
  landAcquisitionCost: 0,
  siteValue: 0,
  preliminaries: 0,
  construction: 0,
  constructionContingency: 0,
  professionalFees: 0,
  councilContributions: 0,
  authorityFees: 0,
  establishmentFees: 0,
  legalFees: 0,
  developmentContingency: 0,
  customerCashEquity: 0,

  // Mezzanine
  mezzEnabled: false,
  mezzProvider: '',
  mezzAmount: 0,
  mezzInterestRate: 0.20,
  mezzAppFeeRate: 0.022,
  mezzBrokerFeeRate: 0.010,
  mezzLegalFees: 6600,

  // Indirect
  marketingSellingCost: 0,
  legalFeesIndirect: 0,
  ratesTaxes: 0,
  financeCostsIndirect: 0,
  otherIndirectCosts: 0,

  // Finance Features
  interestCapitalizationEnabled: true,
  gstOverdraftLimit: 0,
  targetRoc: 0.20,
  ownerBuilder: false,

  developerExperienceYears: 0,
  developerProjectsCompleted: 0,
  developerTnw: 0,
  developerLiquidity: 0,
  developerNotes: '',
  delayContingencyMonths: 0,
  indirectCostNotes: '',
  additionalSecurityFmv: 0,
  additionalSecurityExtended: 0,
  sponsorRecourse: false,
  tangibleNetWorth: 0,
  riskScoreLocation: 3,
  riskScoreDeveloperExp: 3,
  riskScorePresales: 3,
  riskScoreLvr: 3,
  riskScoreContingency: 3,
  riskScoreNotes: '',
  assumptionsGrvBasis: '',
  assumptionsConstructionBasis: '',
  assumptionsProgrammeBasis: '',
  assumptionsOther: '',
  presales: [],

  estimateLower: null,
  estimateMid: null,
  estimateUpper: null,
  estimateConfidence: null,
  propertyImageUrl: null,
  propertyType: null,
  propertyBedrooms: null,
  propertyBathrooms: null,
  propertyParking: null,
  propertyLandArea: null,
  propertyInternalArea: null,
  propertyYearBuilt: null,
  propertyLatitude: null,
  propertyLongitude: null
};

export const useDealStore = create<DealState>((set) => ({
  inputs: defaultInputs,
  results: calculateAll(defaultInputs),
  isLoading: false,
  setInputs: (newInputs) => set((state) => {
    const updatedInputs = { ...state.inputs, ...newInputs }
    return {
      inputs: updatedInputs,
      results: calculateAll(updatedInputs)
    }
  }),
  updateProduct: (index, product) => set((state) => {
    const newProducts = [...state.inputs.products]
    newProducts[index] = { ...newProducts[index], ...product }
    const updatedInputs = { ...state.inputs, products: newProducts }
    return {
      inputs: updatedInputs,
      results: calculateAll(updatedInputs)
    }
  }),
  addProduct: () => set((state) => {
    const newProducts = [...state.inputs.products, {
      numLots: 1,
      description: 'New Lot',
      areaSqm: 100,
      grossAICValuation: 0,
      qualifyingPresaleValue: 0,
      nonQualifyingPresaleValue: 0
    }]
    const updatedInputs = { ...state.inputs, products: newProducts }
    return {
      inputs: updatedInputs,
      results: calculateAll(updatedInputs)
    }
  }),
  removeProduct: (index) => set((state) => {
    const newProducts = state.inputs.products.filter((_, i) => i !== index)
    const updatedInputs = { ...state.inputs, products: newProducts }
    return {
      inputs: updatedInputs,
      results: calculateAll(updatedInputs)
    }
  }),
  updatePresale: (index, presale) => set((state) => {
    const newPresales = [...state.inputs.presales]
    newPresales[index] = { ...newPresales[index], ...presale }
    const totalQualifying = newPresales.filter(p => p.is_qualifying).reduce((sum, p) => sum + (Number(p.sale_price) || 0), 0)
    const totalNonQualifying = newPresales.filter(p => !p.is_qualifying).reduce((sum, p) => sum + (Number(p.sale_price) || 0), 0)
    const newProducts = [...state.inputs.products]
    if (newProducts.length > 0) {
        newProducts[0].qualifyingPresaleValue = totalQualifying
        newProducts[0].nonQualifyingPresaleValue = totalNonQualifying
    }
    const updatedInputs = { ...state.inputs, presales: newPresales, products: newProducts }
    return {
        inputs: updatedInputs,
        results: calculateAll(updatedInputs)
    }
  }),
  addPresale: () => set((state) => {
    const newPresales = [...state.inputs.presales, { unit_description: '', buyer_name: '', sale_price: 0, is_qualifying: true }]
    const updatedInputs = { ...state.inputs, presales: newPresales }
    return { inputs: updatedInputs, results: calculateAll(updatedInputs) }
  }),
  removePresale: (index) => set((state) => {
    const newPresales = state.inputs.presales.filter((_, i) => i !== index)
    const updatedInputs = { ...state.inputs, presales: newPresales }
    return { inputs: updatedInputs, results: calculateAll(updatedInputs) }
  }),
  loadDeal: (deal) => set(() => {
    const inputs: any = {
        dealType: deal.deal_type || 'construction',
        customerGroup: deal.customer_group || '',
        projectAddress: deal.project_address || '',
        addressStreet: deal.address_street || '',
        addressCity: deal.address_city || '',
        addressState: deal.address_state || '',
        addressPostcode: deal.address_postcode || '',
        addressCountry: deal.address_country || '',
        products: deal.deal_products?.length ? deal.deal_products.map((p: any) => ({
            numLots: p.num_lots,
            description: p.description,
            areaSqm: p.area_sqm,
            grossAICValuation: p.gross_aic_valuation,
            qualifyingPresaleValue: p.qualifying_presale_value,
            nonQualifyingPresaleValue: p.non_qualifying_presale_value
        })) : defaultInputs.products,
        presales: deal.deal_presales || [],
        loanTermMonths: deal.loan_term_months || 18,
        buildTermMonths: deal.build_term_months || 12,
        startDate: deal.start_date ? new Date(deal.start_date) : new Date(),
        interestRate: Number(deal.interest_rate) || 0.0999,
        interestMargin: Number(deal.interest_margin) || 0,
        lineFeeRate: Number(deal.line_fee_rate) || 0,
        lafRate: Number(deal.laf_rate) || 0.015,
        gstMethod: deal.gst_method || 'standard',
        salesCommissionRate: Number(deal.sales_commission_rate) || 0.015,
        presaleCommissionRate: Number(deal.presale_commission_rate) || 0,
        landAcquisitionCost: Number(deal.land_acquisition_cost) || 0,
        siteValue: Number(deal.site_value) || 0,
        preliminaries: Number(deal.preliminaries) || 0,
        construction: Number(deal.construction) || 0,
        constructionContingency: Number(deal.construction_contingency) || 0,
        professionalFees: Number(deal.professional_fees) || 0,
        councilContributions: Number(deal.council_contributions) || 0,
        authorityFees: Number(deal.authority_fees) || 0,
        establishmentFees: Number(deal.establishment_fees) || 0,
        legalFees: Number(deal.legal_fees) || 0,
        developmentContingency: Number(deal.development_contingency) || 0,
        customerCashEquity: Number(deal.customer_cash_equity) || 0,

        // Mezzanine
        mezzEnabled: deal.mezz_enabled || false,
        mezzProvider: deal.mezz_provider || '',
        mezzAmount: Number(deal.mezz_amount) || 0,
        mezzInterestRate: Number(deal.mezz_interest_rate) || 0.20,
        mezzAppFeeRate: Number(deal.mezz_app_fee_rate) || 0.022,
        mezzBrokerFeeRate: Number(deal.mezz_broker_fee_rate) || 0.010,
        mezzLegalFees: Number(deal.mezz_legal_fees) || 6600,

        // Indirect
        marketingSellingCost: Number(deal.marketing_selling_cost) || 0,
        legalFeesIndirect: Number(deal.legal_fees_indirect) || 0,
        ratesTaxes: Number(deal.rates_taxes) || 0,
        financeCostsIndirect: Number(deal.finance_costs_indirect) || 0,
        otherIndirectCosts: Number(deal.other_indirect_costs) || 0,

        // Finance Features
        interestCapitalizationEnabled: deal.interest_capitalization_enabled ?? true,
        gstOverdraftLimit: Number(deal.gst_overdraft_limit) || 0,
        targetRoc: Number(deal.target_roc) || 0.20,
        ownerBuilder: deal.owner_builder ?? false,

        developerExperienceYears: deal.developer_experience_years || 0,
        developerProjectsCompleted: deal.developer_projects_completed || 0,
        developerTnw: Number(deal.developer_tnw) || 0,
        developerLiquidity: Number(deal.developer_liquidity) || 0,
        developerNotes: deal.developer_notes || '',
        delayContingencyMonths: deal.delay_contingency_months || 0,
        indirectCostNotes: deal.indirect_cost_notes || '',
        additionalSecurityFmv: Number(deal.additional_security_fmv) || 0,
        additionalSecurityExtended: Number(deal.additional_security_extended) || 0,
        sponsorRecourse: deal.sponsor_recourse || false,
        tangibleNetWorth: Number(deal.tangible_net_worth) || 0,
        riskScoreLocation: deal.risk_score_location || 3,
        riskScoreDeveloperExp: deal.risk_score_developer_exp || 3,
        riskScorePresales: deal.risk_score_presales || 3,
        riskScoreLvr: deal.risk_score_lvr || 3,
        riskScoreContingency: deal.risk_score_contingency || 3,
        riskScoreNotes: deal.risk_score_notes || '',
        assumptionsGrvBasis: deal.assumptions_grv_basis || '',
        assumptionsConstructionBasis: deal.assumptions_construction_basis || '',
        assumptionsProgrammeBasis: deal.assumptions_programme_basis || '',
        assumptionsOther: deal.assumptions_other || '',

        estimateLower: deal.estimate_lower ? Number(deal.estimate_lower) : null,
        estimateMid: deal.estimate_mid ? Number(deal.estimate_mid) : null,
        estimateUpper: deal.estimate_upper ? Number(deal.estimate_upper) : null,
        estimateConfidence: deal.estimate_confidence || null,
        propertyImageUrl: deal.property_image_url || null,
        propertyType: deal.property_type || null,
        propertyBedrooms: deal.property_bedrooms || null,
        propertyBathrooms: deal.property_bathrooms || null,
        propertyParking: deal.property_parking || null,
        propertyLandArea: deal.property_land_area ? Number(deal.property_land_area) : null,
        propertyInternalArea: deal.property_internal_area ? Number(deal.property_internal_area) : null,
        propertyYearBuilt: deal.property_year_built || null,
        propertyLatitude: deal.property_latitude ? Number(deal.property_latitude) : null,
        propertyLongitude: deal.property_longitude ? Number(deal.property_longitude) : null
    };
    return {
        inputs,
        results: calculateAll(inputs),
        isLoading: false
    }
  }),
  setLoading: (isLoading) => set({ isLoading })
}))
