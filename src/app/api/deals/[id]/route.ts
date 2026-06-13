import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { data: deal, error: dealError } = await supabase
        .from('deals')
        .select('*, deal_products(*), deal_direct_costs(*), deal_presales(*)')
        .eq('id', id)
        .single();

    if (dealError) throw dealError;

    const { data: auditLogs } = await supabase
        .from('deal_audit_log')
        .select('*')
        .eq('deal_id', id)
        .order('changed_at', { ascending: false })
        .limit(20);

    return NextResponse.json({ ...deal, audit_logs: auditLogs || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const editorName = req.headers.get('x-editor-name') ?? 'Unknown';

    const { products, presales, ...dealUpdates } = body;

    // Direct update with any provided keys
    const { data: updatedDeal, error: updateError } = await supabase
      .from('deals')
      .update({ ...dealUpdates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Products sync
    if (products) {
        await supabase.from('deal_products').delete().eq('deal_id', id);
        if (products.length > 0) {
            await supabase.from('deal_products').insert(
                products.map((p: any, i: number) => ({
                    deal_id: id,
                    sort_order: i,
                    num_lots: p.numLots,
                    description: p.description,
                    area_sqm: p.areaSqm,
                    gross_aic_valuation: p.grossAICValuation,
                    qualifying_presale_value: p.qualifyingPresaleValue,
                    non_qualifying_presale_value: p.nonQualifyingPresaleValue
                }))
            );
        }
    }

    // Presales sync
    if (presales) {
        await supabase.from('deal_presales').delete().eq('deal_id', id);
        if (presales.length > 0) {
            await supabase.from('deal_presales').insert(
                presales.map((p: any) => ({
                    deal_id: id,
                    buyer_name: p.buyer_name,
                    sale_price: p.sale_price,
                    is_qualifying: p.is_qualifying
                }))
            );
        }
    }

    return NextResponse.json({ success: true, data: updatedDeal });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error } = await supabase.from('deals').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
