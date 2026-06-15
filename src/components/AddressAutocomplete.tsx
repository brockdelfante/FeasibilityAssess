"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: any) => void;
  placeholder?: string;
  className?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Search address...",
  className
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`https://addressr.p.rapidapi.com/addresses?q=${encodeURIComponent(query)}`, {
        headers: {
          'Content-Type': 'application/json',
          'x-rapidapi-host': 'addressr.p.rapidapi.com',
          'x-rapidapi-key': 'bf8d2a31b2msh6f8499be824c0b8p16ccdajsn96923e55cd4c'
        }
      });

      const data = await response.json();

      // Map API response to our suggestion format
      const results = data.map((item: any) => {
        // ssla is often cleaner: "1/261 GEORGE ST, SYDNEY NSW 2000"
        const label = item.ssla || item.sla;

        // Parse components from ssla/sla for storage
        // Format is usually: STREET, SUBURB STATE POSTCODE
        const parts = label.split(',').map((p: any) => p.trim());
        const street = parts[0] || "";
        const lastPart = parts[parts.length - 1] || "";
        const subParts = lastPart.split(' ');

        // Postcode is usually last 4 digits
        const postcode = subParts[subParts.length - 1] || "";
        // State is usually second to last
        const state = subParts[subParts.length - 2] || "";
        // Suburb is everything before state in the last segment
        const suburb = subParts.slice(0, -2).join(' ') || "";

        return {
          label,
          properties: {
            street,
            city: suburb,
            state,
            postcode,
            country: "Australia", // API is AU centric
            raw: item
          }
        };
      });

      setSuggestions(results);
      setIsOpen(results.length > 0);
    } catch (error) {
      console.error("Autocomplete fetch failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    fetchSuggestions(val);
  };

  const handleSelect = (suggestion: any) => {
    onChange(suggestion.label);
    setIsOpen(false);
    if (onSelect) onSelect(suggestion.properties);
  };

  return (
    <div ref={wrapperRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <Input
          value={value}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="pr-10 bg-white"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-[100] mt-1 w-full rounded-md border bg-white shadow-2xl max-h-60 overflow-auto">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(s)}
              className="flex w-full items-center px-4 py-3 text-left text-sm hover:bg-blue-50 transition-colors border-b last:border-0"
            >
              <MapPin className="mr-3 h-4 w-4 text-blue-500 shrink-0" />
              <span className="truncate text-gray-700 font-medium">{s.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
