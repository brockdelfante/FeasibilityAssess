export type PipelineType = 'dfs' | 'advisory'

export async function pushToHubSpot(deal: any, pipeline: PipelineType): Promise<string> {
  const properties = {
    dealname: `${deal.customer_group} — ${deal.project_address}`,
    pipeline: pipeline === 'dfs'
      ? process.env.HUBSPOT_DFS_PIPELINE_ID
      : process.env.HUBSPOT_ADVISORY_PIPELINE_ID,
    dealstage: pipeline === 'dfs'
      ? process.env.HUBSPOT_DFS_STAGE_ID
      : process.env.HUBSPOT_ADVISORY_STAGE_ID,
    amount: deal.calc_grv,

    siare_grv: deal.calc_grv,
    siare_nrv: deal.calc_nrv,
    siare_net_realisations: deal.calc_net_realisations,
    siare_total_dev_costs: deal.calc_total_dev_costs,
    siare_senior_funding: deal.calc_senior_funding,
    siare_customer_equity: deal.calc_customer_equity,
    siare_peak_debt: deal.calc_peak_debt,
    siare_roc: deal.calc_roc,
    siare_lvr_gross: deal.calc_lvr_gross,
    siare_ltc: deal.calc_ltc,
    siare_residual_lvr: deal.calc_residual_lvr,
    siare_loan_term_months: deal.loan_term_months,
    siare_build_term_months: deal.build_term_months,
    siare_construction_cost_sqm: deal.calc_construction_cost_sqm,
    siare_risk_score: deal.calc_risk_score,
    siare_risk_grade: deal.calc_risk_grade,
    siare_deal_status: deal.status,
    siare_project_address: deal.project_address,
    siare_customer_group: deal.customer_group,
    siare_owner_builder: deal.owner_builder,
    siare_gst_method: deal.gst_method,
    siare_assessment_id: deal.id,
    siare_assessment_url: `${process.env.NEXT_PUBLIC_APP_URL}/deals/${deal.id}`,
    siare_covenant_breach: deal.calc_covenant_breach,
    siare_mezz_enabled: deal.mezz_enabled,
    siare_start_date: deal.start_date,
  }

  const response = await fetch('https://api.hubapi.com/crm/v3/objects/deals', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ properties })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`HubSpot push failed: ${JSON.stringify(error)}`)
  }

  const created = await response.json()
  return created.id
}
