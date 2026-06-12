import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import ReactPDF from '@react-pdf/renderer';
import { CreditSummaryReport } from "@/lib/pdf/CreditSummary";
import { MezzanineAssessment } from "@/lib/pdf/MezzanineAssessment";
import { ClientSummary } from "@/lib/pdf/ClientSummary";
import React from 'react';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    // In a real environment, we would generate the actual PDF buffer here.
    // For this prototype, we record the generation and return a mock URL.
    const { data: report, error } = await supabase.from('deal_reports').insert({
        deal_id: id,
        generated_by: 'Jules Smith',
        report_type: body.type || 'full_assessment',
        calculation_snapshot: body.results,
        pdf_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    }).select().single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      pdfUrl: report.pdf_url
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
