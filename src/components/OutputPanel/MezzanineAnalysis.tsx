"use client";

import { CalculationResults, DealInputs } from "@/lib/calculations";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ShieldAlert, Target } from "lucide-react";

export function MezzanineAnalysis({ inputs, results }: { inputs: DealInputs, results: CalculationResults }) {
  if (!inputs.mezzEnabled) return (
    <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
        <div className="bg-gray-100 p-4 rounded-full"><TrendingUp className="h-8 w-8 text-gray-400" /></div>
        <div className="space-y-1">
            <h3 className="font-bold text-gray-900">Mezzanine Not Active</h3>
            <p className="text-sm text-gray-500 max-w-[200px]">Enable 2nd mortgage financing in the form to view layer analysis.</p>
        </div>
    </div>
  );

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val);

  const seniorLvr = results.lvrGross;
  const mezzLvr = results.mezzLVR || 0;
  const mezzLayer = mezzLvr - seniorLvr;

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 opacity-5"><TrendingUp className="h-24 w-24" /></div>
        <div className="flex justify-between items-center mb-4 relative z-10">
            <h3 className="text-xs font-black uppercase tracking-widest text-amber-900">Viability Assessment</h3>
            <Badge className="bg-amber-200 text-amber-900 border-0 font-black">2ND MORTGAGE</Badge>
        </div>
        <div className="grid grid-cols-2 gap-6 relative z-10">
            <div>
                <p className="text-[10px] text-amber-700 uppercase font-black tracking-tighter mb-1">Advance Amount</p>
                <p className="text-2xl font-mono font-black text-amber-900">{formatCurrency(inputs.mezzAmount || 0)}</p>
            </div>
            <div>
                <p className="text-[10px] text-amber-700 uppercase font-black tracking-tighter mb-1">Effective Rate</p>
                <p className="text-2xl font-mono font-black text-amber-900">{(inputs.mezzInterestRate * 100).toFixed(1)}%</p>
            </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center"><Target className="h-3 w-3 mr-1" /> Capital Stack Exposure</h4>
        <div className="space-y-3">
            <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold uppercase">
                    <span className="text-blue-600">Senior Layer</span>
                    <span>{(seniorLvr * 100).toFixed(1)}% LVR</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: `${seniorLvr * 100}%` }} />
                </div>
            </div>
            <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold uppercase">
                    <span className="text-amber-600">Mezzanine Layer (The Gap)</span>
                    <span>{(mezzLayer * 100).toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-blue-200" style={{ width: `${seniorLvr * 100}%` }} />
                    <div className="h-full bg-amber-500" style={{ width: `${mezzLayer * 100}%` }} />
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Total LVR</p>
                <p className="text-lg font-mono font-black text-gray-900">{(mezzLvr * 100).toFixed(1)}%</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Total LTC</p>
                <p className="text-lg font-mono font-black text-gray-900">{(results.mezzLTC || 0 * 100).toFixed(1)}%</p>
            </div>
      </div>

      <div className="space-y-3 text-[11px] bg-white p-4 rounded-xl border border-gray-100">
        <div className="flex justify-between text-gray-500 font-medium">
            <span>Capitalised Interest</span>
            <span>{formatCurrency(results.mezzTotalInterest || 0)}</span>
        </div>
        <div className="flex justify-between text-gray-500 font-medium">
            <span>Fees (App + Broker + Legal)</span>
            <span>{formatCurrency((results.mezzTotalRepayment || 0) - (inputs.mezzAmount || 0) - (results.mezzTotalInterest || 0))}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-black text-amber-900 uppercase">
            <span>Total Mezz Repayment</span>
            <span className="font-mono">{formatCurrency(results.mezzTotalRepayment || 0)}</span>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/30 flex items-start space-x-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                <strong>Lender Note:</strong> Second mortgage viability is highly dependent on the residual LVR after senior debt repayment. Ensure the total blended LVR does not exceed the target threshold of 80.0%.
            </p>
      </div>
    </div>
  );
}
