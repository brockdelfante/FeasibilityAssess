import { pushToHubSpot } from "@/lib/hubspot";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const dealData = await req.json();
    const hubspotId = await pushToHubSpot(dealData, 'advisory');
    return NextResponse.json({ success: true, hubspotDealId: hubspotId });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
