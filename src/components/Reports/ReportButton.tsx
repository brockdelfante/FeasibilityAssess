"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileText, Loader2, ChevronDown } from "lucide-react";

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
        <Button className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-6 font-black uppercase text-[11px] tracking-widest" disabled={isGenerating}>
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
          Generate Reports
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Select Report Type</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => generate('credit_summary')}>Credit Committee Summary</DropdownMenuItem>
        <DropdownMenuItem onClick={() => generate('cashflow')}>Monthly Cashflow Schedule</DropdownMenuItem>
        <DropdownMenuItem onClick={() => generate('sensitivity')}>Sensitivity Analysis</DropdownMenuItem>
        <DropdownMenuItem onClick={() => generate('exit_position')}>Exit Position Report</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => generate('full')} className="font-bold text-blue-600">Full Assessment (All)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
