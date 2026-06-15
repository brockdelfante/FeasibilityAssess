import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const { data, error } = await supabase.from('deals').select('*').order('updated_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (err: any) {
    console.error("GET /api/deals error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("POST /api/deals body:", body);

    // Fetch active policy for defaults
    const { data: policy, error: policyError } = await supabase.from('policy_config').select('*').eq('is_active', true).maybeSingle();
    if (policyError) console.error("Policy fetch error:", policyError);

    const dealData = {
        ...body,
        status: 'draft',
        created_by: 'Jules Smith',
        interest_rate: policy?.default_interest_rate || 0.0999,
        laf_rate: policy?.default_laf || 0.015,
        gst_method: 'standard',
        mezz_interest_rate: policy?.mezz_interest_rate || 0.20,
        mezz_app_fee_rate: policy?.mezz_app_fee_rate || 0.022,
        mezz_broker_fee_rate: policy?.mezz_broker_fee_rate || 0.010,
        mezz_legal_fees: policy?.mezz_legal_fees || 6600,
        mezz_provider: '',
        site_value: 0,
        construction: 0,
        professional_fees: 0,
        development_contingency: 0,
        customer_cash_equity: 0,
    };

    const { data, error } = await supabase.from('deals').insert([dealData]).select().single();
    if (error) {
        console.error("Supabase insert error:", error);
        throw error;
    }
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("POST /api/deals error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
