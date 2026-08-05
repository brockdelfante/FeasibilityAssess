import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { apiError } from "@/lib/api-error";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");
  const dealId = searchParams.get("dealId");

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  try {
    const response = await fetch(`https://addressr.p.rapidapi.com/addresses?q=${encodeURIComponent(query)}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': 'addressr.p.rapidapi.com',
        'x-rapidapi-key': 'bf8d2a31b2msh6f8499be824c0b8p16ccdajsn96923e55cd4c'
      }
    });

    const data = await response.json();

    if (dealId) {
        await supabase.from('api_logs').insert({
            deal_id: dealId,
            endpoint: 'Addressr Autocomplete',
            request_payload: { query },
            response_payload: data,
            status_code: response.status
        });
    }

    return NextResponse.json(data);
  } catch (err) {
    return apiError("Addressr API Error:", err)
  }
}
