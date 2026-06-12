import { create } from 'zustand'
import { DealInputs, CalculationResults, calculateAll } from './calculations'

interface DealState {
  inputs: DealInputs
  results: CalculationResults
  isLoading: boolean
  setInputs: (inputs: Partial<DealInputs>) => void
  updateProduct: (index: number, product: any) => void
  addProduct: () => void
  removeProduct: (index: number) => void
  loadDeal: (deal: any) => void
  setLoading: (loading: boolean) => void
}

const defaultInputs: DealInputs = {
  dealType: 'construction',
  products: [{ numLots: 1, description: 'Example Lot', areaSqm: 100, grossAICValuation: 0, qualifyingPresaleValue: 0, nonQualifyingPresaleValue: 0 }],
  loanTermMonths: 18,
  buildTermMonths: 12,
  startDate: new Date(),
  interestRate: 0.0999,
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
  mezzAmount: 0,
  mezzEnabled: false,
  mezzInterestRate: 0.20,
  mezzAppFeeRate: 0.022,
  mezzBrokerFeeRate: 0.010,
  mezzLegalFees: 6600
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
  loadDeal: (deal) => set(() => {
    const inputs: DealInputs = {
        dealType: deal.deal_type || 'construction',
        products: deal.deal_products?.length ? deal.deal_products.map((p: any) => ({
            numLots: p.num_lots,
            description: p.description,
            areaSqm: p.area_sqm,
            grossAICValuation: p.gross_aic_valuation,
            qualifyingPresaleValue: p.qualifying_presale_value,
            nonQualifyingPresaleValue: p.non_qualifying_presale_value
        })) : defaultInputs.products,
        loanTermMonths: deal.loan_term_months || 18,
        buildTermMonths: deal.build_term_months || 12,
        startDate: deal.start_date ? new Date(deal.start_date) : new Date(),
        interestRate: Number(deal.interest_rate) || 0.0999,
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
        mezzAmount: Number(deal.mezz_amount) || 0,
        mezzEnabled: deal.mezz_enabled || false,
        mezzInterestRate: Number(deal.mezz_interest_rate) || 0.20,
        mezzAppFeeRate: Number(deal.mezz_app_fee_rate) || 0.022,
        mezzBrokerFeeRate: Number(deal.mezz_broker_fee_rate) || 0.010,
        mezzLegalFees: Number(deal.mezz_legal_fees) || 6600
    };
    return {
        inputs,
        results: calculateAll(inputs),
        isLoading: false
    }
  }),
  setLoading: (isLoading) => set({ isLoading })
}))
