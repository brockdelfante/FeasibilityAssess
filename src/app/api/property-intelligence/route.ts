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
    // PHASE 1: Auto-complete / Search to find the slug
    // User says: "the Domain API call is first supposed to return a response which the firwst result will have in it a parameter called urlslug"
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
            endpoint: 'Domain Search (Phase 1)',
            request_payload: { query },
            response_payload: searchJson,
            status_code: searchRes.status
        });
    }

    // Extract slug with maximum fallbacks
    let urlSlug = null;

    // Check various common structures for the slug
    if (searchJson.urlSlug) urlSlug = searchJson.urlSlug;
    else if (searchJson.hpgSlug) urlSlug = searchJson.hpgSlug;
    else if (searchJson.data?.propertyDetails?.urlSlug) urlSlug = searchJson.data.propertyDetails.urlSlug;
    else if (searchJson.data?.propertyDetails?.hpgSlug) urlSlug = searchJson.data.propertyDetails.hpgSlug;
    else if (Array.isArray(searchJson.data?.autoComplete) && searchJson.data.autoComplete.length > 0) {
        urlSlug = searchJson.data.autoComplete[0].urlSlug || searchJson.data.autoComplete[0].hpgSlug;
    } else if (Array.isArray(searchJson.suggestions) && searchJson.suggestions.length > 0) {
        urlSlug = searchJson.suggestions[0].urlSlug || searchJson.suggestions[0].hpgSlug;
    } else if (Array.isArray(searchJson.data) && searchJson.data.length > 0) {
        urlSlug = searchJson.data[0].urlSlug || searchJson.data[0].hpgSlug;
    }

    if (!urlSlug) {
        return NextResponse.json({
            found: false,
            message: "Automatic chain interrupted: No urlSlug found in Phase 1 response.",
            debug_info: "Check 'Logs' button in header to see Phase 1 response structure."
        });
    }

    // PHASE 2: Automatic follow-up to get full details
    // User says: "the urlswlug is inserted in this API... curl --request GET --url 'https://domain-au.p.rapidapi.com/estimates/details?query=...'"
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
            endpoint: 'Domain Details (Phase 2 - Automatic)',
            request_payload: { urlSlug },
            response_payload: detailsJson,
            status_code: detailsRes.status
        });
    }

    const data = detailsJson.data?.propertyDetails;
    if (!data) {
        return NextResponse.json({
            found: false,
            message: "Slug resolved but details call returned no propertyDetails data.",
            slug_used: urlSlug
        });
    }

    // Extract valuations
    const valuation = data.valuation || {};

    // Image extraction
    const imageUrl = data.media?.[0]?.url || (Array.isArray(data.media) && data.media.find((m: any) => m.type === 'IMAGE')?.url) || null;

    // Area sizes - handle the special keys Domain uses
    const landArea = data['landArea({"unit":"SQUARE_METERS"})'] || data.landArea || null;
    const internalArea = data['internalArea({"unit":"SQUARE_METERS"})'] || data.internalArea || null;

    const result = {
        found: true,
        estimate_lower: valuation.lowerPrice || null,
        estimate_mid: valuation.midPrice || null,
        estimate_upper: valuation.upperPrice || null,
        estimate_confidence: valuation.priceConfidence || null,
        property_image_url: imageUrl,
        property_type: data.type || null,
        property_bedrooms: data.bedrooms || null,
        property_bathrooms: data.bathrooms || null,
        property_parking: data.parkingSpaces || null,
        property_land_area: landArea,
        property_internal_area: internalArea,
        property_year_built: data.yearBuilt || null,
        property_latitude: data.address?.geolocation?.latitude || null,
        property_longitude: data.address?.geolocation?.longitude || null,
        display_address: data.address?.displayAddress || query
    };

    // Auto-save the enriched data to the database
    if (dealId) {
        await supabase.from('deals').update({
            estimate_lower: result.estimate_lower,
            estimate_mid: result.estimate_mid,
            estimate_upper: result.estimate_upper,
            estimate_confidence: result.estimate_confidence,
            property_image_url: result.property_image_url,
            property_type: result.property_type,
            property_bedrooms: result.property_bedrooms,
            property_bathrooms: result.property_bathrooms,
            property_parking: result.property_parking,
            property_land_area: result.property_land_area,
            property_internal_area: result.property_internal_area,
            property_year_built: result.property_year_built,
            property_latitude: result.property_latitude,
            property_longitude: result.property_longitude,
            updated_at: new Date().toISOString()
        }).eq('id', dealId);
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Domain Automatic Chain Error:", error);
    return NextResponse.json({
        error: error.message,
        phase: "Automatic Intelligence Chain"
    }, { status: 500 });
  }
}
