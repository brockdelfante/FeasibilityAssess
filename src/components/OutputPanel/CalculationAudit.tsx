"use client";

import { CalculationResults, DealInputs } from "@/lib/calculations";
import { ScrollArea } from "@/components/ui/scroll-area";

export function CalculationAudit({ inputs, results }: { inputs: DealInputs, results: CalculationResults }) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 2 }).format(val);

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Calculation Logic Audit</h3>
      <ScrollArea className="h-[300px] w-full rounded-md border p-4 bg-gray-50">
        <div className="space-y-4 text-[11px] font-mono">
          <section>
            <p className="text-blue-700 font-bold underline">1. REVENUE (GRV)</p>
            <p>Sum of (Lots × Valuation)</p>
            <p className="text-gray-500">{inputs.products.map(p => `(${p.numLots} × ${formatCurrency(p.grossAICValuation)})`).join(' + ')}</p>
            <p className="font-bold text-gray-900">= {formatCurrency(results.grv)}</p>
          </section>

          <section>
            <p className="text-blue-700 font-bold underline">2. GST LIABILITY (${inputs.gstMethod})</p>
            {inputs.gstMethod === 'standard' ? (
                <>
                    <p>Standard: GRV ÷ 11</p>
                    <p className="text-gray-500">${formatCurrency(results.grv)} ÷ 11</p>
                </>
            ) : (
                <>
                    <p>Margin Scheme: (GRV - Land Cost) ÷ 11</p>
                    <p className="text-gray-500">(${formatCurrency(results.grv)} - ${formatCurrency(inputs.landAcquisitionCost)}) ÷ 11</p>
                </>
            )}
            <p className="font-bold text-gray-900">= {formatCurrency(results.gst)}</p>
          </section>

          <section>
            <p className="text-blue-700 font-bold underline">3. NET REALISATIONS</p>
            <p>GRV - GST - Selling Costs</p>
            <p className="text-gray-500">${formatCurrency(results.grv)} - ${formatCurrency(results.gst)} - ${formatCurrency(results.totalSellingCosts)}</p>
            <p className="font-bold text-gray-900">= {formatCurrency(results.netRealisations)}</p>
          </section>

          <section>
            <p className="text-blue-700 font-bold underline">4. RETURN ON COST (ROC)</p>
            <p>(Net Realisations - Total Costs) ÷ Total Costs</p>
            <p className="text-gray-500">(${formatCurrency(results.netRealisations)} - ${formatCurrency(results.totalDirectCosts)}) ÷ ${formatCurrency(results.totalDirectCosts)}</p>
            <p className="font-bold text-gray-900">= {(results.roc * 100).toFixed(2)}%</p>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
