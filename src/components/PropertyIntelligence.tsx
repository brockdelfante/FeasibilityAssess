"use client";

import { useDealStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, Bed, Bath, Car, Maximize, TrendingUp, Calendar, Ruler, ShieldCheck, MapPin } from "lucide-react";

export function PropertyIntelligence() {
  const { inputs } = useDealStore();

  if (!inputs.projectAddress) return null;

  const formatCurrency = (val: number | null) =>
    val ? new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val) : "N/A";

  const hasStats = inputs.propertyBedrooms || inputs.propertyBathrooms || inputs.propertyParking || inputs.propertyLandArea || inputs.propertyInternalArea || inputs.propertyYearBuilt;

  // Use OpenStreetMap for the map display if lat/long is available
  // Using mlat/mlon for the marker pin
  const mapUrl = inputs.propertyLatitude && inputs.propertyLongitude
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${inputs.propertyLongitude - 0.01},${inputs.propertyLatitude - 0.01},${inputs.propertyLongitude + 0.01},${inputs.propertyLatitude + 0.01}&layer=mapnik&mlat=${inputs.propertyLatitude}&mlon=${inputs.propertyLongitude}`
    : null;

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-white rounded-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 h-72 border-b border-gray-100">
        {/* Image Section */}
        <div className="relative h-full w-full bg-gray-100 overflow-hidden border-r border-gray-100">
          {inputs.propertyImageUrl ? (
            <img
              src={inputs.propertyImageUrl}
              alt="Property"
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 font-bold uppercase text-[10px] tracking-widest flex-col space-y-2">
                <div className="bg-white p-3 rounded-full shadow-sm"><Home className="h-5 w-5 text-gray-200" /></div>
                <span>No Property Image</span>
            </div>
          )}
          <div className="absolute top-4 left-4">
            <Badge className="bg-blue-600/90 backdrop-blur-md text-white border-0 px-3 py-1 font-black uppercase text-[9px] tracking-widest shadow-lg">
              Property Photo
            </Badge>
          </div>
        </div>

        {/* Map Section */}
        <div className="relative h-full w-full bg-gray-50 overflow-hidden">
          {mapUrl ? (
            <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src={mapUrl}
                style={{ filter: 'contrast(1.1) brightness(1.05)' }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 font-bold uppercase text-[10px] tracking-widest flex-col space-y-2">
                <div className="bg-white p-3 rounded-full shadow-sm"><MapPin className="h-5 w-5 text-gray-200" /></div>
                <span>Geodata Pending</span>
            </div>
          )}
          <div className="absolute top-4 left-4">
            <Badge className="bg-gray-900/80 backdrop-blur-md text-white border-0 px-3 py-1 font-black uppercase text-[9px] tracking-widest shadow-lg">
              Location context
            </Badge>
          </div>
        </div>
      </div>

      <CardContent className="p-6 space-y-6">
        <div className="flex justify-between items-start">
            <div className="space-y-1">
                <h3 className="text-xl font-black text-gray-900 leading-tight tracking-tight">{inputs.projectAddress}</h3>
                <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest flex items-center">
                    <Home className="h-3 w-3 mr-1.5 text-blue-500" /> {inputs.propertyType || "Residential Site"}
                    {inputs.propertyYearBuilt && <><span className="mx-2 opacity-30">|</span> <Calendar className="h-3 w-3 mr-1.5 text-blue-500" /> Built {inputs.propertyYearBuilt}</>}
                </p>
            </div>
            <div className="flex flex-col items-end space-y-1">
                <Badge variant="outline" className="text-[9px] font-black border-blue-100 text-blue-600 bg-blue-50 uppercase tracking-widest px-3 py-1">
                    Verified Data
                </Badge>
                {inputs.estimateConfidence && (
                    <span className="text-[8px] font-black uppercase text-gray-400">Confidence: <span className="text-blue-600">{inputs.estimateConfidence}</span></span>
                )}
            </div>
        </div>

        {hasStats && (
          <div className="grid grid-cols-6 gap-2 py-5 border-y border-gray-50">
            <div className="flex flex-col items-center border-r last:border-0">
              <Bed className="h-4 w-4 text-gray-300 mb-1.5" />
              <span className="text-xs font-black text-gray-800">{inputs.propertyBedrooms || "—"}</span>
              <span className="text-[8px] uppercase font-bold text-gray-400">Beds</span>
            </div>
            <div className="flex flex-col items-center border-r last:border-0">
              <Bath className="h-4 w-4 text-gray-300 mb-1.5" />
              <span className="text-xs font-black text-gray-800">{inputs.propertyBathrooms || "—"}</span>
              <span className="text-[8px] uppercase font-bold text-gray-400">Baths</span>
            </div>
            <div className="flex flex-col items-center border-r last:border-0">
              <Car className="h-4 w-4 text-gray-300 mb-1.5" />
              <span className="text-xs font-black text-gray-800">{inputs.propertyParking || "—"}</span>
              <span className="text-[8px] uppercase font-bold text-gray-400">Cars</span>
            </div>
            <div className="flex flex-col items-center border-r last:border-0">
              <Maximize className="h-4 w-4 text-gray-300 mb-1.5" />
              <span className="text-xs font-black text-gray-800">{inputs.propertyLandArea ? `${inputs.propertyLandArea}m²` : "—"}</span>
              <span className="text-[8px] uppercase font-bold text-gray-400">Land</span>
            </div>
            <div className="flex flex-col items-center border-r last:border-0">
              <Ruler className="h-4 w-4 text-gray-300 mb-1.5" />
              <span className="text-xs font-black text-gray-800">{inputs.propertyInternalArea ? `${inputs.propertyInternalArea}m²` : "—"}</span>
              <span className="text-[8px] uppercase font-bold text-gray-400">Internal</span>
            </div>
            <div className="flex flex-col items-center last:border-0">
              <ShieldCheck className="h-4 w-4 text-gray-300 mb-1.5" />
              <span className="text-xs font-black text-gray-800">{inputs.estimateConfidence || "—"}</span>
              <span className="text-[8px] uppercase font-bold text-gray-400">Conf.</span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1.5 text-green-500" /> Automated Gearing Range
            </h4>
            <div className="flex items-center space-x-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Live Valuation Feed</span>
            </div>
          </div>

          <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
            <div className="text-center space-y-1 mb-6">
              <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest">Mid-Range Estimate</p>
              <p className="text-4xl font-mono font-black text-gray-900 tracking-tighter">
                {formatCurrency(inputs.estimateMid)}
              </p>
            </div>

            <div className="flex justify-between items-end px-4">
              <div className="text-left">
                <p className="text-[9px] uppercase font-black text-gray-400 mb-1">Lower Bound</p>
                <p className="text-sm font-mono font-black text-gray-600">{formatCurrency(inputs.estimateLower)}</p>
              </div>
              <div className="flex-1 h-1.5 mx-8 mb-3 bg-gray-200 rounded-full relative">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-blue-600 border-2 border-white shadow-md" />
              </div>
              <div className="text-right">
                <p className="text-[9px] uppercase font-black text-gray-400 mb-1">Upper Bound</p>
                <p className="text-sm font-mono font-black text-gray-600">{formatCurrency(inputs.estimateUpper)}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
