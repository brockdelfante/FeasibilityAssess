"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function QuickTestPage() {
  const [data, setData] = useState({
    grv: 0,
    purchasePrice: 0,
    construction: 0,
    mezz: 0,
    interest: 0.1,
  });

  const totalCosts = data.purchasePrice + data.construction;
  const seniorDebt = totalCosts - data.mezz;
  const profit = data.grv - totalCosts;
  const roc = totalCosts > 0 ? profit / totalCosts : 0;
  const lvr = data.grv > 0 ? seniorDebt / data.grv : 0;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Quick Deal Test</h1>
      <p className="text-muted-foreground">Simplified feasibility check for immediate viability screening.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader><CardTitle>Inputs</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quick-grv">Estimated GRV</Label>
              <Input id="quick-grv" type="number" onChange={e => setData({...data, grv: parseFloat(e.target.value) || 0})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-purchase">Site Purchase Price</Label>
              <Input id="quick-purchase" type="number" onChange={e => setData({...data, purchasePrice: parseFloat(e.target.value) || 0})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-costs">Construction & Other Costs</Label>
              <Input id="quick-costs" type="number" onChange={e => setData({...data, construction: parseFloat(e.target.value) || 0})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-mezz">Mezzanine Amount (Optional)</Label>
              <Input id="quick-mezz" type="number" onChange={e => setData({...data, mezz: parseFloat(e.target.value) || 0})} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-brand-50 border-brand-200">
          <CardHeader><CardTitle>Quick Results</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-end border-b pb-2">
              <span className="text-muted-foreground">Total Profit (Surplus)</span>
              <span className="text-2xl font-bold text-brand-900">{formatCurrency(profit)}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase">Return on Cost</p>
                <p className={`text-lg font-bold ${roc >= 0.2 ? "text-positive-600" : "text-critical-600"}`}>
                  {(roc * 100).toFixed(1)}%
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase">Senior LVR</p>
                <p className={`text-lg font-bold ${lvr <= 0.65 ? "text-positive-600" : "text-critical-600"}`}>
                  {(lvr * 100).toFixed(1)}%
                </p>
              </div>
            </div>
            <Separator />
            <div className="text-sm text-muted-foreground italic">
              * This is a high-level estimate only and does not include detailed cashflow interest, GST margins, or staged fees.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
