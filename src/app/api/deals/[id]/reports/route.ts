import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Create a record in deal_reports table
    const { data: report, error } = await supabase.from('deal_reports').insert({
        deal_id: id,
        generated_by: 'Jules Smith',
        report_type: 'full_assessment',
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
