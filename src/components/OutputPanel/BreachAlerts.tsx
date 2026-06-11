import { CalculationResults } from "@/lib/calculations";
import { detectBreaches, BreachResult } from "@/lib/policy";
import { AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";

interface BreachAlertsProps {
  results: CalculationResults;
}

export function BreachAlerts({ results }: BreachAlertsProps) {
  const breaches = detectBreaches(results);

  const formatValue = (result: BreachResult) => {
    if (result.field.includes('Sqm')) {
      return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(result.value);
    }
    return (result.value * 100).toFixed(1) + '%';
  };

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Policy Compliance</h3>
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
            <div className="flex items-center text-xs font-medium">
              {b.severity === 'breach' ? <AlertCircle className="h-3 w-3 mr-2" /> :
               b.severity === 'warning' ? <AlertTriangle className="h-3 w-3 mr-2" /> :
               <CheckCircle2 className="h-3 w-3 mr-2" />}
              {b.label}
            </div>
            <span className="text-xs font-bold">{formatValue(b)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
