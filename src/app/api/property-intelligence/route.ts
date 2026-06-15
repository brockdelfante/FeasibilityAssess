import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  try {
    const response = await fetch(`https://domain-au.p.rapidapi.com/estimates/auto-complete?query=${encodeURIComponent(query)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": "domain-au.p.rapidapi.com",
        "x-rapidapi-key": "bf8d2a31b2msh6f8499be824c0b8p16ccdajsn96923e55cd4c"
      }
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(err);
    }

    const json = await response.json();
    const data = json.data?.propertyDetails;

    if (!data) {
        return NextResponse.json({ found: false });
    }

    // Extract first image
    const imageUrl = data.media?.[0]?.url || null;

    return NextResponse.json({
        found: true,
        estimate_lower: data.valuation?.lowerPrice || null,
        estimate_mid: data.valuation?.midPrice || null,
        estimate_upper: data.valuation?.upperPrice || null,
        property_image_url: imageUrl,
        property_type: data.type || null,
        property_bedrooms: data.bedrooms || null,
        property_bathrooms: data.bathrooms || null,
        property_parking: data.parkingSpaces || null,
        property_land_area: data["landArea({\"unit\":\"SQUARE_METERS\"})"] || null,
        display_address: data.address?.displayAddress || query
    });

  } catch (error: any) {
    console.error("Domain API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
