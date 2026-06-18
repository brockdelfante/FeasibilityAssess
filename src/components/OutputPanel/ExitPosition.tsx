"use client";

import { CalculationResults } from "@/lib/calculations";
import { Separator } from "@/components/ui/separator";
import { Shield, Landmark, Scale } from "lucide-react";

export function ExitPosition({ results }: { results: CalculationResults }) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Debt Retirement Metrics</h3>
        <div className="bg-blue-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Landmark className="h-16 w-16" /></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-1">Peak Senior Exposure</p>
            <p className="text-3xl font-mono font-black">{formatCurrency(results.seniorFunding)}</p>
        </div>

        <div className="bg-green-50 border border-green-100 p-6 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-green-600 mb-1">Required Sales to Repay</p>
                    <p className="text-3xl font-mono font-black text-green-700">{results.salesToRepay} <span className="text-xs uppercase font-black">Units</span></p>
                </div>
                <div className="bg-green-100 p-3 rounded-xl"><Scale className="h-6 w-6 text-green-600" /></div>
            </div>
            <p className="text-[10px] text-green-600/70 mt-3 font-bold italic tracking-tight leading-relaxed">
                * Based on weighted average net realisation of {formatCurrency(results.netRealisations / results.totalLots)} per unit.
            </p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1 flex items-center"><Shield className="h-3 w-3 mr-1" /> Residual LVR Sensitivity</h3>
        <div className="grid grid-cols-1 gap-3">
            <div className="bg-white border rounded-xl p-4 flex justify-between items-center shadow-sm">
                <span className="text-[11px] font-bold text-gray-600 uppercase">Base Case (NRV)</span>
                <span className="text-sm font-mono font-black text-gray-900">{(results.residualLVRBase * 100).toFixed(1)}%</span>
            </div>
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex justify-between items-center shadow-sm">
                <span className="text-[11px] font-bold text-blue-800 uppercase">Incl. Add. Security</span>
                <span className="text-sm font-mono font-black text-blue-700">{(results.residualLVRWithSecurity * 100).toFixed(1)}%</span>
            </div>
            <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex justify-between items-center shadow-sm">
                <span className="text-[11px] font-bold text-amber-800 uppercase">Incl. GST Overdraft</span>
                <span className="text-sm font-mono font-black text-amber-700">{(results.residualLVRWithGSTOD * 100).toFixed(1)}%</span>
            </div>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-1">Exit Realisation Waterfall</h3>
        <div className="space-y-3 text-[11px] bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
            <div className="flex justify-between text-gray-500 font-bold uppercase tracking-tight">
                <span>Gross Realisations (GRV)</span>
                <span className="font-mono font-black">{formatCurrency(results.grv)}</span>
            </div>
            <div className="flex justify-between text-red-500/70 font-bold uppercase tracking-tight">
                <span>GST Liability</span>
                <span className="font-mono font-black">-{formatCurrency(results.gst)}</span>
            </div>
            <div className="flex justify-between text-red-500/70 font-bold uppercase tracking-tight">
                <span>Sales Commission</span>
                <span className="font-mono font-black">-{formatCurrency(results.totalSellingCosts)}</span>
            </div>
            <Separator className="bg-gray-200" />
            <div className="flex justify-between font-black text-gray-900 uppercase text-xs pt-1">
                <span>Net Residual Value</span>
                <span className="font-mono">{formatCurrency(results.netRealisations)}</span>
            </div>
        </div>
      </div>
    </div>
  );
}
