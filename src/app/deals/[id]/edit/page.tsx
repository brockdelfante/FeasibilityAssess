"use client";

import { useDealStore } from "@/lib/store";
import { useEffect, useState, useCallback, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AlertCircle, CheckCircle2, TrendingUp, Save, Share2, Calculator, FileText, History, Wallet, Loader2, ArrowLeft, Plus, Trash2, MapPin, Info, ArrowUpRight, FileSpreadsheet, ShieldCheck, Scale, Trash, ChevronDown, Search, RefreshCcw, Terminal, PieChart, Landmark, Shield, BarChart3, Percent } from "lucide-react";
import { BreachAlerts } from "@/components/OutputPanel/BreachAlerts";
import { CashflowChart } from "@/components/OutputPanel/CashflowChart";
import { SensitivityMatrix } from "@/components/OutputPanel/SensitivityMatrix";
import { ScenarioComparison } from "@/components/OutputPanel/ScenarioComparison";
import { CapitalStackChart } from "@/components/OutputPanel/CapitalStackChart";
import { CalculationAudit } from "@/components/OutputPanel/CalculationAudit";
import { ReportButton } from "@/components/Reports/ReportButton";
import { MezzanineAnalysis } from "@/components/OutputPanel/MezzanineAnalysis";
import { ExitPosition } from "@/components/OutputPanel/ExitPosition";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { PropertyIntelligence } from "@/components/PropertyIntelligence";
import { ValuationComparison } from "@/components/OutputPanel/ValuationComparison";
import { ApiLogSheet } from "@/components/ApiLogSheet";

export default function DealEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const {
    inputs, results, setInputs, updateProduct, addProduct, removeProduct,
    loadDeal, isLoading, setLoading
  } = useDealStore();

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPushingDFS, setIsPushingDFS] = useState(false);
  const [isPushingAdv, setIsPushingAdv] = useState(false);
  const [isIntelligenceLoading, setIsIntelligenceLoading] = useState(false);
  const [dealInfo, setDealInfo] = useState<any>(null);

  // Auto-calculation refs to prevent feedback loops
  const prevConstruction = useRef(inputs.construction);
  const prevSeniorFunding = useRef(results.seniorFunding);

  useEffect(() => {
    // Construction Contingency Auto-Default (5%)
    if (inputs.construction !== prevConstruction.current && inputs.construction > 0) {
        setInputs({ constructionContingency: Math.round(inputs.construction * 0.05) });
        prevConstruction.current = inputs.construction;
    }
  }, [inputs.construction, setInputs]);

  useEffect(() => {
    // Establishment Fee Auto-Default (1.5% of Senior Funding)
    if (results.seniorFunding !== prevSeniorFunding.current && results.seniorFunding > 0) {
        // We only auto-set if it's currently 0 or we just loaded
        if (inputs.establishmentFees === 0 || prevSeniorFunding.current === 0) {
            setInputs({ establishmentFees: Math.round(results.seniorFunding * 0.015) });
        }
        prevSeniorFunding.current = results.seniorFunding;
    }
  }, [results.seniorFunding, inputs.establishmentFees, setInputs]);

  const fetchIntelligence = useCallback(async (address: string) => {
    if (!address) return;
    setIsIntelligenceLoading(true);
    try {
        const res = await fetch(`/api/property-intelligence?query=${encodeURIComponent(address)}&dealId=${id}`);
        const data = await res.json();
        if (data.found) {
            setInputs({
                estimateLower: data.estimate_lower,
                estimateMid: data.estimate_mid,
                estimateUpper: data.estimate_upper,
                estimateConfidence: data.estimate_confidence,
                propertyImageUrl: data.property_image_url,
                propertyType: data.property_type,
                propertyBedrooms: data.property_bedrooms,
                propertyBathrooms: data.property_bathrooms,
                propertyParking: data.property_parking,
                propertyLandArea: data.property_land_area,
                propertyInternalArea: data.property_internal_area,
                propertyYearBuilt: data.property_year_built,
                propertyLatitude: data.property_latitude,
                propertyLongitude: data.property_longitude
            });
        }
    } catch (e) {
        console.error("Intelligence lookup failed", e);
    } finally {
        setIsIntelligenceLoading(false);
    }
  }, [id, setInputs]);

  const fetchDeal = useCallback(async () => {
    try {
        const res = await fetch(`/api/deals/${id}`);
        const data = await res.json();
        setDealInfo(data);
        loadDeal(data);

        if (data.project_address && (data.estimate_mid === null || data.estimate_mid === undefined)) {
            fetchIntelligence(data.project_address);
        }
    } catch (e) {
        console.error(e);
    }
  }, [id, loadDeal, fetchIntelligence]);

  useEffect(() => {
    if (id) {
        setLoading(true);
        fetchDeal();
    }
  }, [id, fetchDeal, setLoading]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val);

  const formatPercent = (val: number) => (val * 100).toFixed(1) + '%';

  const isSubdivision = inputs.dealType === 'subdivision';

  const handleSave = async () => {
    setIsSaving(true);
    try {
        const payload = {
            customer_group: inputs.customerGroup,
            project_address: inputs.projectAddress,
            address_street: inputs.addressStreet,
            address_city: inputs.addressCity,
            address_state: inputs.addressState,
            address_postcode: inputs.addressPostcode,
            address_country: inputs.addressCountry,
            deal_type: inputs.dealType,
            loan_term_months: inputs.loanTermMonths,
            build_term_months: inputs.buildTermMonths,
            start_date: inputs.startDate,
            interest_rate: inputs.interestRate,
            interest_margin: inputs.interestMargin,
            line_fee_rate: inputs.lineFeeRate,
            laf_rate: inputs.lafRate,
            gst_method: inputs.gstMethod,
            site_value: inputs.siteValue,
            preliminaries: inputs.preliminaries,
            construction: inputs.construction,
            construction_contingency: inputs.constructionContingency,
            professional_fees: inputs.professionalFees,
            council_contributions: inputs.councilContributions,
            authority_fees: inputs.authorityFees,
            establishment_fees: inputs.establishmentFees,
            legal_fees: inputs.legalFees,
            development_contingency: inputs.developmentContingency,
            customer_cash_equity: inputs.customerCashEquity,
            mezz_enabled: inputs.mezzEnabled,
            mezz_provider: inputs.mezzProvider,
            mezz_amount: inputs.mezzAmount,
            mezz_interest_rate: inputs.mezzInterestRate,
            mezz_app_fee_rate: inputs.mezzAppFeeRate,
            mezz_broker_fee_rate: inputs.mezzBrokerFeeRate,
            mezz_legal_fees: inputs.mezzLegalFees,
            developer_experience_years: inputs.developerExperienceYears,
            developer_projects_completed: inputs.developerProjectsCompleted,
            developer_tnw: inputs.developerTnw,
            developer_liquidity: inputs.developerLiquidity,
            developer_notes: inputs.developerNotes,
            delay_contingency_months: inputs.delayContingencyMonths,
            marketing_selling_cost: inputs.marketingSellingCost,
            legal_fees_indirect: inputs.legalFeesIndirect,
            rates_taxes: inputs.ratesTaxes,
            finance_costs_indirect: inputs.financeCostsIndirect,
            other_indirect_costs: inputs.otherIndirectCosts,
            risk_score_location: inputs.riskScoreLocation,
            risk_score_developer_exp: inputs.riskScoreDeveloperExp,
            risk_score_presales: inputs.riskScorePresales,
            risk_score_lvr: inputs.riskScoreLvr,
            risk_score_contingency: inputs.riskScoreContingency,
            risk_score_notes: inputs.riskScoreNotes,
            assumptions_grv_basis: inputs.assumptionsGrvBasis,
            assumptions_construction_basis: inputs.assumptionsConstructionBasis,
            assumptions_programme_basis: inputs.assumptionsProgrammeBasis,
            assumptions_other: inputs.assumptionsOther,

            // Comprehensive Fields
            owner_builder: inputs.ownerBuilder,
            sales_commission_rate: inputs.salesCommissionRate,
            presale_commission_rate: inputs.presaleCommissionRate,
            interest_capitalization_enabled: inputs.interestCapitalizationEnabled,
            gst_overdraft_limit: inputs.gstOverdraftLimit,
            target_roc: inputs.targetRoc,
            additional_security_fmv: inputs.additionalSecurityFmv,
            additional_security_extended: inputs.additionalSecurityExtended,
            sponsor_recourse: inputs.sponsorRecourse,
            tangible_net_worth: inputs.tangibleNetWorth,

            calc_grv: results.grv,
            calc_roc: results.roc,
            calc_lvr_gross: results.lvrGross,
            calc_ltc: results.ltc,
            calc_total_dev_costs: results.totalDirectCosts,
            calc_net_realisations: results.netRealisations,
            calc_senior_funding: results.seniorFunding,
            calc_peak_debt: results.peakDebt,
            calc_covenant_breach: results.roc < (inputs.targetRoc || 0.2) || results.lvrGross > 0.7,
            products: inputs.products,
            presales: inputs.presales,

            estimate_lower: inputs.estimateLower,
            estimate_mid: inputs.estimateMid,
            estimate_upper: inputs.estimateUpper,
            estimate_confidence: inputs.estimateConfidence,
            property_image_url: inputs.propertyImageUrl,
            property_type: inputs.propertyType,
            property_bedrooms: inputs.propertyBedrooms,
            property_bathrooms: inputs.propertyBathrooms,
            property_parking: inputs.propertyParking,
            property_land_area: inputs.propertyLandArea,
            property_internal_area: inputs.propertyInternalArea,
            property_year_built: inputs.propertyYearBuilt,
            property_latitude: inputs.propertyLatitude,
            property_longitude: inputs.propertyLongitude
        };

        const res = await fetch(`/api/deals/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'x-editor-name': 'Jules Smith' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Save failed");
        await fetchDeal();
        alert("Draft committed to database.");
    } catch (e: any) {
        alert("Error: " + e.message);
    } finally {
        setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
        const res = await fetch(`/api/deals/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("Delete failed");
        router.push('/');
    } catch (e: any) {
        alert("Error: " + e.message);
        setIsDeleting(false);
    }
  };

  const handlePush = async (pipeline: 'dfs' | 'advisory') => {
    const setStatus = pipeline === 'dfs' ? setIsPushingDFS : setIsPushingAdv;
    setStatus(true);
    try {
        const res = await fetch(`/api/deals/${id}/push-${pipeline}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...inputs, ...results })
        });
        const data = await res.json();
        if (data.success) {
            await fetchDeal();
            alert(`Successfully pushed to HubSpot ${pipeline.toUpperCase()} pipeline.`);
        } else {
            throw new Error(data.error || "Push failed");
        }
    } catch (e: any) {
        alert("Error: " + e.message);
    } finally {
        setStatus(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
        const res = await fetch(`/api/deals/${id}/export`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...inputs, results })
        });
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Siare_Feasibility_${inputs.customerGroup || 'Deal'}_${Date.now()}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (e) {
        console.error(e);
    } finally {
        setIsExporting(false);
    }
  };

  const handleAddressSelect = (suggestion: any) => {
    setInputs({
      projectAddress: suggestion.label,
      addressStreet: suggestion.street || "",
      addressCity: suggestion.city || "",
      addressState: suggestion.state || "",
      addressPostcode: suggestion.postcode || "",
      addressCountry: suggestion.country || "Australia"
    });
    fetchIntelligence(suggestion.label);
  };

  if (isLoading) return (
    <div className="flex h-screen items-center justify-center bg-[#0F1923] flex-col space-y-6">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <p className="text-blue-100 font-black tracking-widest uppercase text-xs">Initialising Analysis Engine</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gray-50 min-h-screen relative font-sans text-[13px]">
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Input Sections */}
        <div className="flex-1 overflow-auto p-8 space-y-8 text-sm pb-40">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-6">
              <Button variant="ghost" size="icon" onClick={() => router.push('/')} className="rounded-full bg-white shadow-sm border h-12 w-12 hover:bg-gray-100">
                <ArrowLeft className="h-6 w-6 text-gray-900" />
              </Button>
              <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none">{inputs.customerGroup || "Assessment Overview"}</h1>
                <div className="flex items-center text-gray-500 font-bold text-[10px] mt-2 uppercase tracking-widest">
                    <MapPin className="h-3 w-3 mr-1 text-blue-500" /> {inputs.projectAddress || "Unnamed Site"}
                    <span className="mx-3 text-gray-300">|</span>
                    <Badge variant="outline" className="text-[9px] font-black border-blue-200 text-blue-600 bg-blue-50">{inputs.dealType}</Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
                <ApiLogSheet dealId={id} />
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" className="bg-white border-gray-200 font-bold text-[11px] uppercase tracking-widest shadow-sm">
                            <History className="h-4 w-4 mr-2 text-blue-600" />
                            History
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="w-[450px] sm:w-[600px] overflow-auto border-l-4 border-l-blue-600 bg-white">
                        <SheetHeader className="border-b pb-6">
                            <SheetTitle className="flex items-center font-black uppercase tracking-tighter text-2xl text-gray-900">
                                <History className="h-6 w-6 mr-3 text-blue-600" />
                                Audit Trail
                            </SheetTitle>
                            <SheetDescription className="font-medium text-gray-500">Chronological record of every technical change.</SheetDescription>
                        </SheetHeader>
                        <div className="mt-8 space-y-6 pb-20">
                            {(dealInfo?.audit_logs || []).length === 0 ? (
                                <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest italic">No change history recorded.</p>
                                </div>
                            ) : (
                                dealInfo.audit_logs.map((log: any, i: number) => (
                                    <div key={i} className="text-[12px] border-l-4 border-blue-50 pl-5 py-3 relative hover:bg-gray-50 rounded-r-2xl transition-all group">
                                        <div className="absolute -left-[7px] top-5 h-3 w-3 rounded-full bg-blue-500 border-2 border-white shadow-md group-hover:scale-125 transition-transform" />
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-black text-gray-900 uppercase tracking-tighter">{new Date(log.changed_at).toLocaleString()}</span>
                                            <Badge variant="secondary" className="text-[9px] font-black uppercase bg-blue-100 text-blue-700">{log.changed_by}</Badge>
                                        </div>
                                        <p className="text-gray-600 font-medium">{log.change_note}</p>
                                        {log.field_name !== 'multi_save' && (
                                            <div className="mt-2 bg-white border border-gray-100 p-2.5 rounded-lg flex flex-col space-y-1 shadow-sm">
                                                <span className="text-[9px] uppercase font-black text-gray-400">Metric: {log.field_name}</span>
                                                <div className="flex items-center space-x-2 text-[11px] font-mono">
                                                    <span className="text-red-400 line-through">{log.old_value || 'NULL'}</span>
                                                    <ArrowUpRight className="h-3 w-3 text-gray-300" />
                                                    <span className="text-green-600 font-bold">{log.new_value}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </SheetContent>
                </Sheet>
                <Button variant="outline" onClick={handleExportExcel} disabled={isExporting} className="bg-white border-gray-200 font-bold text-[11px] uppercase tracking-widest shadow-sm text-gray-900">
                    {isExporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />}
                    Export Data
                </Button>

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="font-bold text-[11px] uppercase tracking-widest shadow-sm bg-red-600 hover:bg-red-700 text-white border-0">
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-white border-0 shadow-2xl rounded-2xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-black uppercase tracking-tight text-gray-900">Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-500 font-medium">
                                This action cannot be undone. This will permanently delete the assessment
                                and all associated data from the database.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="pt-4">
                            <AlertDialogCancel className="rounded-xl font-bold border-2 text-gray-900">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-black uppercase tracking-widest border-0">
                                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash className="h-4 w-4 mr-2" />}
                                Delete Forever
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
          </div>

          {/* Property Intelligence Feature Card */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Project Context</h3>
                {isIntelligenceLoading && (
                    <div className="flex items-center space-x-2 text-blue-600">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Enriching Data...</span>
                    </div>
                )}
            </div>
            <PropertyIntelligence />
          </div>

          <Accordion type="multiple" defaultValue={["customer", "products", "costs", "mezzanine", "risk", "finance"]} className="w-full space-y-6">
             {/* Customer & Project Section */}
             <AccordionItem value="customer" className="bg-white border rounded-2xl px-8 shadow-sm overflow-visible border-gray-100">
                <AccordionTrigger className="hover:no-underline py-6 font-black uppercase tracking-[0.2em] text-[11px] text-gray-900">Customer & Project Details</AccordionTrigger>
                <AccordionContent className="pb-8 overflow-visible text-gray-900">
                    <div className="space-y-6 overflow-visible">
                      <div className="grid grid-cols-2 gap-8 overflow-visible">
                          <div className="space-y-2"><Label className="text-[10px] uppercase text-gray-500 font-black">Customer Group</Label><Input value={inputs.customerGroup} onChange={e => setInputs({ customerGroup: e.target.value })} className="h-10 font-bold border-gray-300" /></div>
                          <div className="space-y-2 overflow-visible"><Label className="text-[10px] uppercase text-gray-500 font-black text-gray-500">Project Address (Full)</Label>
                              <div className="flex space-x-2">
                                <AddressAutocomplete
                                    value={inputs.projectAddress}
                                    onChange={val => setInputs({ projectAddress: val })}
                                    onSelect={handleAddressSelect}
                                    placeholder="Search project address..."
                                    className="h-10 flex-1"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-10 w-10 shrink-0 border-gray-300"
                                    onClick={() => fetchIntelligence(inputs.projectAddress)}
                                    title="Manual Intelligence Lookup"
                                    type="button"
                                >
                                    <RefreshCcw className={`h-4 w-4 text-blue-600 ${isIntelligenceLoading ? 'animate-spin' : ''}`} />
                                </Button>
                              </div>
                          </div>
                      </div>
                      <Separator className="opacity-50" />
                      <div className="grid grid-cols-3 gap-6">
                          <div className="space-y-2"><Label className="text-[10px] uppercase text-gray-400 font-black">Street</Label><Input value={inputs.addressStreet} onChange={e => setInputs({ addressStreet: e.target.value })} className="h-10 border-gray-300" /></div>
                          <div className="space-y-2"><Label className="text-[10px] uppercase text-gray-400 font-black">City</Label><Input value={inputs.addressCity} onChange={e => setInputs({ addressCity: e.target.value })} className="h-10 border-gray-300" /></div>
                          <div className="space-y-2"><Label className="text-[10px] uppercase text-gray-400 font-black">State</Label><Input value={inputs.addressState} onChange={e => setInputs({ addressState: e.target.value })} className="h-10 border-gray-300" /></div>
                          <div className="space-y-2"><Label className="text-[10px] uppercase text-gray-400 font-black">Postcode</Label><Input value={inputs.addressPostcode} onChange={e => setInputs({ addressPostcode: e.target.value })} className="h-10 border-gray-300" /></div>
                          <div className="space-y-2 col-span-2"><Label className="text-[10px] uppercase text-gray-400 font-black">Country</Label><Input value={inputs.addressCountry} onChange={e => setInputs({ addressCountry: e.target.value })} className="h-10 border-gray-300" /></div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="space-y-0.5">
                              <Label className="text-[11px] font-black uppercase text-gray-700">Owner Builder</Label>
                              <p className="text-[10px] text-gray-400">Project is managed as owner-builder</p>
                          </div>
                          <Switch checked={inputs.ownerBuilder} onCheckedChange={v => setInputs({ ownerBuilder: v })} />
                      </div>
                    </div>
                </AccordionContent>
            </AccordionItem>

             {/* Developer Profile Section */}
             <AccordionItem value="developer" className="bg-white border rounded-2xl px-8 shadow-sm overflow-hidden border-gray-100">
                <AccordionTrigger className="hover:no-underline py-6 font-black uppercase tracking-[0.2em] text-[11px] text-gray-900">Developer Profile</AccordionTrigger>
                <AccordionContent className="pb-8 text-gray-900">
                    <div className="grid grid-cols-4 gap-8">
                        <div className="space-y-2"><Label className="text-[10px] uppercase text-gray-500 font-black">Experience (Yrs)</Label><Input type="number" value={inputs.developerExperienceYears} onChange={e => setInputs({ developerExperienceYears: parseInt(e.target.value) || 0 })} className="h-10 font-bold border-gray-300" /></div>
                        <div className="space-y-2"><Label className="text-[10px] uppercase text-gray-500 font-black">Projects Completed</Label><Input type="number" value={inputs.developerProjectsCompleted} onChange={e => setInputs({ developerProjectsCompleted: parseInt(e.target.value) || 0 })} className="h-10 font-bold border-gray-300" /></div>
                        <div className="space-y-2"><Label className="text-[10px] uppercase text-gray-500 font-black">Net Worth (AUD)</Label><Input type="number" value={inputs.developerTnw} onChange={e => setInputs({ developerTnw: parseFloat(e.target.value) || 0 })} className="h-10 font-bold border-gray-300" /></div>
                        <div className="space-y-2"><Label className="text-[10px] uppercase text-gray-500 font-black">Liquidity (AUD)</Label><Input type="number" value={inputs.developerLiquidity} onChange={e => setInputs({ developerLiquidity: parseFloat(e.target.value) || 0 })} className="h-10 font-bold border-gray-300" /></div>
                        <div className="col-span-4 space-y-2 pt-2"><Label className="text-[10px] uppercase text-gray-500 font-black">Professional Commentary</Label><Textarea className="min-h-[100px] leading-relaxed border-gray-300" value={inputs.developerNotes} onChange={e => setInputs({ developerNotes: e.target.value })} placeholder="Discuss developer track record and project relevance..." /></div>
                    </div>
                </AccordionContent>
            </AccordionItem>

            {/* Product Mix Section */}
            <AccordionItem value="products" className="bg-white border rounded-2xl px-8 shadow-sm overflow-hidden border-gray-100">
                <AccordionTrigger className="hover:no-underline py-6 font-black uppercase tracking-[0.2em] text-[11px] text-gray-900">{isSubdivision ? "Lot Inventory" : "Unit Inventory"}</AccordionTrigger>
                <AccordionContent className="pb-8 text-gray-900">
                    <div className="space-y-4">
                        <div className="grid grid-cols-6 gap-6 text-[10px] uppercase font-black text-gray-400 px-2">
                            <div className="col-span-2">Description</div>
                            <div className="text-center">{isSubdivision ? "No. Lots" : "No. Units"}</div>
                            <div className="text-center">Area (sqm)</div>
                            <div className="text-right">Valuation (inc GST)</div>
                            <div />
                        </div>
                        {inputs.products.map((product, idx) => (
                            <div key={idx} className="grid grid-cols-6 gap-6 items-center bg-gray-50/50 p-4 rounded-2xl border border-gray-100 group hover:bg-blue-50/30 transition-colors">
                                <div className="col-span-2"><Input value={product.description} onChange={(e) => updateProduct(idx, { description: e.target.value })} className="bg-white border-gray-200 font-bold h-11 border-gray-300" /></div>
                                <div><Input type="number" value={product.numLots} onChange={(e) => updateProduct(idx, { numLots: parseInt(e.target.value) || 0 })} className="bg-white border-gray-200 text-center font-mono font-bold h-11 border-gray-300" /></div>
                                <div><Input type="number" value={product.areaSqm} onChange={(e) => updateProduct(idx, { areaSqm: parseFloat(e.target.value) || 0 })} className="bg-white border-gray-200 text-center font-mono font-bold h-11 border-gray-300" /></div>
                                <div><Input type="number" value={product.grossAICValuation} onChange={(e) => updateProduct(idx, { grossAICValuation: parseFloat(e.target.value) || 0 })} className="bg-white border-gray-200 text-right font-mono font-bold h-11 border-gray-300" /></div>
                                <div className="flex justify-end"><Button variant="ghost" size="icon" className="text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-full h-11 w-11" onClick={() => removeProduct(idx)}><Trash2 className="h-5 w-5" /></Button></div>
                            </div>
                        ))}
                        <Button variant="outline" size="lg" onClick={addProduct} className="w-full border-2 border-dashed border-gray-200 bg-white text-gray-400 font-black uppercase text-[10px] tracking-widest hover:text-blue-600 hover:border-blue-200 h-14 rounded-2xl"><Plus className="h-5 w-5 mr-3" /> Add Assessment Line</Button>
                    </div>
                </AccordionContent>
            </AccordionItem>

            {/* Direct Project Costs Section */}
            <AccordionItem value="costs" className="bg-white border rounded-2xl px-8 shadow-sm overflow-hidden border-gray-100">
                <AccordionTrigger className="hover:no-underline py-6 font-black uppercase tracking-[0.2em] text-[11px] text-gray-900">Direct Project Costs (ex GST)</AccordionTrigger>
                <AccordionContent className="pb-8 text-gray-900">
                    <div className="grid grid-cols-2 gap-x-16 gap-y-8">
                        <div className="space-y-6">
                            <div className="space-y-2 border-l-4 border-blue-500 pl-6"><Label className="text-[10px] font-black uppercase text-gray-500">Site Value (inc land)</Label><Input id="site-value-input" type="number" value={inputs.siteValue} onChange={e => setInputs({ siteValue: parseFloat(e.target.value) || 0 })} className="h-12 text-lg font-black font-mono border-gray-300 bg-blue-50/10 focus:bg-white" /></div>
                            <div className="space-y-2 border-l-4 border-blue-500 pl-6"><Label className="text-[10px] font-black uppercase text-gray-500">{isSubdivision ? "Civil Works Estimate" : "Vertical Construction Estimate"}</Label><Input id="construction-cost-input" type="number" value={inputs.construction} onChange={e => setInputs({ construction: parseFloat(e.target.value) || 0 })} className="h-12 text-lg font-black font-mono border-gray-300 bg-blue-50/10 focus:bg-white" /></div>
                            <div className="space-y-2 pl-7"><Label className="text-[10px] font-black uppercase text-gray-400">Preliminaries</Label><Input type="number" value={inputs.preliminaries} onChange={e => setInputs({ preliminaries: parseFloat(e.target.value) || 0 })} className="h-11 font-bold border-gray-300" /></div>
                            <div className="space-y-2 pl-7">
                                <Label className="text-[10px] font-black uppercase text-gray-400">Construction Contingency</Label>
                                <Input type="number" value={inputs.constructionContingency} onChange={e => setInputs({ constructionContingency: parseFloat(e.target.value) || 0 })} className="h-11 font-bold border-gray-300" />
                                <div className="flex items-center space-x-1 text-[9px] font-black text-blue-500 uppercase tracking-tighter mt-1">
                                    <Percent className="h-3 w-3" />
                                    <span>Defaults to 5.0% of construction</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-2 pl-7"><Label className="text-[10px] font-black uppercase text-gray-400">Professional Fees</Label><Input type="number" value={inputs.professionalFees} onChange={e => setInputs({ professionalFees: parseFloat(e.target.value) || 0 })} className="h-11 font-bold border-gray-300" /></div>
                            <div className="space-y-2 pl-7"><Label className="text-[10px] font-black uppercase text-gray-400">Council Contributions</Label><Input type="number" value={inputs.councilContributions} onChange={e => setInputs({ councilContributions: parseFloat(e.target.value) || 0 })} className="h-11 font-bold border-gray-300" /></div>
                            <div className="space-y-2 pl-7"><Label className="text-[10px] font-black uppercase text-gray-400">Authority Fees & Charges</Label><Input type="number" value={inputs.authorityFees} onChange={e => setInputs({ authorityFees: parseFloat(e.target.value) || 0 })} className="h-11 font-bold border-gray-300" /></div>
                            <div className="space-y-2 pl-7">
                                <Label className="text-[10px] font-black uppercase text-gray-400">Establishment Fees (LAF $)</Label>
                                <Input type="number" value={inputs.establishmentFees} onChange={e => setInputs({ establishmentFees: parseFloat(e.target.value) || 0 })} className="h-11 font-bold border-gray-300" />
                                <div className="flex items-center space-x-1 text-[9px] font-black text-blue-500 uppercase tracking-tighter mt-1">
                                    <Percent className="h-3 w-3" />
                                    <span>Defaults to 1.5% of senior debt</span>
                                </div>
                            </div>
                            <div className="space-y-2 pl-7"><Label className="text-[10px] font-black uppercase text-gray-400">Legal Fees (Senior)</Label><Input type="number" value={inputs.legalFees} onChange={e => setInputs({ legalFees: parseFloat(e.target.value) || 0 })} className="h-11 font-bold border-gray-300" /></div>
                            <div className="space-y-2 pl-7 border-t pt-4 mt-4 border-gray-100"><Label className="text-[10px] font-black uppercase text-gray-400 text-blue-600">Development Contingency</Label><Input type="number" value={inputs.developmentContingency} onChange={e => setInputs({ developmentContingency: parseFloat(e.target.value) || 0 })} className="h-11 font-black font-mono border-blue-100 bg-blue-50/20" /></div>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>

            {/* Indirect Project Costs Section */}
            <AccordionItem value="indirect" className="bg-white border rounded-2xl px-8 shadow-sm overflow-hidden border-gray-100">
                <AccordionTrigger className="hover:no-underline py-6 font-black uppercase tracking-[0.2em] text-[11px] text-gray-900">Indirect Project Costs</AccordionTrigger>
                <AccordionContent className="pb-8 text-gray-900">
                    <div className="grid grid-cols-2 gap-x-16 gap-y-8">
                        <div className="space-y-4">
                            <div className="space-y-2"><Label className="text-[10px] uppercase font-bold text-gray-400">Land Acquisition Costs</Label><Input type="number" value={inputs.landAcquisitionCost} onChange={e => setInputs({ landAcquisitionCost: parseFloat(e.target.value) || 0 })} className="h-11 border-gray-300" /></div>
                            <div className="space-y-2"><Label className="text-[10px] uppercase font-bold text-gray-400">Marketing & Selling</Label><Input type="number" value={inputs.marketingSellingCost} onChange={e => setInputs({ marketingSellingCost: parseFloat(e.target.value) || 0 })} className="h-11 border-gray-300" /></div>
                            <div className="space-y-2"><Label className="text-[10px] uppercase font-bold text-gray-400">Legal Fees (Indirect)</Label><Input type="number" value={inputs.legalFeesIndirect} onChange={e => setInputs({ legalFeesIndirect: parseFloat(e.target.value) || 0 })} className="h-11 border-gray-300" /></div>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2"><Label className="text-[10px] uppercase font-bold text-gray-400">Rates & Taxes</Label><Input type="number" value={inputs.ratesTaxes} onChange={e => setInputs({ ratesTaxes: parseFloat(e.target.value) || 0 })} className="h-11 border-gray-300" /></div>
                            <div className="space-y-2"><Label className="text-[10px] uppercase font-bold text-gray-400">Finance Costs (Indirect)</Label><Input type="number" value={inputs.financeCostsIndirect} onChange={e => setInputs({ financeCostsIndirect: parseFloat(e.target.value) || 0 })} className="h-11 border-gray-300" /></div>
                            <div className="space-y-2"><Label className="text-[10px] uppercase font-bold text-gray-400">Other Indirect Costs</Label><Input type="number" value={inputs.otherIndirectCosts} onChange={e => setInputs({ otherIndirectCosts: parseFloat(e.target.value) || 0 })} className="h-11 border-gray-300" /></div>
                        </div>
                        <div className="col-span-2 space-y-2 pt-2"><Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Indirect Cost Notes</Label><Textarea className="border-gray-300" value={inputs.indirectCostNotes} onChange={e => setInputs({ indirectCostNotes: e.target.value })} placeholder="Specify details for other indirect costs..." /></div>
                    </div>
                </AccordionContent>
            </AccordionItem>

            {/* Finance & Pricing Section */}
            <AccordionItem value="finance" className="bg-white border rounded-2xl px-8 shadow-sm overflow-hidden border-gray-100">
                <AccordionTrigger className="hover:no-underline py-6 font-black uppercase tracking-[0.2em] text-[11px] text-gray-900">Finance & Pricing</AccordionTrigger>
                <AccordionContent className="pb-8 text-gray-900">
                    <div className="grid grid-cols-3 gap-8">
                        <div className="space-y-2"><Label className="text-[10px] uppercase text-gray-400 font-black">Base Interest Rate (p.a.)</Label><Input type="number" step="0.001" value={inputs.interestRate} onChange={e => setInputs({ interestRate: parseFloat(e.target.value) || 0 })} className="h-10 font-bold border-gray-300" /></div>
                        <div className="space-y-2"><Label className="text-[10px] uppercase text-gray-400 font-black">Margin (p.a.)</Label><Input type="number" step="0.001" value={inputs.interestMargin} onChange={e => setInputs({ interestMargin: parseFloat(e.target.value) || 0 })} className="h-10 font-bold border-gray-300" /></div>
                        <div className="space-y-2"><Label className="text-[10px] uppercase text-gray-400 font-black">Line Fee (%)</Label><Input type="number" step="0.001" value={inputs.lineFeeRate} onChange={e => setInputs({ lineFeeRate: parseFloat(e.target.value) || 0 })} className="h-10 font-bold border-gray-300" /></div>

                        <div className="space-y-2"><Label className="text-[10px] uppercase text-gray-400 font-black">LAF Rate (%)</Label><Input type="number" step="0.001" value={inputs.lafRate} onChange={e => setInputs({ lafRate: parseFloat(e.target.value) || 0 })} className="h-10 font-bold border-gray-300" /></div>
                        <div className="space-y-2"><Label className="text-[10px] uppercase text-gray-400 font-black">Sales Commission (%)</Label><Input type="number" step="0.001" value={inputs.salesCommissionRate} onChange={e => setInputs({ salesCommissionRate: parseFloat(e.target.value) || 0 })} className="h-10 font-bold border-gray-300" /></div>
                        <div className="space-y-2"><Label className="text-[10px] uppercase text-gray-400 font-black">Presale Commission (%)</Label><Input type="number" step="0.001" value={inputs.presaleCommissionRate} onChange={e => setInputs({ presaleCommissionRate: parseFloat(e.target.value) || 0 })} className="h-10 font-bold border-gray-300" /></div>

                        <div className="space-y-2"><Label className="text-[10px] uppercase text-gray-400 font-black">Target ROC (%)</Label><Input type="number" step="0.001" value={inputs.targetRoc} onChange={e => setInputs({ targetRoc: parseFloat(e.target.value) || 0.2 })} className="h-10 font-bold border-gray-300" /></div>

                        <div className="col-span-3 grid grid-cols-2 gap-8 pt-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="space-y-0.5">
                                    <Label className="text-[11px] font-black uppercase text-gray-700">Capitalise Interest</Label>
                                    <p className="text-[10px] text-gray-400">Roll interest into the facility balance</p>
                                </div>
                                <Switch checked={inputs.interestCapitalizationEnabled} onCheckedChange={v => setInputs({ interestCapitalizationEnabled: v })} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase text-gray-400 font-black">GST Overdraft Limit (AUD)</Label>
                                <Input type="number" value={inputs.gstOverdraftLimit} onChange={e => setInputs({ gstOverdraftLimit: parseFloat(e.target.value) || 0 })} className="h-11 font-bold border-gray-300" />
                            </div>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>

            {/* Additional Security & Recourse Section */}
            <AccordionItem value="security" className="bg-white border rounded-2xl px-8 shadow-sm overflow-hidden border-gray-100">
                <AccordionTrigger className="hover:no-underline py-6 font-black uppercase tracking-[0.2em] text-[11px] text-gray-900">Security & Recourse</AccordionTrigger>
                <AccordionContent className="pb-8 text-gray-900">
                    <div className="grid grid-cols-2 gap-x-16 gap-y-8">
                        <div className="space-y-6">
                            <div className="space-y-2"><Label className="text-[10px] uppercase font-bold text-gray-400">Add. Security FMV (Net)</Label><Input type="number" value={inputs.additionalSecurityFmv} onChange={e => setInputs({ additionalSecurityFmv: parseFloat(e.target.value) || 0 })} className="h-11 border-gray-300" /></div>
                            <div className="space-y-2"><Label className="text-[10px] uppercase font-bold text-gray-400">Add. Security Extended (Net)</Label><Input type="number" value={inputs.additionalSecurityExtended} onChange={e => setInputs({ additionalSecurityExtended: parseFloat(e.target.value) || 0 })} className="h-11 border-gray-300" /></div>
                        </div>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="space-y-0.5">
                                    <Label className="text-[11px] font-black uppercase text-gray-700">Sponsor Recourse</Label>
                                    <p className="text-[10px] text-gray-400">Personal/Corporate guarantee enabled</p>
                                </div>
                                <Switch checked={inputs.sponsorRecourse} onCheckedChange={v => setInputs({ sponsorRecourse: v })} />
                            </div>
                            <div className="space-y-2"><Label className="text-[10px] uppercase font-bold text-gray-400">Tangible Net Worth (Recourse)</Label><Input type="number" value={inputs.tangibleNetWorth} onChange={e => setInputs({ tangibleNetWorth: parseFloat(e.target.value) || 0 })} className="h-11 border-gray-300" /></div>
                        </div>
                    </div>
                </AccordionContent>
            </AccordionItem>

            {/* Mezzanine Section */}
            <AccordionItem value="mezzanine" className="bg-white border rounded-2xl px-8 shadow-sm overflow-hidden border-gray-100">
                <AccordionTrigger className="hover:no-underline py-6 font-black uppercase tracking-[0.2em] text-[11px] flex items-center text-gray-900">
                  <span>Mezzanine / 2nd Mortgage Finance</span>
                  {inputs.mezzEnabled && <Badge className="ml-4 bg-amber-500 text-white border-0 text-[9px] font-black">ENABLED</Badge>}
                </AccordionTrigger>
                <AccordionContent className="pb-8 text-gray-900">
                    <div className="space-y-8">
                        <div className="flex items-center justify-between bg-amber-50/50 p-6 rounded-2xl border border-amber-100">
                            <div className="space-y-1">
                                <Label htmlFor="mezz-toggle" className="text-[11px] font-black uppercase text-amber-900 tracking-wider">Activate Mezzanine Layer</Label>
                                <p className="text-xs text-amber-700/70 font-medium">Include a second mortgage in the capital stack calculations.</p>
                            </div>
                            <Switch id="mezz-toggle" checked={inputs.mezzEnabled} onCheckedChange={v => setInputs({ mezzEnabled: v })} className="data-[state=checked]:bg-amber-600" />
                        </div>

                        {inputs.mezzEnabled && (
                          <div className="grid grid-cols-3 gap-8 animate-in fade-in slide-in-from-top-4 duration-300">
                              <div className="space-y-2"><Label className="text-[10px] uppercase text-gray-400 font-black">Provider Name</Label><Input value={inputs.mezzProvider} onChange={e => setInputs({ mezzProvider: e.target.value })} className="h-10 font-bold border-amber-200 focus:border-amber-500 border-gray-300" /></div>
                              <div className="space-y-2"><Label className="text-[10px] uppercase text-gray-400 font-black">Advance Amount (AUD)</Label><Input type="number" value={inputs.mezzAmount} onChange={e => setInputs({ mezzAmount: parseFloat(e.target.value) || 0 })} className="h-10 font-black font-mono border-amber-200 focus:border-amber-500 bg-amber-50/10 border-gray-300" /></div>
                              <div className="space-y-2"><Label className="text-[10px] uppercase text-gray-400 font-black">Interest Rate (p.a.)</Label><Input type="number" step="0.001" value={inputs.mezzInterestRate} onChange={e => setInputs({ mezzInterestRate: parseFloat(e.target.value) || 0 })} className="h-10 font-bold border-amber-200 border-gray-300" /></div>
                              <div className="space-y-2"><Label className="text-[10px] uppercase text-gray-400 font-black">Application Fee (%)</Label><Input type="number" step="0.001" value={inputs.mezzAppFeeRate} onChange={e => setInputs({ mezzAppFeeRate: parseFloat(e.target.value) || 0 })} className="h-10 font-bold border-amber-200 border-gray-300" /></div>
                              <div className="space-y-2"><Label className="text-[10px] uppercase text-gray-400 font-black">Broker Fee (%)</Label><Input type="number" step="0.001" value={inputs.mezzBrokerFeeRate} onChange={e => setInputs({ mezzBrokerFeeRate: parseFloat(e.target.value) || 0 })} className="h-10 font-bold border-amber-200 border-gray-300" /></div>
                              <div className="space-y-2"><Label className="text-[10px] uppercase text-gray-400 font-black">Legal Fees (Fixed $)</Label><Input type="number" value={inputs.mezzLegalFees} onChange={e => setInputs({ mezzLegalFees: parseFloat(e.target.value) || 0 })} className="h-10 font-bold border-amber-200 border-gray-300" /></div>
                          </div>
                        )}
                    </div>
                </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Right Column: Engine Panel */}
        <div className="w-[500px] border-l bg-white flex flex-col shadow-2xl z-10 pb-20 border-l-gray-200 text-gray-900">
          <div className="p-5 border-b bg-[#0F1923] text-white flex justify-between items-center shadow-md relative overflow-hidden text-gray-900">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
            <div className="flex items-center">
                <Calculator className="h-5 w-5 mr-3 text-blue-400 shadow-blue-400" />
                <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-100">Live Analysis Engine</h2>
            </div>
            <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Feed Connected</span>
            </div>
          </div>

          <Tabs defaultValue="summary" className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 bg-gray-50/80 border-b">
                <TabsList className="grid grid-cols-3 gap-2 bg-transparent h-auto p-0">
                    <TabsTrigger value="summary" className="text-[9px] uppercase font-black data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-xl py-3 border border-gray-200 transition-all">Gearing</TabsTrigger>
                    <TabsTrigger value="funding" className="text-[9px] uppercase font-black data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-xl py-3 border border-gray-200 transition-all">Funding</TabsTrigger>
                    <TabsTrigger value="mezz" className="text-[9px] uppercase font-black data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm rounded-xl py-3 border border-gray-200 transition-all">Mezzanine</TabsTrigger>
                </TabsList>
                <TabsList className="grid grid-cols-3 gap-2 bg-transparent h-auto p-0 mt-2">
                    <TabsTrigger value="scenarios" className="text-[9px] uppercase font-black data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-xl py-3 border border-gray-200 transition-all">Sensitivity</TabsTrigger>
                    <TabsTrigger value="exit" className="text-[9px] uppercase font-black data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-xl py-3 border border-gray-200 transition-all">Exit Strategy</TabsTrigger>
                    <TabsTrigger value="audit" className="text-[9px] uppercase font-black data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-xl py-3 border border-gray-200 transition-all">Calc Audit</TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="summary" className="flex-1 overflow-auto p-8 space-y-8 m-0 bg-white border-t border-gray-50">
                <div className="grid grid-cols-2 gap-5">
                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 shadow-inner group hover:border-blue-200 transition-colors">
                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5 flex items-center group-hover:text-blue-600 transition-colors"><Scale className="h-3 w-3 mr-1.5" /> Return on Cost</p>
                        <div className="flex items-baseline space-x-2">
                            <p className={`text-3xl font-mono font-black ${results.roc >= (inputs.targetRoc || 0.2) ? 'text-green-600' : 'text-red-600'}`}>{formatPercent(results.roc)}</p>
                            <span className="text-[9px] font-black text-gray-300 uppercase">Target {(inputs.targetRoc * 100).toFixed(0)}%</span>
                        </div>
                    </div>
                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 shadow-inner group hover:border-blue-200 transition-colors">
                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5 flex items-center group-hover:text-blue-600 transition-colors"><Wallet className="h-3 w-3 mr-1.5" /> Return on Equity</p>
                        <p className="text-3xl font-mono font-black text-blue-700">{formatPercent(results.roe)}</p>
                    </div>
                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 shadow-inner">
                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5">LVR (Gross GRV)</p>
                        <p className="text-3xl font-mono font-black text-gray-900">{formatPercent(results.lvrGross)}</p>
                    </div>
                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 shadow-inner">
                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1.5">Loan to Cost (LTC)</p>
                        <p className="text-3xl font-mono font-black text-gray-900">{formatPercent(results.ltc)}</p>
                    </div>
                </div>

                <ValuationComparison />

                <div className="space-y-5 text-gray-900">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Policy Breach Alerts</h3>
                        {results.roc < (inputs.targetRoc || 0.2) || results.lvrGross > 0.65 ? <Badge className="bg-red-500 text-[9px] font-black border-0 text-white">ACTION REQUIRED</Badge> : <Badge className="bg-green-500 text-[9px] font-black border-0 text-white">COMPLIANT</Badge>}
                    </div>
                    <BreachAlerts />
                </div>

                <Separator className="bg-gray-100" />
                <div className="space-y-5"><h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-1">Capital Stack Breakdown</h3><CapitalStackChart inputs={inputs} results={results} /></div>

                <Separator className="bg-gray-100" />
                <div className="space-y-5"><h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-1">Monthly Peak Debt Projection</h3><CashflowChart results={results} /></div>
            </TabsContent>

            <TabsContent value="funding" className="flex-1 overflow-auto p-8 m-0 bg-white">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black uppercase tracking-tight text-gray-900">Detailed Funding breakdown</h3>
                        <div className="bg-blue-50 p-2 rounded-lg"><PieChart className="h-5 w-5 text-blue-600" /></div>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-gray-100">
                        <table className="w-full text-[11px] text-left">
                            <thead className="bg-gray-50 font-black uppercase text-gray-400">
                                <tr>
                                    <th className="px-4 py-3">Cost Line</th>
                                    <th className="px-4 py-3 text-right">Total</th>
                                    <th className="px-4 py-3 text-right">ANZ Funded</th>
                                    <th className="px-4 py-3 text-right">Equity</th>
                                    <th className="px-4 py-3 text-right">LCR</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {results.fundingTable?.map((row: any, i: number) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-bold text-gray-900">{row.label}</td>
                                        <td className="px-4 py-3 text-right font-mono">{formatCurrency(row.amount)}</td>
                                        <td className="px-4 py-3 text-right font-mono text-blue-600">{formatCurrency(row.anzFunding)}</td>
                                        <td className="px-4 py-3 text-right font-mono text-gray-500">{formatCurrency(row.equity)}</td>
                                        <td className="px-4 py-3 text-right font-mono text-gray-400">{(row.lcr * 100).toFixed(1)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-blue-50/50 font-black text-blue-900 border-t border-blue-100">
                                <tr>
                                    <td className="px-4 py-4 uppercase">Total Dev Cost</td>
                                    <td className="px-4 py-4 text-right font-mono">{formatCurrency(results.totalDevelopmentCosts)}</td>
                                    <td className="px-4 py-4 text-right font-mono">{formatCurrency(results.seniorFunding)}</td>
                                    <td className="px-4 py-4 text-right font-mono">{formatCurrency(results.totalDevelopmentCosts - results.seniorFunding)}</td>
                                    <td className="px-4 py-4 text-right font-mono">{formatPercent(results.ltc)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Peak PDF Balance</p>
                            <p className="text-xl font-mono font-black text-gray-900">{formatCurrency(results.peakDebt)}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Average PDF Balance</p>
                            <p className="text-xl font-mono font-black text-gray-900">{formatCurrency(results.averagePDFBalance)}</p>
                        </div>
                    </div>
                </div>
            </TabsContent>

            <TabsContent value="mezz" className="flex-1 overflow-auto p-8 m-0 bg-white"><MezzanineAnalysis inputs={inputs} results={results} /></TabsContent>
            <TabsContent value="scenarios" className="flex-1 overflow-auto p-8 space-y-8 m-0 bg-white"><ScenarioComparison inputs={inputs} /><Separator /><SensitivityMatrix inputs={inputs} /></TabsContent>
            <TabsContent value="exit" className="flex-1 overflow-auto p-8 m-0 bg-white"><ExitPosition results={results} /></TabsContent>
            <TabsContent value="audit" className="flex-1 overflow-auto p-8 m-0 bg-white"><CalculationAudit inputs={inputs} results={results} /></TabsContent>
          </Tabs>

          <div className="p-6 bg-gray-50/50 border-t flex justify-between items-center mt-auto shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
            <div className="flex items-center text-[9px] text-gray-400 font-black uppercase tracking-widest"><Info className="h-3 w-3 mr-2 text-blue-500" /> All metrics are ex-GST unless labeled otherwise</div>
            <p className="text-[10px] text-gray-300 font-mono font-bold tracking-tighter">SIARE-CORE-v1.5.2-PROD</p>
          </div>
        </div>
      </div>

      {/* Primary Global Actions (Sticky) */}
      <div className="fixed bottom-0 left-0 right-0 h-24 bg-[#0F1923] border-t border-white/10 z-50 flex items-center px-12 shadow-[0_-10px_40px_rgba(0,0,0,0.4)] justify-between transition-all overflow-x-auto text-gray-900">
        <div className="flex items-center space-x-12 shrink-0 text-white">
            <div className="flex flex-col"><span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Projected ROC</span><div className="flex items-center space-x-3"><span className={`text-3xl font-mono font-black ${results.roc >= (inputs.targetRoc || 0.2) ? 'text-green-400' : 'text-red-400'}`}>{formatPercent(results.roc)}</span>{results.roc >= (inputs.targetRoc || 0.2) ? <ShieldCheck className="h-6 w-6 text-green-500 fill-green-500/20" /> : <AlertCircle className="h-6 w-6 text-red-500 animate-pulse" />}</div></div>
            <div className="h-12 w-px bg-white/10" />
            <div className="flex flex-col"><span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Net Realisation</span><span className="text-2xl font-mono font-black text-white">{formatCurrency(results.netRealisations)}</span></div>
            <div className="h-12 w-px bg-white/10" />
            <div className="flex flex-col"><span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Max Senior Debt</span><span className="text-2xl font-mono font-black text-blue-400 shadow-blue-900">{formatCurrency(results.seniorFunding)}</span></div>
        </div>

        <div className="flex items-center space-x-4 shrink-0">
            <Button variant="ghost" className="text-white/60 hover:text-white hover:bg-white/5 font-black uppercase text-[11px] tracking-widest px-8" onClick={() => router.push('/')}>Discard</Button>
            <Button variant="outline" className="bg-white/5 text-white border-white/20 hover:bg-blue-600 hover:border-blue-500 h-12 px-10 font-black uppercase text-[12px] tracking-[0.1em] transition-all active:scale-95" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5 mr-3" />}
                Commit Draft
            </Button>

            <div className="flex items-center space-x-2 px-4 border-x border-white/10 h-12">
                {['dfs', 'advisory'].map((p) => {
                    const isPushed = p === 'dfs' ? !!dealInfo?.hubspot_dfs_deal_id : !!dealInfo?.hubspot_advisory_deal_id;
                    const loading = p === 'dfs' ? isPushingDFS : isPushingAdv;
                    const colorClass = p === 'dfs' ? 'text-blue-400' : 'text-green-400';
                    const icon = <Share2 className={`h-4 w-4 mr-2 ${colorClass}`} />;

                    if (isPushed) {
                        return (
                            <AlertDialog key={p}>
                                <AlertDialogTrigger asChild>
                                    <Button variant="secondary" className="bg-white/10 text-white border-0 hover:bg-white/20 h-12 px-5 text-[10px] font-black uppercase tracking-widest">
                                        <CheckCircle2 className={`h-4 w-4 mr-2 ${colorClass}`} /> {p} Pushed
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-white border-0 shadow-2xl rounded-2xl">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-3xl font-black uppercase tracking-tighter text-gray-900">Synchronisation Warning</AlertDialogTitle>
                                        <AlertDialogDescription className="text-gray-600 font-medium leading-relaxed">
                                            This assessment was already pushed to the <strong className="text-gray-900 underline">{p.toUpperCase()}</strong> pipeline.
                                            Continuing will create a <strong className="text-blue-600">DUPLICATE</strong> deal with current real-time metrics.
                                            The previous record will remain intact. Proceed?
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="pt-6">
                                        <AlertDialogCancel className="rounded-xl font-bold border-2 text-gray-900">Abort</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handlePush(p as any)} className="bg-blue-600 hover:bg-blue-700 rounded-xl font-black uppercase tracking-widest text-white border-0">Confirm Re-Sync</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        );
                    }
                    return (
                        <Button key={p} variant="secondary" className="bg-white/5 text-white bg-blue-600/20 border-blue-500/30 hover:bg-blue-600 h-12 px-6 text-[10px] font-black uppercase tracking-widest" onClick={() => handlePush(p as any)} disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
                            Push {p}
                        </Button>
                    );
                })}
            </div>

            <ReportButton dealId={dealInfo?.id || ""} data={{ ...inputs, results }} />
        </div>
      </div>
    </div>
  );
}
