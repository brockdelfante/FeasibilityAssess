export interface PolicyConfig {
  maxLvrGross: number;
  maxLvrNet: number;
  maxLtc: number;
  minRoc: number;
  minPresalesCover: number;
  constructionCostMinSqm: number;
  constructionCostMaxSqm: number;
}

export const defaultPolicy: PolicyConfig = {
  maxLvrGross: 0.65,
  maxLvrNet: 0.70,
  maxLtc: 0.80,
  minRoc: 0.20,
  minPresalesCover: 0.80,
  constructionCostMinSqm: 1800,
  constructionCostMaxSqm: 4500,
};

export interface BreachResult {
  field: string;
  label: string;
  value: number;
  threshold: number;
  direction: 'above' | 'below';
  severity: 'warning' | 'breach' | 'compliant';
}

export function detectBreaches(calcs: any, inputs: any = {}, policy: PolicyConfig = defaultPolicy): BreachResult[] {
  const breaches: BreachResult[] = [];

  const check = (field: string, label: string, value: number, threshold: number, direction: 'above' | 'below') => {
    const isBreach = direction === 'above' ? value > threshold : value < threshold;
    const isWarning = direction === 'above' ? value > threshold * 0.95 : value < threshold * 1.05;

    breaches.push({
      field,
      label,
      value,
      threshold,
      direction,
      severity: isBreach ? 'breach' : isWarning ? 'warning' : 'compliant'
    });
  };

  check('lvrGross', 'LVR (Gross GRV)', calcs.lvrGross, policy.maxLvrGross, 'above');
  check('ltc', 'Loan to Cost', calcs.ltc, policy.maxLtc, 'above');
  check('roc', 'Return on Cost', calcs.roc, policy.minRoc, 'below');
  check('presalesCover', 'Qualifying Presales Cover', calcs.qualifyingPresalesCover, policy.minPresalesCover, 'below');

  if (calcs.constructionCostPerSqm < policy.constructionCostMinSqm) {
    breaches.push({ field: 'constructionSqmLow', label: 'Construction $/sqm (below benchmark)', value: calcs.constructionCostPerSqm, threshold: policy.constructionCostMinSqm, direction: 'below', severity: 'warning' });
  } else if (calcs.constructionCostPerSqm > policy.constructionCostMaxSqm) {
    breaches.push({ field: 'constructionSqmHigh', label: 'Construction $/sqm (above benchmark)', value: calcs.constructionCostPerSqm, threshold: policy.constructionCostMaxSqm, direction: 'above', severity: 'warning' });
  }

  // Domain Valuation Variance Check
  if (inputs.estimateUpper && calcs.siteValue > inputs.estimateUpper) {
    breaches.push({
      field: 'valuationVariance',
      label: 'Valuation Variance (High)',
      value: calcs.siteValue,
      threshold: inputs.estimateUpper,
      direction: 'above',
      severity: 'breach'
    });
  }

  return breaches;
}
