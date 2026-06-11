import { create } from 'zustand'
import { DealInputs, CalculationResults, calculateAll } from './calculations'

interface DealState {
  inputs: DealInputs
  results: CalculationResults
  setInputs: (inputs: Partial<DealInputs>) => void
  updateProduct: (index: number, product: any) => void
  addProduct: () => void
  removeProduct: (index: number) => void
}

export const useDealStore = create<DealState>((set) => ({
  inputs: {
    dealType: 'construction',
    products: [
      {
        numLots: 1,
        description: 'Example Lot',
        areaSqm: 100,
        grossAICValuation: 500000,
        qualifyingPresaleValue: 0,
        nonQualifyingPresaleValue: 0
      }
    ],
    loanTermMonths: 18,
    buildTermMonths: 12,
    startDate: new Date(),
    interestRate: 0.0999,
    lineFeeRate: 0,
    lafRate: 0.015,
    gstMethod: 'standard',
    salesCommissionRate: 0.015,
    presaleCommissionRate: 0,
    landAcquisitionCost: 1000000,
    siteValue: 1000000,
    preliminaries: 50000,
    construction: 2000000,
    constructionContingency: 100000,
    professionalFees: 100000,
    councilContributions: 50000,
    authorityFees: 20000,
    establishmentFees: 30000,
    legalFees: 10000,
    developmentContingency: 50000,
    customerCashEquity: 500000,
    mezzAmount: 0,
    mezzEnabled: false,
    mezzInterestRate: 0.20,
    mezzAppFeeRate: 0.022,
    mezzBrokerFeeRate: 0.010,
    mezzLegalFees: 6600
  },
  results: calculateAll({
    dealType: 'construction',
    products: [{ numLots: 1, description: 'Example Lot', areaSqm: 100, grossAICValuation: 500000, qualifyingPresaleValue: 0, nonQualifyingPresaleValue: 0 }],
    loanTermMonths: 18,
    buildTermMonths: 12,
    startDate: new Date(),
    interestRate: 0.0999,
    lineFeeRate: 0,
    lafRate: 0.015,
    gstMethod: 'standard',
    salesCommissionRate: 0.015,
    presaleCommissionRate: 0,
    landAcquisitionCost: 1000000,
    siteValue: 1000000,
    preliminaries: 50000,
    construction: 2000000,
    constructionContingency: 100000,
    professionalFees: 100000,
    councilContributions: 50000,
    authorityFees: 20000,
    establishmentFees: 30000,
    legalFees: 10000,
    developmentContingency: 50000,
    customerCashEquity: 500000,
    mezzAmount: 0,
    mezzEnabled: false,
    mezzInterestRate: 0.20,
    mezzAppFeeRate: 0.022,
    mezzBrokerFeeRate: 0.010,
    mezzLegalFees: 6600
  }),
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
  })
}))
