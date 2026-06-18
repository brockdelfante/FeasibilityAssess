"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileText, Loader2, ChevronDown, ShieldAlert } from "lucide-react";

interface ReportButtonProps {
  dealId: string;
  data: any;
}

export function ReportButton({ dealId, data }: ReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = async (type: string) => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/deals/${dealId}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, type })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }

      const result = await res.json();
      if (result.pdfUrl) {
          const link = document.createElement('a');
          link.href = result.pdfUrl;
          link.target = '_blank';
          link.download = `${type}_${Date.now()}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }
    } catch (e: any) {
        console.error("Report generation error:", e);
        alert("Report Error: " + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 h-12 px-8 font-black uppercase text-[12px] tracking-widest text-white shadow-lg active:scale-95 transition-all" disabled={isGenerating}>
          {isGenerating ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <FileText className="h-5 w-5 mr-3" />}
          Generate Reports
          <ChevronDown className="ml-3 h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 bg-white shadow-2xl border border-gray-100 rounded-2xl p-2">
        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4 py-3">Internal Credit Reports</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => generate('credit_summary')} className="px-4 py-3 cursor-pointer rounded-xl hover:bg-blue-50 transition-colors font-bold text-gray-700">Credit Committee Summary</DropdownMenuItem>
        <DropdownMenuItem onClick={() => generate('cashflow')} className="px-4 py-3 cursor-pointer rounded-xl hover:bg-blue-50 transition-colors font-bold text-gray-700">Monthly Cashflow Schedule</DropdownMenuItem>
        <DropdownMenuItem onClick={() => generate('sensitivity')} className="px-4 py-3 cursor-pointer rounded-xl hover:bg-blue-50 transition-colors font-bold text-gray-700">Sensitivity Analysis</DropdownMenuItem>
        <DropdownMenuItem onClick={() => generate('exit_position')} className="px-4 py-3 cursor-pointer rounded-xl hover:bg-blue-50 transition-colors font-bold text-gray-700">Exit Position Report</DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-amber-600 px-4 py-3">Investor & 2nd Mortgage</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => generate('mezzanine')} className="px-4 py-3 cursor-pointer rounded-xl hover:bg-amber-50 transition-colors font-black text-amber-700">
            <ShieldAlert className="h-4 w-4 mr-2 text-amber-500" />
            Mezzanine Assessment
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => generate('client')} className="px-4 py-3 cursor-pointer rounded-xl hover:bg-blue-50 transition-colors font-bold text-gray-700">Client Facing Summary</DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => generate('full')} className="px-4 py-3 cursor-pointer rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors font-black text-[10px] tracking-tight text-center justify-center">Full Assessment Dossier (All)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
