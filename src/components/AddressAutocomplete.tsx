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
      // Using the Photon API (Komoot) which matches the expected behavior
      const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`);
      const data = await response.json();

      const results = data.features.map((f: any) => {
        const p = f.properties;
        const name = p.name || "";
        const house = p.housenumber || "";
        const street = p.street || "";
        const city = p.city || p.town || "";
        const state = p.state || "";
        const country = p.country || "";

        let label = [name, house, street, city, state, country]
          .filter(Boolean)
          .join(", ");

        return {
          label,
          properties: p
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
          className="pr-10"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-[100] mt-1 w-full rounded-md border bg-white shadow-xl max-h-60 overflow-auto">
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
