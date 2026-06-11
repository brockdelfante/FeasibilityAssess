import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const editorName = req.headers.get('x-editor-name') ?? 'Unknown';

    // In a real app, we would fetch existing record and diff it for the audit log
    // For this prototype, we'll just update and log a generic change
    const { data, error } = await supabase.from('deals').update({
      ...body,
      updated_at: new Date().toISOString()
    }).eq('id', id);

    if (error) throw error;

    await supabase.from('deal_audit_log').insert({
      deal_id: id,
      changed_by: editorName,
      changed_by_name: editorName,
      field_name: 'multiple_fields',
      change_note: 'Updated deal assessment data'
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
