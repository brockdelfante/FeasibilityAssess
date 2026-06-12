"use client";

import { useDealStore } from "@/lib/store";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle2, TrendingDown, TrendingUp, Save, Share2, Calculator, FileText, History, Wallet, Banknote } from "lucide-react";
import { BreachAlerts } from "@/components/OutputPanel/BreachAlerts";
import { CashflowChart } from "@/components/OutputPanel/CashflowChart";
import { SensitivityMatrix } from "@/components/OutputPanel/SensitivityMatrix";
import { ScenarioComparison } from "@/components/OutputPanel/ScenarioComparison";
import { CapitalStackChart } from "@/components/OutputPanel/CapitalStackChart";

export default function DealEditPage() {
  const { inputs, results, setInputs, updateProduct, addProduct, removeProduct } = useDealStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isPushing, setIsPushing] = useState(false);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val);

  const formatPercent = (val: number) => (val * 100).toFixed(1) + '%';

  const isSubdivision = inputs.dealType === 'subdivision';

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsSaving(false);
  };

  const handlePush = async (type: 'dfs' | 'advisory') => {
    setIsPushing(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsPushing(false);
    alert(`Pushed to HubSpot ${type.toUpperCase()} pipeline successfully!`);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Assessment</h1>
              <p className="text-gray-500">123 Example St, Brisbane — {inputs.dealType.toUpperCase()}</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save Draft"}
              </Button>
              <Button size="sm" className="bg-blue-600" onClick={() => handlePush('dfs')} disabled={isPushing}>
                <Share2 className="mr-2 h-4 w-4" />
                {isPushing ? "Pushing..." : "Push to HubSpot"}
              </Button>
            </div>
          </div>

          <Accordion type="multiple" defaultValue={["products", "costs", "finance"]} className="w-full space-y-4">
            <AccordionItem value="products" className="bg-white border rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline py-4">
                <span className="text-lg font-semibold">{isSubdivision ? "Lot Mix Table" : "Development Product Table"}</span>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="space-y-4">
                  {inputs.products.map((product, idx) => (
                    <div key={idx} className="grid grid-cols-6 gap-4 items-end border-b pb-4 last:border-0">
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor={`product-desc-${idx}`}>Description</Label>
                        <Input id={`product-desc-${idx}`} value={product.description} onChange={(e) => updateProduct(idx, { description: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`product-lots-${idx}`}>{isSubdivision ? "No. Lots" : "Units"}</Label>
                        <Input id={`product-lots-${idx}`} type="number" value={product.numLots} onChange={(e) => updateProduct(idx, { numLots: parseInt(e.target.value) || 0 })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`product-area-${idx}`}>{isSubdivision ? "Avg Lot Size" : "Area (sqm)"}</Label>
                        <Input id={`product-area-${idx}`} type="number" value={product.areaSqm} onChange={(e) => updateProduct(idx, { areaSqm: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`product-val-${idx}`}>Valuation (inc GST)</Label>
                        <Input id={`product-val-${idx}`} type="number" value={product.grossAICValuation} onChange={(e) => updateProduct(idx, { grossAICValuation: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div className="flex justify-end">
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => removeProduct(idx)}>Remove</Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addProduct}>Add Line</Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="costs" className="bg-white border rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline py-4">
                <span className="text-lg font-semibold">{isSubdivision ? "Subdivision Costs" : "Direct Project Costs"}</span>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="siteValue">Site Purchase Price</Label>
                    <Input id="siteValue" type="number" value={inputs.siteValue} onChange={(e) => setInputs({ siteValue: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="construction">{isSubdivision ? "Civil Works Cost" : "Construction Cost"}</Label>
                    <Input id="construction" type="number" value={inputs.construction} onChange={(e) => setInputs({ construction: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="professionalFees">Professional Fees</Label>
                    <Input id="professionalFees" type="number" value={inputs.professionalFees} onChange={(e) => setInputs({ professionalFees: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="devContingency">Contingency</Label>
                    <Input id="devContingency" type="number" value={inputs.developmentContingency} onChange={(e) => setInputs({ developmentContingency: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="finance" className="bg-white border rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline py-4">
                <span className="text-lg font-semibold">Finance & Capital Structure</span>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="font-medium text-blue-900 flex items-center"><Banknote className="h-4 w-4 mr-2" /> Senior Debt</h4>
                      <div className="space-y-2">
                        <Label>Interest Rate (p.a.)</Label>
                        <Input type="number" step="0.01" value={inputs.interestRate * 100} onChange={e => setInputs({ interestRate: (parseFloat(e.target.value) || 0) / 100 })} />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-medium text-green-900 flex items-center"><Wallet className="h-4 w-4 mr-2" /> Customer Equity</h4>
                      <div className="space-y-2">
                        <Label>Cash Contribution</Label>
                        <Input type="number" value={inputs.customerCashEquity} onChange={e => setInputs({ customerCashEquity: parseFloat(e.target.value) || 0 })} />
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-amber-900 flex items-center"><TrendingUp className="h-4 w-4 mr-2" /> Mezzanine / 2nd Mortgage</h4>
                      <Switch checked={inputs.mezzEnabled} onCheckedChange={v => setInputs({ mezzEnabled: v })} />
                    </div>
                    {inputs.mezzEnabled && (
                      <div className="grid grid-cols-2 gap-x-8 gap-y-4 pt-2">
                        <div className="space-y-2">
                          <Label>Mezzanine Amount</Label>
                          <Input type="number" value={inputs.mezzAmount} onChange={e => setInputs({ mezzAmount: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Mezz Interest Rate (p.a.)</Label>
                          <Input type="number" step="0.01" value={inputs.mezzInterestRate * 100} onChange={e => setInputs({ mezzInterestRate: (parseFloat(e.target.value) || 0) / 100 })} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Right Column */}
        <div className="w-[400px] border-l bg-white flex flex-col shadow-xl">
          <div className="p-6 border-b">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Live Feasibility Summary</h2>
          </div>
          <div className="flex-1 overflow-auto p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg border">
                <p className="text-xs text-gray-500 mb-1">ROC</p>
                <p className={`text-xl font-bold ${results.roc >= 0.2 ? "text-green-600" : "text-red-600"}`}>{formatPercent(results.roc)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border">
                <p className="text-xs text-gray-500 mb-1">ROE</p>
                <p className="text-xl font-bold text-green-700">{formatPercent(results.roe)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border">
                <p className="text-xs text-gray-500 mb-1">LVR (Gross)</p>
                <p className={`text-xl font-bold ${results.lvrGross <= 0.65 ? "text-green-600" : "text-red-600"}`}>{formatPercent(results.lvrGross)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border">
                <p className="text-xs text-gray-500 mb-1">LTC</p>
                <p className={`text-xl font-bold ${results.ltc <= 0.8 ? "text-green-600" : "text-red-600"}`}>{formatPercent(results.ltc)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border">
                <p className="text-xs text-gray-500 mb-1">Profit per {isSubdivision ? "Lot" : "Unit"}</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(results.profitPerUnit)}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border">
                <p className="text-xs text-gray-500 mb-1">Blended Rate</p>
                <p className="text-lg font-bold text-gray-900">{formatPercent(results.blendedRate)}</p>
              </div>
            </div>

            <Separator />
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Capital Stack</h3>
              <CapitalStackChart inputs={inputs} results={results} />
            </div>
            <Separator />
            <BreachAlerts results={results} />
            <Separator />
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Cashflow Forecast</h3>
              <CashflowChart results={results} />
            </div>
            <Separator />
            <ScenarioComparison inputs={inputs} />
            <Separator />
            <SensitivityMatrix inputs={inputs} />
          </div>
        </div>
      </div>
    </div>
  );
}
