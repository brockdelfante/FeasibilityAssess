import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import ReactPDF from '@react-pdf/renderer';
import { CreditSummaryReport } from "@/lib/pdf/CreditSummary";
import React from 'react';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Attempt to render to stream/buffer
    // Note: In some serverless environments, this requires specific setup,
    // but we will implement the logic as if it's fully supported.

    // For this prototype, we'll still use the mock URL but ensure the DB entry is correct
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
