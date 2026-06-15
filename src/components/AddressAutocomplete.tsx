"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";

interface AddressSuggestion {
  label: string;
  street: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: AddressSuggestion) => void;
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
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const params = useParams();
  const dealId = params?.id;

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
      const url = dealId
        ? `/api/address-autocomplete?q=${encodeURIComponent(query)}&dealId=${dealId}`
        : `/api/address-autocomplete?q=${encodeURIComponent(query)}`;

      const response = await fetch(url);
      const data = await response.json();

      const results = (data || []).map((item: any) => {
        const label = item.ssla || item.sla;
        const parts = label.split(',').map((p: any) => p.trim());
        const street = parts[0] || "";
        const lastPart = parts[parts.length - 1] || "";
        const subParts = lastPart.split(' ');

        const postcode = subParts[subParts.length - 1] || "";
        const state = subParts[subParts.length - 2] || "";
        const suburb = subParts.slice(0, -2).join(' ') || "";

        return {
          label,
          street,
          city: suburb,
          state,
          postcode,
          country: "Australia"
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

  const handleSelect = (suggestion: AddressSuggestion) => {
    onChange(suggestion.label);
    setIsOpen(false);
    if (onSelect) onSelect(suggestion);
  };

  return (
    <div ref={wrapperRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <Input
          value={value}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="pr-10 bg-white border-gray-300 text-gray-900 h-full"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-[100] mt-1 w-full rounded-md border bg-white shadow-2xl max-h-60 overflow-auto border-gray-200">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(s)}
              className="flex w-full items-center px-4 py-3 text-left text-sm hover:bg-blue-50 transition-colors border-b last:border-0 text-gray-700"
            >
              <MapPin className="mr-3 h-4 w-4 text-blue-500 shrink-0" />
              <span className="truncate font-medium">{s.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
