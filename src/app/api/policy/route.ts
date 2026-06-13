import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const { data, error } = await supabase.from('policy_config').select('*').eq('is_active', true).maybeSingle();
    if (error) throw error;
    if (!data) {
        // Create a default if none exists
        const { data: created, error: createError } = await supabase.from('policy_config').insert({
            name: 'Initial Policy',
            is_active: true,
            max_lvr_gross: 0.65,
            max_ltc: 0.80,
            min_roc: 0.20,
            weight_location: 0.2,
            weight_developer_exp: 0.25,
            weight_presales: 0.2,
            weight_lvr: 0.2,
            weight_contingency: 0.15
        }).select().single();
        if (createError) throw createError;
        return NextResponse.json(created);
    }
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    const { data, error } = await supabase.from('policy_config').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
