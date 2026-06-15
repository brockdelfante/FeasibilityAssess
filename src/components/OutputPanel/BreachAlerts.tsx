import { useDealStore } from "@/lib/store";
import { detectBreaches, BreachResult } from "@/lib/policy";
import { AlertCircle, CheckCircle2, AlertTriangle, TrendingDown } from "lucide-react";

export function BreachAlerts() {
  const { results, inputs } = useDealStore();
  const breaches = detectBreaches(results, inputs);

  const formatValue = (result: BreachResult) => {
    if (result.field.includes('Sqm') || result.field.includes('valuation')) {
      return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(result.value);
    }
    return (result.value * 100).toFixed(1) + '%';
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {breaches.map((b) => (
          <div
            key={b.field}
            className={`flex items-center justify-between p-2 rounded border ${
              b.severity === 'breach' ? "bg-red-50 border-red-200 text-red-900" :
              b.severity === 'warning' ? "bg-amber-50 border-amber-200 text-amber-900" :
              "bg-green-50 border-green-200 text-green-900"
            }`}
          >
            <div className="flex items-center text-[10px] font-bold uppercase">
              {b.severity === 'breach' ? <AlertCircle className="h-3 w-3 mr-2" /> :
               b.severity === 'warning' ? <AlertTriangle className="h-3 w-3 mr-2" /> :
               <CheckCircle2 className="h-3 w-3 mr-2" />}
              {b.label}
            </div>
            <span className="text-[11px] font-black font-mono">{formatValue(b)}</span>
          </div>
        ))}
      </div>

      <div className={`p-3 rounded-lg border flex items-center justify-between ${results.rlv >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100'}`}>
         <div className="flex items-center">
            <TrendingDown className="h-4 w-4 mr-2 text-blue-500" />
            <span className="text-[10px] font-bold uppercase text-gray-500">Residual Land Value</span>
         </div>
         <span className="text-xs font-black font-mono text-blue-900">{formatCurrency(results.rlv)}</span>
      </div>
    </div>
  );
}
