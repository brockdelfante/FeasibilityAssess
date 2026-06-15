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
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/deals/${dealId}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, type })
      });
      const result = await res.json();
      if (result.pdfUrl) window.open(result.pdfUrl, "_blank");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 h-10 px-6 font-black uppercase text-[11px] tracking-widest text-white" disabled={isGenerating}>
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
          Generate Reports
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-white shadow-2xl border-0 rounded-xl">
        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-4 py-3">Internal Credit Reports</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => generate('credit_summary')} className="px-4 py-3 cursor-pointer">Credit Committee Summary</DropdownMenuItem>
        <DropdownMenuItem onClick={() => generate('cashflow')} className="px-4 py-3 cursor-pointer">Monthly Cashflow Schedule</DropdownMenuItem>
        <DropdownMenuItem onClick={() => generate('sensitivity')} className="px-4 py-3 cursor-pointer">Sensitivity Analysis</DropdownMenuItem>
        <DropdownMenuItem onClick={() => generate('exit_position')} className="px-4 py-3 cursor-pointer">Exit Position Report</DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-amber-600 px-4 py-3">Investor & 2nd Mortgage</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => generate('mezzanine')} className="px-4 py-3 cursor-pointer font-bold text-amber-700">
            <ShieldAlert className="h-4 w-4 mr-2 text-amber-500" />
            Mezzanine Assessment
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => generate('client')} className="px-4 py-3 cursor-pointer">Client Facing Summary</DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => generate('full')} className="px-4 py-3 cursor-pointer font-black text-blue-600 uppercase text-[10px] tracking-tighter">Full Assessment Dossier (All)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
