"use client";

import { DealInputs, calculateAll } from "@/lib/calculations";

interface SensitivityMatrixProps {
  inputs: DealInputs;
}

export function SensitivityMatrix({ inputs }: SensitivityMatrixProps) {
  const grvAdj = [-0.20, -0.10, 0, 0.10, 0.20];
  const costAdj = [-0.10, 0, 0.10, 0.20];

  const getRoc = (g: number, c: number) => {
    const adjusted = {
      ...inputs,
      products: inputs.products.map(p => ({
        ...p,
        grossAICValuation: p.grossAICValuation * (1 + g)
      })),
      construction: inputs.construction * (1 + c),
      constructionContingency: inputs.constructionContingency * (1 + c)
    };
    return calculateAll(adjusted).roc;
  };

  const getBgColor = (roc: number) => {
    if (roc < 0.15) return 'bg-red-100 text-red-800';
    if (roc < 0.20) return 'bg-amber-100 text-amber-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="space-y-4 pt-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">ROC Sensitivity (GRV vs Cost)</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px] border-collapse">
          <thead>
            <tr>
              <th className="border p-1 bg-gray-50">GRV \ Cost</th>
              {costAdj.map(c => (
                <th key={c} className="border p-1 bg-gray-50">{(c * 100).toFixed(0)}% Cost</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grvAdj.map(g => (
              <tr key={g}>
                <td className="border p-1 bg-gray-50 font-bold">{(g * 100).toFixed(0)}% GRV</td>
                {costAdj.map(c => {
                  const roc = getRoc(g, c);
                  return (
                    <td key={c} className={`border p-1 text-center font-mono ${getBgColor(roc)}`}>
                      {(roc * 100).toFixed(1)}%
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
