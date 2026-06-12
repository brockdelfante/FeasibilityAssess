import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await supabase.from('deals').select('*, deal_products(*), deal_direct_costs(*)').eq('id', id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const editorName = req.headers.get('x-editor-name') ?? 'Unknown';

    // Update the deal
    const { data: updatedDeal, error: updateError } = await supabase
      .from('deals')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Simplified audit logging for important fields
    const importantFields = ['calc_grv', 'calc_roc', 'calc_lvr_gross', 'status'];
    for (const field of importantFields) {
      if (body[field] !== undefined) {
        await supabase.from('deal_audit_log').insert({
          deal_id: id,
          changed_by: editorName,
          changed_by_name: editorName,
          field_name: field,
          new_value: String(body[field]),
          change_note: 'Updated deal metric'
        });
      }
    }

    return NextResponse.json({ success: true, data: updatedDeal });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabase.from('deals').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
