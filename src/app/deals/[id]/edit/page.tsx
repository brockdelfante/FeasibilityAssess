"use client";

import { useDealStore } from "@/lib/store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle2, TrendingDown, TrendingUp, Save, Share2, Calculator } from "lucide-react";
import { BreachAlerts } from "@/components/OutputPanel/BreachAlerts";
import { CashflowChart } from "@/components/OutputPanel/CashflowChart";
import { SensitivityMatrix } from "@/components/OutputPanel/SensitivityMatrix";

export default function DealEditPage() {
  const { inputs, results, setInputs, updateProduct, addProduct, removeProduct } = useDealStore();

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val);

  const formatPercent = (val: number) => (val * 100).toFixed(1) + '%';

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Input Form */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Assessment</h1>
              <p className="text-gray-500">123 Example St, Brisbane — Construction</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
              <Button size="sm" className="bg-blue-600">
                <Share2 className="mr-2 h-4 w-4" />
                Push to HubSpot
              </Button>
            </div>
          </div>

          <Accordion type="multiple" defaultValue={["products", "costs"]} className="w-full space-y-4">
            <AccordionItem value="products" className="bg-white border rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline py-4">
                <span className="text-lg font-semibold">Development Product Table</span>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="space-y-4">
                  {inputs.products.map((product, idx) => (
                    <div key={idx} className="grid grid-cols-6 gap-4 items-end border-b pb-4 last:border-0">
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor={`product-desc-${idx}`}>Description</Label>
                        <Input
                          id={`product-desc-${idx}`}
                          value={product.description}
                          onChange={(e) => updateProduct(idx, { description: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`product-lots-${idx}`}>No. Lots</Label>
                        <Input
                          id={`product-lots-${idx}`}
                          type="number"
                          value={product.numLots}
                          onChange={(e) => updateProduct(idx, { numLots: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`product-area-${idx}`}>Area (sqm)</Label>
                        <Input
                          id={`product-area-${idx}`}
                          type="number"
                          value={product.areaSqm}
                          onChange={(e) => updateProduct(idx, { areaSqm: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`product-val-${idx}`}>Valuation (inc GST)</Label>
                        <Input
                          id={`product-val-${idx}`}
                          type="number"
                          value={product.grossAICValuation}
                          onChange={(e) => updateProduct(idx, { grossAICValuation: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => removeProduct(idx)}>Remove</Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addProduct}>Add Product Line</Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="costs" className="bg-white border rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline py-4">
                <span className="text-lg font-semibold">Direct Project Costs</span>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="siteValue">Site Value</Label>
                    <Input
                      id="siteValue"
                      type="number"
                      value={inputs.siteValue}
                      onChange={(e) => setInputs({ siteValue: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="construction">Construction Cost</Label>
                    <Input
                      id="construction"
                      type="number"
                      value={inputs.construction}
                      onChange={(e) => setInputs({ construction: parseFloat(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-gray-500">Implied: {formatCurrency(results.constructionCostPerSqm)}/sqm</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="professionalFees">Professional Fees</Label>
                    <Input
                      id="professionalFees"
                      type="number"
                      value={inputs.professionalFees}
                      onChange={(e) => setInputs({ professionalFees: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="devContingency">Development Contingency</Label>
                    <Input
                      id="devContingency"
                      type="number"
                      value={inputs.developmentContingency}
                      onChange={(e) => setInputs({ developmentContingency: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Right Column: Output Panel */}
        <div className="w-[400px] border-l bg-white flex flex-col shadow-xl">
          <div className="p-6 border-b">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Live Feasibility Summary</h2>
          </div>
          <div className="flex-1 overflow-auto p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg border">
                <p className="text-xs text-gray-500 mb-1">ROC</p>
                <p className={`text-xl font-bold ${results.roc >= 0.2 ? "text-green-600" : "text-red-600"}`}>
                  {formatPercent(results.roc)}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border">
                <p className="text-xs text-gray-500 mb-1">Profit</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(results.profitAmount)}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border">
                <p className="text-xs text-gray-500 mb-1">LVR (Gross)</p>
                <p className={`text-xl font-bold ${results.lvrGross <= 0.65 ? "text-green-600" : "text-red-600"}`}>
                  {formatPercent(results.lvrGross)}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border">
                <p className="text-xs text-gray-500 mb-1">LTC</p>
                <p className={`text-xl font-bold ${results.ltc <= 0.8 ? "text-green-600" : "text-red-600"}`}>
                  {formatPercent(results.ltc)}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">GRV (Inc GST)</span>
                <span className="font-mono font-medium">{formatCurrency(results.grv)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">GST Liability</span>
                <span className="font-mono font-medium">{formatCurrency(results.gst)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">NRV (Ex GST)</span>
                <span className="font-mono font-medium">{formatCurrency(results.nrv)}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2 mt-2">
                <span className="text-gray-900 font-semibold">Net Realisations</span>
                <span className="font-mono font-bold text-gray-900">{formatCurrency(results.netRealisations)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Direct Costs</span>
                <span className="font-mono font-medium">{formatCurrency(results.totalDirectCosts)}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2 mt-2">
                <span className="text-gray-900 font-semibold">Senior Funding</span>
                <span className="font-mono font-bold text-blue-600">{formatCurrency(results.seniorFunding)}</span>
              </div>
            </div>

            <BreachAlerts results={results} />
            <Separator />
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Cashflow Forecast</h3>
              <CashflowChart results={results} />
            </div>
            <Separator />
            <SensitivityMatrix inputs={inputs} />
          </div>
        </div>
      </div>
    </div>
  );
}
