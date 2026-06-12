"use client";

import { CalculationResults } from "@/lib/calculations";
import { Separator } from "@/components/ui/separator";

export function ExitPosition({ results }: { results: CalculationResults }) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-blue-900 text-white p-4 rounded-xl shadow-lg">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-1">Residual ANZ Debt</p>
            <p className="text-2xl font-mono font-black">{formatCurrency(results.seniorFunding)}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded-lg border">
                <p className="text-[10px] text-gray-400 uppercase font-black mb-1">Net Residual Value</p>
                <p className="text-lg font-mono font-bold text-gray-900">{formatCurrency(results.netResidualValue)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border">
                <p className="text-[10px] text-gray-400 uppercase font-black mb-1">Residual LVR</p>
                <p className="text-lg font-mono font-bold text-gray-900">{(results.residualLVR * 100).toFixed(1)}%</p>
            </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Repayment Strategy</h3>
        <div className="bg-green-50 border border-green-100 p-4 rounded-xl">
            <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-green-900">Required Sales to Repay</span>
                <span className="text-2xl font-mono font-black text-green-700">{results.salesToRepay} <span className="text-[10px] uppercase">Lots</span></span>
            </div>
            <p className="text-[10px] text-green-600 mt-2 font-medium italic">* Based on weighted average net realisation per lot.</p>
        </div>
      </div>

      <div className="space-y-3 pt-2 text-[11px]">
        <div className="flex justify-between text-gray-500 font-medium">
            <span>Gross Realisations</span>
            <span>{formatCurrency(results.grv)}</span>
        </div>
        <div className="flex justify-between text-gray-500 font-medium">
            <span>Selling Costs & GST</span>
            <span className="text-red-500">-{formatCurrency(results.totalSellingCosts + results.gst)}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-bold text-gray-900">
            <span>Net Realisations</span>
            <span>{formatCurrency(results.netRealisations)}</span>
        </div>
      </div>
    </div>
  );
}
