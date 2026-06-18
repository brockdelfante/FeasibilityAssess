import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import ReactPDF from '@react-pdf/renderer';
import { CreditSummaryReport } from "@/lib/pdf/CreditSummary";
import { MezzanineAssessment } from "@/lib/pdf/MezzanineAssessment";
import { ClientSummary } from "@/lib/pdf/ClientSummary";
import { CashflowReport } from "@/lib/pdf/CashflowReport";
import { SensitivityReport } from "@/lib/pdf/SensitivityReport";
import React from 'react';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { type, ...data } = body;

    console.log(`Generating report: ${type} for deal ${id}`);

    let element: any;

    switch(type) {
        case 'mezzanine':
            element = React.createElement(MezzanineAssessment, { data });
            break;
        case 'client':
            element = React.createElement(ClientSummary, { data });
            break;
        case 'cashflow':
            element = React.createElement(CashflowReport, { cashflow: data.results?.cashflow || [] });
            break;
        case 'sensitivity':
            const matrix = [[{text: 'GRV\\Cost'}, {text: '-10%'}, {text: '0%'}, {text: '+10%'}, {text: '+20%'}],
                           [{text: '-20%'}, {roc: 0.1}, {roc: 0.08}, {roc: 0.05}, {roc: 0.02}]]
            element = React.createElement(SensitivityReport, { matrix });
            break;
        default:
            element = React.createElement(CreditSummaryReport, { data });
            break;
    }

    console.log("Rendering PDF to buffer...");
    // Use renderToBuffer for cleaner server-side handling in App Router
    const buffer = await ReactPDF.renderToBuffer(element);
    console.log(`PDF rendered. Size: ${buffer.length} bytes`);

    const fileName = `${type}_${Date.now()}.pdf`;
    const path = `${id}/${fileName}`;

    console.log(`Uploading to storage bucket 'deal-reports' at path: ${path}`);
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('deal-reports')
        .upload(path, buffer, {
            contentType: 'application/pdf',
            upsert: true,
            cacheControl: '3600'
        });

    if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
        .from('deal-reports')
        .getPublicUrl(path);

    console.log(`Public URL generated: ${publicUrl}`);

    const { error: dbError } = await supabase.from('deal_reports').insert({
        deal_id: id,
        generated_by: 'Jules Smith',
        report_type: type,
        pdf_url: publicUrl,
        calculation_snapshot: data.results
    });

    if (dbError) {
        console.error("Database insert error:", dbError);
    }

    return NextResponse.json({ success: true, pdfUrl: publicUrl });
  } catch (err: any) {
    console.error("Report generation handler error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
