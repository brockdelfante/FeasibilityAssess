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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AlertCircle, CheckCircle2, TrendingUp, Save, Share2, Calculator, FileText, History, Wallet, Banknote, Loader2, ArrowLeft, Plus, Trash2, Calendar, User, ExternalLink, MapPin, Info, ArrowUpRight, Download, FileSpreadsheet, ShieldCheck, Scale } from "lucide-react";
import { BreachAlerts } from "@/components/OutputPanel/BreachAlerts";
import { CashflowChart } from "@/components/OutputPanel/CashflowChart";
import { SensitivityMatrix } from "@/components/OutputPanel/SensitivityMatrix";
import { ScenarioComparison } from "@/components/OutputPanel/ScenarioComparison";
import { CapitalStackChart } from "@/components/OutputPanel/CapitalStackChart";
import { CalculationAudit } from "@/components/OutputPanel/CalculationAudit";
import { ReportButton } from "@/components/Reports/ReportButton";
import { MezzanineAnalysis } from "@/components/OutputPanel/MezzanineAnalysis";
import { ExitPosition } from "@/components/OutputPanel/ExitPosition";

export default function DealEditPage() {
  const params = useParams();
  const router = useRouter();
  const {
    inputs, results, setInputs, updateProduct, addProduct, removeProduct,
    loadDeal, isLoading, setLoading, updatePresale, addPresale, removePresale
  } = useDealStore();

  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
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
                calc_covenant_breach: results.roc < 0.15 || results.lvrGross > 0.7
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

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
        const res = await fetch(`/api/deals/${params.id}/export`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...inputs, results })
        });
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Feasibility-${inputs.customerGroup || 'Project'}-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    } finally {
        setIsExporting(false);
    }
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-gray-50 flex-col space-y-4"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>

  return (
    <div className="flex flex-col h-full bg-gray-50 min-h-screen relative">
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column */}
        <div className="flex-1 overflow-auto p-6 space-y-6 text-sm pb-32">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="rounded-full bg-white shadow-sm border"><ArrowLeft className="h-5 w-5 text-gray-600" /></Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{inputs.customerGroup || "Assessment Overview"}</h1>
                <div className="flex items-center text-gray-500 font-medium text-xs mt-1 uppercase tracking-widest">
                    <MapPin className="h-3 w-3 mr-1" /> {inputs.projectAddress || "Unnamed Site"}
                    <span className="mx-2 text-gray-300">|</span>
                    <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-tighter">{inputs.dealType}</Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
                <Sheet>
                    <SheetTrigger asChild><Button variant="outline" size="sm" className="bg-white"><History className="h-4 w-4 mr-2" />History</Button></SheetTrigger>
                    <SheetContent className="w-[400px] sm:w-[540px]">
                        <SheetHeader><SheetTitle className="flex items-center font-black uppercase tracking-tight text-lg"><History className="h-5 w-5 mr-2 text-blue-600" /> Audit Log</SheetTitle></SheetHeader>
                        <div className="mt-8 space-y-4 overflow-auto h-full pr-4 pb-20">
                            {(dealInfo?.audit_logs || []).length === 0 ? <p className="text-sm text-gray-400 italic">No history found.</p> :
                                dealInfo.audit_logs.map((log: any, i: number) => (
                                    <div key={i} className="text-[12px] border-l-2 border-blue-50 pl-4 py-2 relative hover:bg-gray-50 rounded-r-lg transition-colors">
                                        <div className="absolute -left-[5px] top-4 h-2 w-2 rounded-full bg-blue-500 shadow-sm" />
                                        <div className="flex justify-between items-center mb-1"><span className="font-bold text-gray-900">{new Date(log.changed_at).toLocaleString()}</span><Badge variant="outline" className="text-[9px] uppercase font-bold text-blue-600">{log.changed_by}</Badge></div>
                                        <p className="text-gray-500 leading-relaxed">{log.change_note}</p>
                                        {log.field_name !== 'multi_save' && <div className="mt-1 flex items-center space-x-1 font-mono text-[9px]"><span className="text-gray-400">{log.field_name}:</span><span className="line-through text-gray-300">{log.old_value || 'null'}</span><span className="font-bold text-blue-600">{log.new_value}</span></div>}
                                    </div>
                                ))
                            }
                        </div>
                    </SheetContent>
                </Sheet>
                <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={isExporting} className="bg-white"><FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />Export XLSX</Button>
            </div>
          </div>

          <Accordion type="multiple" defaultValue={["products", "costs", "programme", "finance"]} className="w-full space-y-4">
             {/* Developer Profile */}
             <AccordionItem value="developer" className="bg-white border rounded-xl px-6 shadow-sm overflow-hidden">
                <AccordionTrigger className="hover:no-underline py-4 font-bold uppercase tracking-widest text-[11px] text-gray-500 font-sans">Developer Profile</AccordionTrigger>
                <AccordionContent className="pb-6">
                    <div className="grid grid-cols-4 gap-6">
                        <div className="space-y-2"><Label className="text-[10px] uppercase text-gray-400 font-bold">Years Experience</Label><Input type="number" value={inputs.developerExperienceYears} onChange={e => setInputs({ developerExperienceYears: parseInt(e.target.value) || 0 })} /></div>
                        <div className="space-y-2"><Label className="text-[10px] uppercase text-gray-400 font-bold">Projects Completed</Label><Input type="number" value={inputs.developerProjectsCompleted} onChange={e => setInputs({ developerProjectsCompleted: parseInt(e.target.value) || 0 })} /></div>
                        <div className="space-y-2"><Label className="text-[10px] uppercase text-gray-400 font-bold">Net Worth (AUD)</Label><Input type="number" value={inputs.developerTnw} onChange={e => setInputs({ developerTnw: parseFloat(e.target.value) || 0 })} /></div>
                        <div className="space-y-2"><Label className="text-[10px] uppercase text-gray-400 font-bold">Liquidity (AUD)</Label><Input type="number" value={inputs.developerLiquidity} onChange={e => setInputs({ developerLiquidity: parseFloat(e.target.value) || 0 })} /></div>
                        <div className="col-span-4 space-y-2 pt-2"><Label className="text-[10px] uppercase text-gray-400 font-bold">Track Record Notes</Label><Textarea value={inputs.developerNotes} onChange={e => setInputs({ developerNotes: e.target.value })} /></div>
                    </div>
                </AccordionContent>
            </AccordionItem>

            {/* Product Mix */}
            <AccordionItem value="products" className="bg-white border rounded-xl px-6 shadow-sm overflow-hidden">
                <AccordionTrigger className="hover:no-underline py-4 font-bold uppercase tracking-widest text-[11px] text-gray-500">{isSubdivision ? "Lot Mix Table" : "Unit Mix Table"}</AccordionTrigger>
                <AccordionContent className="pb-6">
                    <div className="space-y-4">
                        {inputs.products.map((product, idx) => (
                            <div key={idx} className="grid grid-cols-6 gap-4 items-center bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                                <div className="col-span-2 space-y-1"><Label className="text-[9px] uppercase text-gray-400 font-bold">Desc</Label><Input value={product.description} onChange={(e) => updateProduct(idx, { description: e.target.value })} className="bg-white h-9" /></div>
                                <div><Label className="text-[9px] uppercase text-gray-400 font-bold">Lots</Label><Input type="number" value={product.numLots} onChange={(e) => updateProduct(idx, { numLots: parseInt(e.target.value) || 0 })} className="bg-white h-9" /></div>
                                <div><Label className="text-[9px] uppercase text-gray-400 font-bold">Size</Label><Input type="number" value={product.areaSqm} onChange={(e) => updateProduct(idx, { areaSqm: parseFloat(e.target.value) || 0 })} className="bg-white h-9" /></div>
                                <div><Label className="text-[9px] uppercase text-gray-400 font-bold">Value</Label><Input type="number" value={product.grossAICValuation} onChange={(e) => updateProduct(idx, { grossAICValuation: parseFloat(e.target.value) || 0 })} className="bg-white h-9" /></div>
                                <div className="flex justify-end pt-5"><Button variant="ghost" size="icon" className="text-gray-300 hover:text-red-600" onClick={() => removeProduct(idx)}><Trash2 className="h-4 w-4" /></Button></div>
                            </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={addProduct} className="w-full border-dashed bg-white text-gray-500 hover:text-blue-600"><Plus className="h-4 w-4 mr-2" /> Add Line</Button>
                    </div>
                </AccordionContent>
            </AccordionItem>

            {/* Programme */}
            <AccordionItem value="programme" className="bg-white border rounded-xl px-6 shadow-sm overflow-hidden">
                <AccordionTrigger className="hover:no-underline py-4 font-bold uppercase tracking-widest text-[11px] text-gray-500">Programme</AccordionTrigger>
                <AccordionContent className="pb-6">
                    <div className="grid grid-cols-4 gap-6">
                        <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={new Date(inputs.startDate).toISOString().split('T')[0]} onChange={e => setInputs({ startDate: new Date(e.target.value) })} /></div>
                        <div className="space-y-2"><Label>Build Term</Label><Input type="number" value={inputs.buildTermMonths} onChange={e => setInputs({ buildTermMonths: parseInt(e.target.value) || 0 })} /></div>
                        <div className="space-y-2"><Label>Loan Term</Label><Input type="number" value={inputs.loanTermMonths} onChange={e => setInputs({ loanTermMonths: parseInt(e.target.value) || 0 })} /></div>
                        <div className="space-y-2"><Label>Delay Buffer</Label><Input type="number" value={inputs.delayContingencyMonths} onChange={e => setInputs({ delayContingencyMonths: parseInt(e.target.value) || 0 })} /></div>
                    </div>
                </AccordionContent>
            </AccordionItem>

            {/* Project Costs */}
            <AccordionItem value="costs" className="bg-white border rounded-xl px-6 shadow-sm overflow-hidden">
                <AccordionTrigger className="hover:no-underline py-4 font-bold uppercase tracking-widest text-[11px] text-gray-500">Direct Project Costs</AccordionTrigger>
                <AccordionContent className="pb-6">
                    <div className="grid grid-cols-2 gap-12">
                        <div className="space-y-4">
                            <div className="space-y-2 border-l-2 border-blue-500 pl-4"><Label>Site Value</Label><Input type="number" value={inputs.siteValue} onChange={e => setInputs({ siteValue: parseFloat(e.target.value) || 0 })} /></div>
                            <div className="space-y-2 border-l-2 border-blue-500 pl-4"><Label>{isSubdivision ? "Civil Works" : "Construction"}</Label><Input type="number" value={inputs.construction} onChange={e => setInputs({ construction: parseFloat(e.target.value) || 0 })} /></div>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2"><Label>Professional Fees</Label><Input type="number" value={inputs.professionalFees} onChange={e => setInputs({ professionalFees: parseFloat(e.target.value) || 0 })} /></div>
                            <div className="space-y-2"><Label>Contingency</Label><Input type="number" value={inputs.developmentContingency} onChange={e => setInputs({ developmentContingency: parseFloat(e.target.value) || 0 })} /></div>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>

            {/* Indirect Costs */}
            <AccordionItem value="indirect" className="bg-white border rounded-xl px-6 shadow-sm overflow-hidden">
                <AccordionTrigger className="hover:no-underline py-4 font-bold uppercase tracking-widest text-[11px] text-gray-500">Indirect Costs</AccordionTrigger>
                <AccordionContent className="pb-6">
                    <div className="grid grid-cols-2 gap-12">
                        <div className="space-y-4">
                            <div className="space-y-2"><Label>Marketing/Selling</Label><Input type="number" value={inputs.marketingSellingCost} onChange={e => setInputs({ marketingSellingCost: parseFloat(e.target.value) || 0 })} /></div>
                            <div className="space-y-2"><Label>Rates & Taxes</Label><Input type="number" value={inputs.ratesTaxes} onChange={e => setInputs({ ratesTaxes: parseFloat(e.target.value) || 0 })} /></div>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2"><Label>Finance Indirect</Label><Input type="number" value={inputs.financeCostsIndirect} onChange={e => setInputs({ financeCostsIndirect: parseFloat(e.target.value) || 0 })} /></div>
                            <div className="space-y-2"><Label>Legal Fees (Indirect)</Label><Input type="number" value={inputs.legalFeesIndirect} onChange={e => setInputs({ legalFeesIndirect: parseFloat(e.target.value) || 0 })} /></div>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>

            {/* Finance & Capital Structure */}
            <AccordionItem value="finance" className="bg-white border rounded-xl px-6 shadow-sm overflow-hidden">
                <AccordionTrigger className="hover:no-underline py-4 font-bold uppercase tracking-widest text-[11px] text-gray-500">Finance & Mezzanine</AccordionTrigger>
                <AccordionContent className="pb-6">
                    <div className="space-y-8">
                        <div className="grid grid-cols-3 gap-8">
                            <div className="space-y-2"><Label>Senior Interest (%)</Label><Input type="number" step="0.01" value={inputs.interestRate * 100} onChange={e => setInputs({ interestRate: (parseFloat(e.target.value) || 0) / 100 })} /></div>
                            <div className="space-y-2"><Label>LAF (%)</Label><Input type="number" step="0.01" value={inputs.lafRate * 100} onChange={e => setInputs({ lafRate: (parseFloat(e.target.value) || 0) / 100 })} /></div>
                            <div className="space-y-2"><Label>Equity (Cash)</Label><Input type="number" value={inputs.customerCashEquity} onChange={e => setInputs({ customerCashEquity: parseFloat(e.target.value) || 0 })} /></div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <div className="flex items-center justify-between"><div className="flex items-center space-x-2"><TrendingUp className="h-4 w-4 text-amber-600" /><Label className="font-bold text-amber-900 uppercase tracking-widest text-[10px]">Mezzanine Financing</Label></div><Switch checked={inputs.mezzEnabled} onCheckedChange={v => setInputs({ mezzEnabled: v })} /></div>

                            {inputs.mezzEnabled && (
                                <div className="grid grid-cols-4 gap-4 bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                                    <div className="space-y-1"><Label className="text-[9px] uppercase font-bold text-amber-700">Amount</Label><Input type="number" value={inputs.mezzAmount} onChange={e => setInputs({ mezzAmount: parseFloat(e.target.value) || 0 })} className="bg-white border-amber-200" /></div>
                                    <div className="space-y-1"><Label className="text-[9px] uppercase font-bold text-amber-700">Interest (%)</Label><Input type="number" step="0.1" value={inputs.mezzInterestRate * 100} onChange={e => setInputs({ mezzInterestRate: (parseFloat(e.target.value) || 0) / 100 })} className="bg-white border-amber-200" /></div>
                                    <div className="space-y-1"><Label className="text-[9px] uppercase font-bold text-amber-700">App Fee (%)</Label><Input type="number" step="0.1" value={inputs.mezzAppFeeRate * 100} onChange={e => setInputs({ mezzAppFeeRate: (parseFloat(e.target.value) || 0) / 100 })} className="bg-white border-amber-200" /></div>
                                    <div className="space-y-1"><Label className="text-[9px] uppercase font-bold text-amber-700">Broker (%)</Label><Input type="number" step="0.1" value={inputs.mezzBrokerFeeRate * 100} onChange={e => setInputs({ mezzBrokerFeeRate: (parseFloat(e.target.value) || 0) / 100 })} className="bg-white border-amber-200" /></div>
                                    <div className="col-span-2 space-y-1"><Label className="text-[9px] uppercase font-bold text-amber-700">Mezz Legal Fees</Label><Input type="number" value={inputs.mezzLegalFees} onChange={e => setInputs({ mezzLegalFees: parseFloat(e.target.value) || 0 })} className="bg-white border-amber-200" /></div>
                                </div>
                            )}
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>

            {/* Presales Tracker */}
            <AccordionItem value="presales" className="bg-white border rounded-xl px-6 shadow-sm overflow-hidden">
                <AccordionTrigger className="hover:no-underline py-4 font-bold uppercase tracking-widest text-[11px] text-gray-500">Presales Tracker</AccordionTrigger>
                <AccordionContent className="pb-6">
                    <div className="space-y-4">
                        {inputs.presales.map((p, idx) => (
                            <div key={idx} className="grid grid-cols-5 gap-4 items-center bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                                <div className="col-span-2"><Input value={p.buyer_name} onChange={e => updatePresale(idx, { buyer_name: e.target.value })} placeholder="Buyer/Unit" /></div>
                                <div><Input type="number" value={p.sale_price} onChange={e => updatePresale(idx, { sale_price: parseFloat(e.target.value) || 0 })} /></div>
                                <div className="flex justify-center items-center space-x-2"><Switch checked={p.is_qualifying} onCheckedChange={v => updatePresale(idx, { is_qualifying: v })} /><Label className="text-[10px] uppercase font-bold">Qualifying</Label></div>
                                <div className="flex justify-end"><Button variant="ghost" size="icon" className="text-gray-300 hover:text-red-600" onClick={() => removePresale(idx)}><Trash2 className="h-4 w-4" /></Button></div>
                            </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={addPresale} className="w-full border-dashed bg-white"><Plus className="h-4 w-4 mr-2" /> Add Presale Entry</Button>
                    </div>
                </AccordionContent>
            </AccordionItem>

            {/* Risk Scoring */}
            <AccordionItem value="risk" className="bg-white border rounded-xl px-6 shadow-sm overflow-hidden">
                <AccordionTrigger className="hover:no-underline py-4 font-bold uppercase tracking-widest text-[11px] text-gray-500">Risk Assessment</AccordionTrigger>
                <AccordionContent className="pb-6">
                    <div className="grid grid-cols-2 gap-12">
                        <div className="space-y-4">
                            {[
                                { label: 'Location Quality', key: 'riskScoreLocation' },
                                { label: 'Developer Exp', key: 'riskScoreDeveloperExp' },
                                { label: 'Presales Position', key: 'riskScorePresales' },
                                { label: 'LVR Profile', key: 'riskScoreLvr' },
                                { label: 'Contingency', key: 'riskScoreContingency' },
                            ].map(item => (
                                <div key={item.key} className="flex justify-between items-center">
                                    <Label className="text-[10px] font-bold uppercase text-gray-700">{item.label}</Label>
                                    <Select value={String((inputs as any)[item.key])} onValueChange={v => setInputs({ [item.key]: parseInt(v) })}>
                                        <SelectTrigger className="w-20 h-9 bg-gray-50"><SelectValue /></SelectTrigger>
                                        <SelectContent>{[1,2,3,4,5].map(v => <SelectItem key={v} value={String(v)}>{v}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2"><Label className="text-[10px] font-bold uppercase text-gray-400">Risk Commentary</Label><Textarea className="h-full min-h-[200px]" value={inputs.riskScoreNotes} onChange={e => setInputs({ riskScoreNotes: e.target.value })} /></div>
                    </div>
                </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Right Column */}
        <div className="w-[450px] border-l bg-white flex flex-col shadow-xl z-10 pb-20">
          <div className="p-4 border-b bg-[#0F1923] text-white flex justify-between items-center">
            <div className="flex items-center"><Calculator className="h-4 w-4 mr-2 text-blue-400" /><h2 className="text-xs font-bold uppercase tracking-widest text-gray-100">Live Analysis Engine</h2></div>
            <Badge variant="outline" className="text-blue-400 border-blue-400 text-[10px] font-black uppercase">Active</Badge>
          </div>
          <Tabs defaultValue="summary" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full justify-start rounded-none border-b bg-gray-50/50 px-4 h-12">
                <TabsTrigger value="summary" className="text-[10px] uppercase font-black data-[state=active]:bg-white data-[state=active]:text-blue-600 rounded-none h-full border-x first:border-l-0">Metrics</TabsTrigger>
                <TabsTrigger value="mezz" className="text-[10px] uppercase font-black data-[state=active]:bg-white data-[state=active]:text-blue-600 rounded-none h-full border-r">Mezzanine</TabsTrigger>
                <TabsTrigger value="scenarios" className="text-[10px] uppercase font-black data-[state=active]:bg-white data-[state=active]:text-blue-600 rounded-none h-full border-r">Sensitivity</TabsTrigger>
                <TabsTrigger value="exit" className="text-[10px] uppercase font-black data-[state=active]:bg-white data-[state=active]:text-blue-600 rounded-none h-full border-r">Exit</TabsTrigger>
                <TabsTrigger value="audit" className="text-[10px] uppercase font-black data-[state=active]:bg-white data-[state=active]:text-blue-600 rounded-none h-full border-r">Audit</TabsTrigger>
            </TabsList>
            <TabsContent value="summary" className="flex-1 overflow-auto p-6 space-y-6 m-0 bg-white">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100 shadow-sm"><p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter mb-1">ROC</p><p className={`text-2xl font-mono font-black ${results.roc >= 0.2 ? 'text-green-600' : 'text-red-600'}`}>{formatPercent(results.roc)}</p></div>
                    <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100 shadow-sm"><p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter mb-1">ROE</p><p className="text-2xl font-mono font-black text-blue-700">{formatPercent(results.roe)}</p></div>
                </div>
                <BreachAlerts results={results} /><Separator /><div className="space-y-4"><h3 className="text-[10px] font-black uppercase tracking-widest text-gray-300">Capital Stack</h3><CapitalStackChart inputs={inputs} results={results} /></div><Separator /><div className="space-y-4"><h3 className="text-[10px] font-black uppercase tracking-widest text-gray-300">Monthly Debt</h3><CashflowChart results={results} /></div>
            </TabsContent>
            <TabsContent value="mezz" className="flex-1 overflow-auto p-6 m-0 bg-white"><MezzanineAnalysis inputs={inputs} results={results} /></TabsContent>
            <TabsContent value="scenarios" className="flex-1 overflow-auto p-6 space-y-6 m-0 bg-white"><ScenarioComparison inputs={inputs} /><Separator /><SensitivityMatrix inputs={inputs} /></TabsContent>
            <TabsContent value="exit" className="flex-1 overflow-auto p-6 m-0 bg-white"><ExitPosition results={results} /></TabsContent>
            <TabsContent value="audit" className="flex-1 overflow-auto p-6 m-0 bg-white"><CalculationAudit inputs={inputs} results={results} /></TabsContent>
          </Tabs>

          <div className="p-4 bg-gray-50 border-t flex justify-between items-center mt-auto">
            <div className="flex items-center text-[10px] text-gray-400 font-bold uppercase"><Info className="h-3 w-3 mr-1" /> All figures ex. GST unless stated</div>
            <p className="text-[10px] text-gray-300 font-mono">v1.3.1-STABLE</p>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-[#0F1923] border-t border-white/10 z-50 flex items-center px-8 shadow-2xl justify-between">
        <div className="flex items-center space-x-8">
            <div className="flex flex-col"><span className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Projected ROC</span><div className="flex items-center space-x-2"><span className={`text-2xl font-mono font-black ${results.roc >= 0.2 ? 'text-green-400' : 'text-red-400'}`}>{formatPercent(results.roc)}</span>{results.roc >= 0.2 ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />}</div></div>
            <div className="h-10 w-px bg-white/10" /><div className="flex flex-col"><span className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Net Realisations</span><span className="text-xl font-mono font-black text-white">{formatCurrency(results.netRealisations)}</span></div>
            <div className="h-10 w-px bg-white/10" /><div className="flex flex-col"><span className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Max Senior Debt</span><span className="text-xl font-mono font-black text-blue-400">{formatCurrency(results.seniorFunding)}</span></div>
        </div>

        <div className="flex items-center space-x-3">
            <Button variant="outline" className="bg-transparent text-white border-white/10 hover:bg-white/5 h-10 px-6 font-bold uppercase text-[11px] tracking-tight" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4 mr-2" />}
                Commit Draft
            </Button>

            <div className="flex items-center space-x-1 mx-2">
                {['dfs', 'advisory'].map((p) => {
                    const id = p === 'dfs' ? dealInfo?.hubspot_dfs_deal_id : dealInfo?.hubspot_advisory_deal_id;
                    const loading = p === 'dfs' ? isPushingDFS : isPushingAdv;
                    const color = p === 'dfs' ? 'text-blue-300' : 'text-green-300';

                    if (id) {
                        return (
                            <AlertDialog key={p}>
                                <AlertDialogTrigger asChild>
                                    <Button variant="secondary" className="bg-white/10 text-white border-0 hover:bg-white/20 h-10 px-4 text-[10px] font-black uppercase">
                                        <CheckCircle2 className={`h-3 w-3 mr-1 ${color}`} /> {p} Pushed
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Push to HubSpot again?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will create a <strong>NEW</strong> deal in the {p.toUpperCase()} pipeline with current assessment data.
                                            The previous HubSpot deal ID ({id}) will not be modified. Continue?
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handlePush(p as any)}>Confirm Push</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        );
                    }
                    return (
                        <Button key={p} variant="secondary" className="bg-white/5 text-gray-400 border-0 hover:bg-white/10 h-10 px-4 text-[11px] font-black uppercase" onClick={() => handlePush(p as any)} disabled={loading}>
                            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : `Push ${p}`}
                        </Button>
                    );
                })}
            </div>

            <ReportButton dealId={params.id as string} data={{ ...inputs, results }} />
        </div>
      </div>
    </div>
  );
}
