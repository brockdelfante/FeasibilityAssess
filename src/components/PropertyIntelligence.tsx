"use client";

import { useDealStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Home, Bed, Bath, Car, Maximize, TrendingUp, AlertCircle } from "lucide-react";

export function PropertyIntelligence() {
  const { inputs } = useDealStore();

  if (!inputs.projectAddress) return null;

  const formatCurrency = (val: number | null) =>
    val ? new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val) : "N/A";

  const hasStats = inputs.propertyBedrooms || inputs.propertyBathrooms || inputs.propertyParking || inputs.propertyLandArea;

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-white rounded-2xl">
      {inputs.propertyImageUrl && (
        <div className="relative h-48 w-full overflow-hidden">
          <img
            src={inputs.propertyImageUrl}
            alt="Property"
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
          <div className="absolute top-4 left-4">
            <Badge className="bg-blue-600/90 backdrop-blur-md text-white border-0 px-3 py-1 font-black uppercase text-[9px] tracking-widest shadow-lg">
              Property Intelligence
            </Badge>
          </div>
        </div>
      )}

      <CardContent className="p-6 space-y-6">
        <div className="space-y-1">
          <h3 className="text-lg font-black text-gray-900 leading-tight">{inputs.projectAddress}</h3>
          <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest flex items-center">
            <Home className="h-3 w-3 mr-1.5 text-blue-500" /> {inputs.propertyType || "Residential Site"}
          </p>
        </div>

        {hasStats && (
          <div className="grid grid-cols-4 gap-2 py-4 border-y border-gray-50">
            <div className="flex flex-col items-center">
              <Bed className="h-4 w-4 text-gray-300 mb-1" />
              <span className="text-xs font-black text-gray-700">{inputs.propertyBedrooms || "—"}</span>
              <span className="text-[8px] uppercase font-bold text-gray-400">Beds</span>
            </div>
            <div className="flex flex-col items-center">
              <Bath className="h-4 w-4 text-gray-300 mb-1" />
              <span className="text-xs font-black text-gray-700">{inputs.propertyBathrooms || "—"}</span>
              <span className="text-[8px] uppercase font-bold text-gray-400">Baths</span>
            </div>
            <div className="flex flex-col items-center">
              <Car className="h-4 w-4 text-gray-300 mb-1" />
              <span className="text-xs font-black text-gray-700">{inputs.propertyParking || "—"}</span>
              <span className="text-[8px] uppercase font-bold text-gray-400">Cars</span>
            </div>
            <div className="flex flex-col items-center">
              <Maximize className="h-4 w-4 text-gray-300 mb-1" />
              <span className="text-xs font-black text-gray-700">{inputs.propertyLandArea ? `${inputs.propertyLandArea}m²` : "—"}</span>
              <span className="text-[8px] uppercase font-bold text-gray-400">Land</span>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1.5 text-green-500" /> Market Valuation
            </h4>
            <Badge variant="outline" className="text-[9px] font-black border-green-100 text-green-600 bg-green-50 uppercase tracking-tighter">
              Domain Estimate
            </Badge>
          </div>

          <div className="bg-gray-50/50 rounded-2xl p-5 border border-gray-100">
            <div className="text-center space-y-1 mb-4">
              <p className="text-[9px] uppercase font-black text-gray-400 tracking-widest">Mid-Range Estimate</p>
              <p className="text-3xl font-mono font-black text-gray-900 tracking-tighter">
                {formatCurrency(inputs.estimateMid)}
              </p>
            </div>

            <div className="flex justify-between items-end px-2">
              <div className="text-left">
                <p className="text-[8px] uppercase font-black text-gray-400 mb-0.5">Lower</p>
                <p className="text-xs font-mono font-bold text-gray-600">{formatCurrency(inputs.estimateLower)}</p>
              </div>
              <div className="flex-1 h-1 mx-4 mb-2 bg-gray-200 rounded-full relative">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-blue-600 border-2 border-white shadow-sm" />
              </div>
              <div className="text-right">
                <p className="text-[8px] uppercase font-black text-gray-400 mb-0.5">Upper</p>
                <p className="text-xs font-mono font-bold text-gray-600">{formatCurrency(inputs.estimateUpper)}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
