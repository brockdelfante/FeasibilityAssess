import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: deal, error: dealError } = await supabase
    .from('deals')
    .select('*, deal_products(*), deal_direct_costs(*), deal_presales(*)')
    .eq('id', id)
    .single();

  if (dealError) return NextResponse.json({ error: dealError.message }, { status: 500 });

  const { data: auditLogs } = await supabase
    .from('deal_audit_log')
    .select('*')
    .eq('deal_id', id)
    .order('changed_at', { ascending: false })
    .limit(10);

  return NextResponse.json({ ...deal, audit_logs: auditLogs || [] });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const editorName = req.headers.get('x-editor-name') ?? 'Unknown';

    // Separate nested relations from main deal updates
    const { products, presales, ...dealUpdates } = body;

    const { data: updatedDeal, error: updateError } = await supabase
      .from('deals')
      .update({
        customer_group: dealUpdates.customerGroup,
        project_address: dealUpdates.projectAddress,
        deal_type: dealUpdates.dealType,
        loan_term_months: dealUpdates.loanTermMonths,
        build_term_months: dealUpdates.buildTermMonths,
        start_date: dealUpdates.startDate,
        interest_rate: dealUpdates.interestRate,
        laf_rate: dealUpdates.lafRate,
        gst_method: dealUpdates.gstMethod,
        sales_commission_rate: dealUpdates.salesCommissionRate,
        site_value: dealUpdates.siteValue,
        construction: dealUpdates.construction,
        professional_fees: dealUpdates.professionalFees,
        development_contingency: dealUpdates.developmentContingency,
        customer_cash_equity: dealUpdates.customerCashEquity,
        mezz_enabled: dealUpdates.mezzEnabled,
        mezz_amount: dealUpdates.mezzAmount,
        mezz_interest_rate: dealUpdates.mezzInterestRate,
        developer_experience_years: dealUpdates.developerExperienceYears,
        developer_projects_completed: dealUpdates.developerProjectsCompleted,
        developer_tnw: dealUpdates.developerTnw,
        developer_liquidity: dealUpdates.developerLiquidity,
        developer_notes: dealUpdates.developerNotes,
        delay_contingency_months: dealUpdates.delayContingencyMonths,
        marketing_selling_cost: dealUpdates.marketingSellingCost,
        rates_taxes: dealUpdates.ratesTaxes,
        finance_costs_indirect: dealUpdates.financeCostsIndirect,
        other_indirect_costs: dealUpdates.otherIndirectCosts,
        risk_score_location: dealUpdates.riskScoreLocation,
        risk_score_developer_exp: dealUpdates.riskScoreDeveloperExp,
        risk_score_presales: dealUpdates.riskScorePresales,
        risk_score_lvr: dealUpdates.riskScoreLvr,
        risk_score_contingency: dealUpdates.riskScoreContingency,
        risk_score_notes: dealUpdates.riskScoreNotes,
        assumptions_grv_basis: dealUpdates.assumptionsGrvBasis,
        assumptions_construction_basis: dealUpdates.assumptionsConstructionBasis,
        assumptions_programme_basis: dealUpdates.assumptionsProgrammeBasis,
        assumptions_other: dealUpdates.assumptionsOther,
        calc_grv: dealUpdates.calc_grv,
        calc_roc: dealUpdates.calc_roc,
        calc_lvr_gross: dealUpdates.calc_lvr_gross,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log the change
    await supabase.from('deal_audit_log').insert({
      deal_id: id,
      changed_by: editorName,
      changed_by_name: editorName,
      field_name: 'multi_save',
      change_note: 'Assessment updated from editor'
    });

    return NextResponse.json({ success: true, data: updatedDeal });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
