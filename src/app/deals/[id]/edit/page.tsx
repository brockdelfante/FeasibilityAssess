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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle2, TrendingUp, Save, Share2, Calculator, FileText, History, Wallet, Banknote, Loader2, ArrowLeft, Plus, Trash2, Calendar, User, ExternalLink, MapPin, Info, ArrowUpRight } from "lucide-react";
import { BreachAlerts } from "@/components/OutputPanel/BreachAlerts";
import { CashflowChart } from "@/components/OutputPanel/CashflowChart";
import { SensitivityMatrix } from "@/components/OutputPanel/SensitivityMatrix";
import { ScenarioComparison } from "@/components/OutputPanel/ScenarioComparison";
import { CapitalStackChart } from "@/components/OutputPanel/CapitalStackChart";
import { CalculationAudit } from "@/components/OutputPanel/CalculationAudit";

export default function DealEditPage() {
  const params = useParams();
  const router = useRouter();
  const {
    inputs, results, setInputs, updateProduct, addProduct, removeProduct,
    loadDeal, isLoading, setLoading, updatePresale, addPresale, removePresale
  } = useDealStore();

  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPushingDFS, setIsPushingDFS] = useState(false);
  const [isPushingAdv, setIsPushingAdv] = useState(false);
  const [dealInfo, setDealInfo] = useState<any>(null);

  const fetchDeal = async () => {
    const res = await fetch(`/api/deals/${params.id}`);
    const data = await res.json();
    setDealInfo(data);
    loadDeal(data);
  };

  useEffect(() => {
    if (params.id) {
        setLoading(true);
        fetchDeal();
    }
  }, [params.id]);

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
        await fetchDeal();
    } finally {
        setIsSaving(false);
    }
  };

  const handlePush = async (pipeline: 'dfs' | 'advisory') => {
    const setStatus = pipeline === 'dfs' ? setIsPushingDFS : setIsPushingAdv;
    setStatus(true);
    try {
        const res = await fetch(`/api/deals/${params.id}/push-${pipeline}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...inputs, ...results })
        });
        const data = await res.json();
        if (data.success) {
            await fetchDeal();
        }
    } finally {
        setStatus(false);
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

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-gray-50 flex-col space-y-4"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>

  return (
    <div className="flex flex-col h-full bg-gray-50 min-h-screen">
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Inputs */}
        <div className="flex-1 overflow-auto p-6 space-y-6 text-sm pb-32">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="rounded-full bg-white shadow-sm border">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{inputs.customerGroup || "Assessment Overview"}</h1>
                <div className="flex items-center text-gray-500 font-medium text-xs mt-1 uppercase tracking-widest">
                    <MapPin className="h-3 w-3 mr-1" /> {inputs.projectAddress || "Unnamed Site"}
                    <span className="mx-2 text-gray-300">|</span>
                    <Badge variant="secondary" className="text-[9px] font-black uppercase">{inputs.dealType}</Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving} className="bg-white">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                Save
              </Button>

              <div className="h-6 w-px bg-gray-200 mx-2" />

              <div className="flex items-center space-x-1">
                {dealInfo?.hubspot_dfs_deal_id ? (
                    <Button variant="secondary" size="sm" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200" asChild>
                        <a href={`https://app.hubspot.com/contacts/${process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID}/deal/${dealInfo.hubspot_dfs_deal_id}`} target="_blank">
                            DFS Pushed <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                    </Button>
                ) : (
                    <Button variant="outline" size="sm" onClick={() => handlePush('dfs')} disabled={isPushingDFS} className="bg-white">
                        {isPushingDFS ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-3 w-3 mr-1" />}
                        Push DFS
                    </Button>
                )}

                {dealInfo?.hubspot_advisory_deal_id ? (
                    <Button variant="secondary" size="sm" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200" asChild>
                        <a href={`https://app.hubspot.com/contacts/${process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID}/deal/${dealInfo.hubspot_advisory_deal_id}`} target="_blank">
                            ADV Pushed <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                    </Button>
                ) : (
                    <Button variant="outline" size="sm" onClick={() => handlePush('advisory')} disabled={isPushingAdv} className="bg-white">
                        {isPushingAdv ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-3 w-3 mr-1" />}
                        Push ADV
                    </Button>
                )}
              </div>

              <Button variant="default" size="sm" onClick={handleGenerateReport} disabled={isGenerating} className="bg-blue-600 hover:bg-blue-700 ml-2">
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="mr-2 h-4 w-4" />}
                Generate PDF
              </Button>
            </div>
          </div>

          <Accordion type="multiple" defaultValue={["products", "costs", "programme", "finance", "audit"]} className="w-full space-y-4">
            {/* Developer Profile */}
            <AccordionItem value="developer" className="bg-white border rounded-xl px-6 shadow-sm overflow-hidden">
                <AccordionTrigger className="hover:no-underline py-4 font-bold uppercase tracking-widest text-[11px] text-gray-500">Developer Profile</AccordionTrigger>
                <AccordionContent className="pb-6">
                    <div className="grid grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase text-gray-400 font-bold">Years Experience</Label>
                            <Input type="number" value={inputs.developerExperienceYears} onChange={e => setInputs({ developerExperienceYears: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase text-gray-400 font-bold">Projects Completed</Label>
                            <Input type="number" value={inputs.developerProjectsCompleted} onChange={e => setInputs({ developerProjectsCompleted: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase text-gray-400 font-bold">Net Worth (AUD)</Label>
                            <Input type="number" value={inputs.developerTnw} onChange={e => setInputs({ developerTnw: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase text-gray-400 font-bold">Liquidity (AUD)</Label>
                            <Input type="number" value={inputs.developerLiquidity} onChange={e => setInputs({ developerLiquidity: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div className="col-span-4 space-y-2 pt-2">
                            <Label className="text-[10px] uppercase text-gray-400 font-bold">Track Record Notes</Label>
                            <Textarea className="min-h-[80px]" value={inputs.developerNotes} onChange={e => setInputs({ developerNotes: e.target.value })} placeholder="Summarize previous project types and success..." />
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>

            {/* Product Mix */}
            <AccordionItem value="products" className="bg-white border rounded-xl px-6 shadow-sm overflow-hidden">
              <AccordionTrigger className="hover:no-underline py-4 font-bold uppercase tracking-widest text-[11px] text-gray-500">{isSubdivision ? "Lot Mix Table" : "Unit Mix Table"}</AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-6 gap-4 text-[10px] uppercase font-bold text-gray-400 px-1">
                    <div className="col-span-2">Description</div>
                    <div>{isSubdivision ? "Lots" : "Units"}</div>
                    <div>{isSubdivision ? "Avg Size" : "Area"}</div>
                    <div>Valuation</div>
                    <div />
                  </div>
                  {inputs.products.map((product, idx) => (
                    <div key={idx} className="grid grid-cols-6 gap-4 items-center bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                      <div className="col-span-2"><Input value={product.description} onChange={(e) => updateProduct(idx, { description: e.target.value })} className="bg-white" /></div>
                      <div><Input type="number" value={product.numLots} onChange={(e) => updateProduct(idx, { numLots: parseInt(e.target.value) || 0 })} className="bg-white" /></div>
                      <div><Input type="number" value={product.areaSqm} onChange={(e) => updateProduct(idx, { areaSqm: parseFloat(e.target.value) || 0 })} className="bg-white" /></div>
                      <div><Input type="number" value={product.grossAICValuation} onChange={(e) => updateProduct(idx, { grossAICValuation: parseFloat(e.target.value) || 0 })} className="bg-white" /></div>
                      <div className="flex justify-end">
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-600" onClick={() => removeProduct(idx)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addProduct} className="w-full border-dashed bg-white text-gray-500 hover:text-blue-600"><Plus className="h-4 w-4 mr-2" /> Add Product Line</Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Programme */}
            <AccordionItem value="programme" className="bg-white border rounded-xl px-6 shadow-sm overflow-hidden">
                <AccordionTrigger className="hover:no-underline py-4 font-bold uppercase tracking-widest text-[11px] text-gray-500">Programme & Timeline</AccordionTrigger>
                <AccordionContent className="pb-6">
                    <div className="grid grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase text-gray-400 font-bold">Start Date</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                                <Input type="date" className="pl-10 bg-white" value={new Date(inputs.startDate).toISOString().split('T')[0]} onChange={e => setInputs({ startDate: new Date(e.target.value) })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase text-gray-400 font-bold">Build Term (Mo)</Label>
                            <Input type="number" value={inputs.buildTermMonths} onChange={e => setInputs({ buildTermMonths: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase text-gray-400 font-bold">Loan Term (Mo)</Label>
                            <Input type="number" value={inputs.loanTermMonths} onChange={e => setInputs({ loanTermMonths: parseInt(e.target.value) || 0 })} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase text-gray-400 font-bold">Delay Buffer</Label>
                            <Input type="number" value={inputs.delayContingencyMonths} onChange={e => setInputs({ delayContingencyMonths: parseInt(e.target.value) || 0 })} />
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>

            {/* Costs */}
            <AccordionItem value="costs" className="bg-white border rounded-xl px-6 shadow-sm overflow-hidden">
                <AccordionTrigger className="hover:no-underline py-4 font-bold uppercase tracking-widest text-[11px] text-gray-500">Direct Project Costs</AccordionTrigger>
                <AccordionContent className="pb-6">
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                        <div className="space-y-2 border-l-2 border-blue-500 pl-4">
                            <Label className="text-[10px] uppercase text-gray-400 font-bold">Site Value (inc land)</Label>
                            <Input id="site-value-input" type="number" value={inputs.siteValue} onChange={(e) => setInputs({ siteValue: parseFloat(e.target.value) || 0 })} className="font-mono font-bold" />
                        </div>
                        <div className="space-y-2 border-l-2 border-blue-500 pl-4">
                            <Label className="text-[10px] uppercase text-gray-400 font-bold">{isSubdivision ? "Civil Works Cost" : "Construction Cost"}</Label>
                            <Input id="construction-cost-input" type="number" value={inputs.construction} onChange={(e) => setInputs({ construction: parseFloat(e.target.value) || 0 })} className="font-mono font-bold" />
                        </div>
                        <div className="space-y-2 pl-4">
                            <Label className="text-[10px] uppercase text-gray-400 font-bold">Professional Fees</Label>
                            <Input type="number" value={inputs.professionalFees} onChange={(e) => setInputs({ professionalFees: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div className="space-y-2 pl-4">
                            <Label className="text-[10px] uppercase text-gray-400 font-bold">Direct Contingency</Label>
                            <Input type="number" value={inputs.developmentContingency} onChange={(e) => setInputs({ developmentContingency: parseFloat(e.target.value) || 0 })} />
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>

            {/* Finance */}
            <AccordionItem value="finance" className="bg-white border rounded-xl px-6 shadow-sm overflow-hidden">
              <AccordionTrigger className="hover:no-underline py-4 font-bold uppercase tracking-widest text-[11px] text-gray-500">Capital Structure & Mezzanine</AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="space-y-6 pt-2">
                  <div className="grid grid-cols-2 gap-12">
                    <div className="space-y-4">
                        <div className="flex items-center text-blue-900 font-bold text-[11px] uppercase tracking-wider mb-2">
                            <Banknote className="h-4 w-4 mr-2" /> Senior Funding
                        </div>
                        <div className="bg-blue-50/50 p-4 rounded-lg space-y-4 border border-blue-100">
                            <div className="space-y-1">
                                <Label className="text-[10px] text-blue-600 font-bold uppercase">Equity Contribution (Cash)</Label>
                                <Input type="number" value={inputs.customerCashEquity} onChange={e => setInputs({ customerCashEquity: parseFloat(e.target.value) || 0 })} className="bg-white border-blue-200" />
                            </div>
                            <div className="flex justify-between items-center text-xs pt-2 border-t border-blue-100 font-bold text-blue-900">
                                <span>Total Senior Debt:</span>
                                <span className="font-mono">{formatCurrency(results.seniorFunding)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-amber-900 font-bold text-[11px] uppercase tracking-wider mb-2">
                            <div className="flex items-center"><TrendingUp className="h-4 w-4 mr-2" /> Mezzanine / 2nd Mortgage</div>
                            <Switch checked={inputs.mezzEnabled} onCheckedChange={v => setInputs({ mezzEnabled: v })} />
                        </div>
                        <div className={`p-4 rounded-lg space-y-4 border transition-colors ${inputs.mezzEnabled ? 'bg-amber-50 border-amber-200 shadow-inner' : 'bg-gray-50 border-gray-100 opacity-40'}`}>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase text-gray-500 font-bold">Mezz Amount</Label>
                                    <Input type="number" disabled={!inputs.mezzEnabled} value={inputs.mezzAmount} onChange={e => setInputs({ mezzAmount: parseFloat(e.target.value) || 0 })} className="bg-white border-amber-200" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase text-gray-500 font-bold">Rate (%)</Label>
                                    <Input type="number" disabled={!inputs.mezzEnabled} step="0.1" value={inputs.mezzInterestRate * 100} onChange={e => setInputs({ mezzInterestRate: (parseFloat(e.target.value) || 0) / 100 })} className="bg-white border-amber-200" />
                                </div>
                            </div>
                        </div>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Audit Log */}
            <AccordionItem value="audit" className="bg-white border rounded-xl px-6 shadow-sm overflow-hidden">
                <AccordionTrigger className="hover:no-underline py-4 font-bold uppercase tracking-widest text-[11px] text-gray-500">Audit History</AccordionTrigger>
                <AccordionContent className="pb-6">
                    <div className="space-y-4">
                        {(dealInfo?.audit_logs || []).length === 0 ? (
                            <p className="text-xs text-gray-400 italic">No change history recorded for this assessment.</p>
                        ) : (
                            <div className="space-y-3">
                                {dealInfo.audit_logs.map((log: any, i: number) => (
                                    <div key={i} className="text-[11px] border-l-2 border-gray-200 pl-3 py-1">
                                        <div className="flex items-center space-x-2">
                                            <span className="font-black text-gray-900 uppercase tracking-tighter">{new Date(log.changed_at).toLocaleString()}</span>
                                            <span className="text-gray-400">—</span>
                                            <span className="font-bold text-blue-600 uppercase">{log.changed_by}</span>
                                        </div>
                                        <p className="text-gray-600 mt-0.5">{log.change_note} {log.field_name !== 'multi_save' && <><span className="font-mono text-gray-400">({log.field_name})</span> to <strong>{log.new_value}</strong></>}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Right Column: Engine */}
        <div className="w-[450px] border-l bg-white flex flex-col shadow-xl z-10">
          <div className="p-4 border-b bg-[#0F1923] text-white flex justify-between items-center">
            <div className="flex items-center">
                <Calculator className="h-4 w-4 mr-2 text-blue-400" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-100">Live Analysis Engine</h2>
            </div>
            <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-gray-400">REAL-TIME</span>
            </div>
          </div>

          <Tabs defaultValue="summary" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full justify-start rounded-none border-b bg-gray-50/50 px-4 h-12">
                <TabsTrigger value="summary" className="text-[10px] uppercase font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 rounded-none h-full border-x first:border-l-0">Metrics</TabsTrigger>
                <TabsTrigger value="scenarios" className="text-[10px] uppercase font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 rounded-none h-full border-r">Sensitivity</TabsTrigger>
                <TabsTrigger value="audit" className="text-[10px] uppercase font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 rounded-none h-full border-r">Logic Audit</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="flex-1 overflow-auto p-6 space-y-6 m-0 bg-white pb-20">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter mb-1">Return on Cost</p>
                        <p className={`text-2xl font-mono font-black ${results.roc >= 0.2 ? 'text-green-600' : 'text-red-600'}`}>{formatPercent(results.roc)}</p>
                    </div>
                    <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter mb-1">Return on Equity</p>
                        <p className="text-2xl font-mono font-black text-blue-700">{formatPercent(results.roe)}</p>
                    </div>
                    <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter mb-1">LVR (Gross)</p>
                        <p className="text-2xl font-mono font-black text-gray-900">{formatPercent(results.lvrGross)}</p>
                    </div>
                    <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100 shadow-sm">
                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter mb-1">Peak Debt</p>
                        <p className="text-lg font-mono font-black text-gray-900">{formatCurrency(results.peakDebt)}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-300">Policy Compliance</h3>
                    <BreachAlerts results={results} />
                </div>

                <Separator />
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-300">Capital Stack</h3>
                    <CapitalStackChart inputs={inputs} results={results} />
                </div>

                <Separator />
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-300">Monthly Debt Profile</h3>
                    <CashflowChart results={results} />
                </div>
            </TabsContent>

            <TabsContent value="scenarios" className="flex-1 overflow-auto p-6 space-y-6 m-0 bg-white">
                <ScenarioComparison inputs={inputs} />
                <Separator />
                <SensitivityMatrix inputs={inputs} />
            </TabsContent>

            <TabsContent value="audit" className="flex-1 overflow-auto p-6 m-0 bg-white">
                <CalculationAudit inputs={inputs} results={results} />
            </TabsContent>
          </Tabs>

          <div className="p-4 bg-gray-50 border-t flex justify-between items-center mt-auto">
            <div className="flex items-center text-[10px] text-gray-400 font-bold uppercase">
                <Info className="h-3 w-3 mr-1" /> All figures ex. GST unless stated
            </div>
            <p className="text-[10px] text-gray-300 font-mono">v1.1.0-PROD</p>
          </div>
        </div>
      </div>
    </div>
  );
}
