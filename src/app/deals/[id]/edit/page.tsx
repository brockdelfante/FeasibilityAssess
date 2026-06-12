"use client";

import { useDealStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle2, TrendingUp, Save, Share2, Calculator, FileText, History, Wallet, Banknote, Loader2, ArrowLeft } from "lucide-react";
import { BreachAlerts } from "@/components/OutputPanel/BreachAlerts";
import { CashflowChart } from "@/components/OutputPanel/CashflowChart";
import { SensitivityMatrix } from "@/components/OutputPanel/SensitivityMatrix";
import { ScenarioComparison } from "@/components/OutputPanel/ScenarioComparison";
import { CapitalStackChart } from "@/components/OutputPanel/CapitalStackChart";
import { CalculationAudit } from "@/components/OutputPanel/CalculationAudit";

export default function DealEditPage() {
  const params = useParams();
  const router = useRouter();
  const { inputs, results, setInputs, updateProduct, addProduct, removeProduct, loadDeal, isLoading, setLoading } = useDealStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dealInfo, setDealInfo] = useState<any>(null);

  useEffect(() => {
    if (params.id) {
        setLoading(true);
        fetch(`/api/deals/${params.id}`)
            .then(res => res.json())
            .then(data => {
                setDealInfo(data);
                loadDeal(data);
            });
    }
  }, [params.id, loadDeal, setLoading]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val);

  const formatPercent = (val: number) => (val * 100).toFixed(1) + '%';

  const isSubdivision = inputs.dealType === 'subdivision';

  const handleSave = async () => {
    setIsSaving(true);
    try {
        await fetch(`/api/deals/${params.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'x-editor-name': 'Jules Smith' },
            body: JSON.stringify({
                ...inputs,
                calc_grv: results.grv,
                calc_roc: results.roc,
                calc_lvr_gross: results.lvrGross,
                calc_ltc: results.ltc,
                calc_total_dev_costs: results.totalDirectCosts,
                calc_net_realisations: results.netRealisations,
                calc_senior_funding: results.seniorFunding,
                calc_peak_debt: results.peakDebt,
            })
        });
        alert("Draft saved successfully.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
        const res = await fetch(`/api/deals/${params.id}/reports`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...inputs, results })
        });
        const data = await res.json();
        if (data.pdfUrl) {
            window.open(data.pdfUrl, '_blank');
        }
    } finally {
        setIsGenerating(false);
    }
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-gray-50 flex-col space-y-4">
    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    <p className="text-gray-500 font-medium">Loading Assessment Data...</p>
  </div>

  return (
    <div className="flex flex-col h-full bg-gray-50 min-h-screen">
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column */}
        <div className="flex-1 overflow-auto p-6 space-y-6 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Assessment</h1>
                <p className="text-gray-500 font-mono text-xs uppercase tracking-tight">{dealInfo?.project_address} — {inputs.dealType}</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                Save Draft
              </Button>
              <Button variant="outline" size="sm" onClick={handleGenerateReport} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="mr-2 h-4 w-4" />}
                Generate PDF
              </Button>
              <Button size="sm" className="bg-blue-600">
                <Share2 className="mr-2 h-4 w-4" />
                Push to HubSpot
              </Button>
            </div>
          </div>

          <Accordion type="multiple" defaultValue={["products", "costs", "finance"]} className="w-full space-y-4">
            <AccordionItem value="products" className="bg-white border rounded-lg px-6 shadow-sm">
              <AccordionTrigger className="hover:no-underline py-4 font-bold uppercase tracking-tight text-blue-900">{isSubdivision ? "Lot Mix" : "Unit Mix"}</AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="space-y-4">
                  {inputs.products.map((product, idx) => (
                    <div key={idx} className="grid grid-cols-6 gap-4 items-end border-b pb-4 last:border-0">
                      <div className="col-span-2 space-y-2">
                        <Label className="text-[10px] uppercase text-gray-400">Description</Label>
                        <Input value={product.description} onChange={(e) => updateProduct(idx, { description: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase text-gray-400">{isSubdivision ? "Lots" : "Units"}</Label>
                        <Input type="number" value={product.numLots} onChange={(e) => updateProduct(idx, { numLots: parseInt(e.target.value) || 0 })} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase text-gray-400">Area</Label>
                        <Input type="number" value={product.areaSqm} onChange={(e) => updateProduct(idx, { areaSqm: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase text-gray-400">Valuation</Label>
                        <Input type="number" value={product.grossAICValuation} onChange={(e) => updateProduct(idx, { grossAICValuation: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div className="flex justify-end">
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => removeProduct(idx)}>Del</Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addProduct} className="w-full border-dashed">Add Product Line</Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="costs" className="bg-white border rounded-lg px-6 shadow-sm">
              <AccordionTrigger className="hover:no-underline py-4 font-bold uppercase tracking-tight text-blue-900">Project Costs (ex GST)</AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase text-gray-400">Site Value</Label>
                    <Input type="number" value={inputs.siteValue} onChange={(e) => setInputs({ siteValue: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase text-gray-400">{isSubdivision ? "Civil Works" : "Construction"}</Label>
                    <Input type="number" value={inputs.construction} onChange={(e) => setInputs({ construction: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase text-gray-400">Professional Fees</Label>
                    <Input type="number" value={inputs.professionalFees} onChange={(e) => setInputs({ professionalFees: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase text-gray-400">Development Contingency</Label>
                    <Input type="number" value={inputs.developmentContingency} onChange={(e) => setInputs({ developmentContingency: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Right Column */}
        <div className="w-[450px] border-l bg-white flex flex-col shadow-xl">
          <div className="p-4 border-b bg-[#0F1923] text-white flex justify-between items-center">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Analysis Engine</h2>
            <Badge variant="outline" className="text-blue-400 border-blue-400 text-[10px]">LIVE</Badge>
          </div>

          <Tabs defaultValue="summary" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4 h-12">
                <TabsTrigger value="summary" className="text-[10px] uppercase font-bold data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none">Summary</TabsTrigger>
                <TabsTrigger value="scenarios" className="text-[10px] uppercase font-bold data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none">Scenarios</TabsTrigger>
                <TabsTrigger value="audit" className="text-[10px] uppercase font-bold data-[state=active]:border-b-2 data-[state=active]:border-blue-600 rounded-none">Calculation Audit</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="flex-1 overflow-auto p-6 space-y-6 m-0">
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-3 rounded-lg border border-l-4 border-l-blue-600">
                        <p className="text-[10px] text-gray-400 uppercase font-bold">ROC</p>
                        <p className="text-lg font-mono font-bold text-gray-900">{formatPercent(results.roc)}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border">
                        <p className="text-[10px] text-gray-400 uppercase font-bold">ROE</p>
                        <p className="text-lg font-mono font-bold text-green-700">{formatPercent(results.roe)}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border">
                        <p className="text-[10px] text-gray-400 uppercase font-bold">LVR (Gross)</p>
                        <p className="text-lg font-mono font-bold text-gray-900">{formatPercent(results.lvrGross)}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border">
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Peak Debt</p>
                        <p className="text-lg font-mono font-bold text-gray-900">{formatCurrency(results.peakDebt)}</p>
                    </div>
                </div>
                <BreachAlerts results={results} />
                <Separator />
                <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Capital Stack</h3>
                    <CapitalStackChart inputs={inputs} results={results} />
                </div>
                <Separator />
                <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Debt Profile</h3>
                    <CashflowChart results={results} />
                </div>
            </TabsContent>

            <TabsContent value="scenarios" className="flex-1 overflow-auto p-6 space-y-6 m-0">
                <ScenarioComparison inputs={inputs} />
                <Separator />
                <SensitivityMatrix inputs={inputs} />
            </TabsContent>

            <TabsContent value="audit" className="flex-1 overflow-auto p-6 m-0">
                <CalculationAudit inputs={inputs} results={results} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
