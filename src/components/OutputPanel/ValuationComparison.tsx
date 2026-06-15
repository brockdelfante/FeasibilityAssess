"use client";

import { useDealStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

export function ValuationComparison() {
  const { inputs, results } = useDealStore();

  if (!inputs.estimateMid) return null;

  const siteValue = inputs.siteValue || 0;
  const domainMid = inputs.estimateMid || 0;
  const domainUpper = inputs.estimateUpper || 0;

  const variance = siteValue - domainMid;
  const variancePercent = (variance / domainMid) * 100;
  const isHighRisk = siteValue > domainUpper;
  const isAboveMid = siteValue > domainMid;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Valuation Comparison</h3>
        {isHighRisk ? (
          <Badge className="bg-red-500 text-white border-0 text-[9px] font-black">HIGH VARIANCE</Badge>
        ) : isAboveMid ? (
          <Badge className="bg-amber-500 text-white border-0 text-[9px] font-black">ABOVE ESTIMATE</Badge>
        ) : (
          <Badge className="bg-green-500 text-white border-0 text-[9px] font-black">COMPLIANT</Badge>
        )}
      </div>

      <div className="bg-white border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
            <div className="space-y-1">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Variance to Mid-Point</p>
                <p className={`text-xl font-mono font-black ${variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {variance > 0 ? '+' : ''}{formatCurrency(variance)}
                    <span className="text-xs ml-2 opacity-50">({variancePercent.toFixed(1)}%)</span>
                </p>
            </div>
            {isHighRisk ? (
                <AlertTriangle className="h-10 w-10 text-red-100 fill-red-500" />
            ) : (
                <CheckCircle2 className="h-10 w-10 text-green-100 fill-green-500" />
            )}
        </div>

        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-start space-x-3">
            <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-gray-600 font-medium leading-relaxed">
                The entered site value of <strong className="text-gray-900">{formatCurrency(siteValue)}</strong> is
                {variance > 0 ? ' higher than ' : ' lower than '}
                the Domain automated mid-point valuation of <strong className="text-gray-900">{formatCurrency(domainMid)}</strong>.
                {isHighRisk && " This exceeds the upper confidence limit and may require further justification."}
            </p>
        </div>
      </div>
    </div>
  );
}
