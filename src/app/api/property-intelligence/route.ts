import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");
  const dealId = searchParams.get("dealId");

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  try {
    // 1. First call to get urlSlug
    const searchRes = await fetch(`https://domain-au.p.rapidapi.com/estimates/auto-complete?query=${encodeURIComponent(query)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": "domain-au.p.rapidapi.com",
        "x-rapidapi-key": 'bf8d2a31b2msh6f8499be824c0b8p16ccdajsn96923e55cd4c'
      }
    });

    const searchJson = await searchRes.json();

    if (dealId) {
        await supabase.from('api_logs').insert({
            deal_id: dealId,
            endpoint: 'Domain Auto-Complete (Search)',
            request_payload: { query },
            response_payload: searchJson,
            status_code: searchRes.status
        });
    }

    const urlSlug = searchJson.data?.propertyDetails?.hpgSlug || searchJson.data?.propertyDetails?.urlSlug;

    if (!urlSlug) {
        return NextResponse.json({ found: false, message: "No slug found in auto-complete" });
    }

    // 2. Second call to get full details using the slug
    const detailsRes = await fetch(`https://domain-au.p.rapidapi.com/estimates/details?query=${urlSlug}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "x-rapidapi-host": "domain-au.p.rapidapi.com",
            "x-rapidapi-key": 'bf8d2a31b2msh6f8499be824c0b8p16ccdajsn96923e55cd4c'
        }
    });

    const detailsJson = await detailsRes.json();

    if (dealId) {
        await supabase.from('api_logs').insert({
            deal_id: dealId,
            endpoint: 'Domain Property Details (Final)',
            request_payload: { urlSlug },
            response_payload: detailsJson,
            status_code: detailsRes.status
        });
    }

    const data = detailsJson.data?.propertyDetails;
    if (!data) {
        return NextResponse.json({ found: false, message: "No data in details response" });
    }

    const imageUrl = data.media?.[0]?.url || null;

    return NextResponse.json({
        found: true,
        estimate_lower: data.valuation?.lowerPrice || null,
        estimate_mid: data.valuation?.midPrice || null,
        estimate_upper: data.valuation?.upperPrice || null,
        estimate_confidence: data.valuation?.priceConfidence || null,
        property_image_url: imageUrl,
        property_type: data.type || null,
        property_bedrooms: data.bedrooms || null,
        property_bathrooms: data.bathrooms || null,
        property_parking: data.parkingSpaces || null,
        property_land_area: data["landArea({\"unit\":\"SQUARE_METERS\"})"] || null,
        property_internal_area: data["internalArea({\"unit\":\"SQUARE_METERS\"})"] || null,
        property_year_built: data.yearBuilt || null,
        property_latitude: data.address?.geolocation?.latitude || null,
        property_longitude: data.address?.geolocation?.longitude || null,
        display_address: data.address?.displayAddress || query
    });

  } catch (error: any) {
    console.error("Domain API Chain Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
