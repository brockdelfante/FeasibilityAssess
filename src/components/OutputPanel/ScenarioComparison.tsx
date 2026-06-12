"use client";

import { DealInputs, executeScenarios } from "@/lib/calculations";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ScenarioComparisonProps {
  inputs: DealInputs;
}

export function ScenarioComparison({ inputs }: ScenarioComparisonProps) {
  const scenarios = executeScenarios(inputs, null);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val);

  const formatPercent = (val: number) => (val * 100).toFixed(1) + '%';

  const rows = [
    { label: 'ROC', key: 'roc', format: formatPercent },
    { label: 'Profit', key: 'profitAmount', format: formatCurrency },
    { label: 'LVR (Gross)', key: 'lvrGross', format: formatPercent },
    { label: 'LTC', key: 'ltc', format: formatPercent },
    { label: 'Total Costs', key: 'totalDirectCosts', format: formatCurrency },
  ];

  return (
    <div className="space-y-4 pt-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Scenario Analysis</h3>
      <Table>
        <TableHeader>
          <TableRow className="text-[10px]">
            <TableHead className="h-8">Metric</TableHead>
            <TableHead className="text-right h-8">Upside</TableHead>
            <TableHead className="text-right h-8 font-bold text-blue-600">Base</TableHead>
            <TableHead className="text-right h-8">Downside</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.key} className="text-[11px]">
              <TableCell className="py-2 font-medium">{row.label}</TableCell>
              <TableCell className="py-2 text-right text-green-600">{row.format((scenarios.upside as any)[row.key])}</TableCell>
              <TableCell className="py-2 text-right font-bold">{row.format((scenarios.base as any)[row.key])}</TableCell>
              <TableCell className="py-2 text-right text-red-600">{row.format((scenarios.downside as any)[row.key])}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
