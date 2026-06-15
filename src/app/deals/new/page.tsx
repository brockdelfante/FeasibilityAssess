"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronRight, ChevronLeft, Check, Loader2 } from "lucide-react";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";

export default function NewDealWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<any>({
    deal_type: "construction",
    customer_group: "",
    project_address: "",
    address_street: "",
    address_city: "",
    address_state: "",
    address_postcode: "",
    address_country: "",
    start_date: new Date().toISOString().split('T')[0],
    loan_term_months: 18,
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.id) {
        router.push(`/deals/${data.id}/edit`);
      } else {
        throw new Error(data.error || "No ID returned");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddressSelect = (suggestion: any) => {
    setFormData({
      ...formData,
      project_address: suggestion.label,
      address_street: suggestion.street || "",
      address_city: suggestion.city || "",
      address_state: suggestion.state || "",
      address_postcode: suggestion.postcode || "",
      address_country: suggestion.country || "Australia"
    });
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 min-h-screen">
      <div className="w-full max-w-2xl">
        <div className="mb-8 flex justify-between items-center px-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                step === i ? "bg-blue-600 text-white" : step > i ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
              }`}>
                {step > i ? <Check className="h-4 w-4" /> : i}
              </div>
              {i < 3 && <div className={`w-24 h-1 mx-2 ${step > i ? "bg-green-500" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        <Card className="shadow-lg border-t-4 border-t-blue-600">
          <CardHeader>
            <CardTitle className="text-2xl font-black uppercase tracking-tight">
              {step === 1 ? "Model Type" : step === 2 ? "Basic Details" : "Finalise"}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-6 overflow-visible">
            {step === 1 && (
              <RadioGroup value={formData.deal_type} onValueChange={(v) => setFormData({...formData, deal_type: v})}>
                <div className="grid gap-4">
                  <Label htmlFor="construction" className="flex flex-col border-2 p-5 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors [&:has([data-state=checked])]:border-blue-600 [&:has([data-state=checked])]:bg-blue-50/30">
                    <RadioGroupItem value="construction" id="construction" className="sr-only" />
                    <span className="font-black uppercase tracking-tight text-lg">Construction</span>
                    <span className="text-xs text-gray-500 font-medium">Vertical residential or commercial builds</span>
                  </Label>
                  <Label htmlFor="subdivision" className="flex flex-col border-2 p-5 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors [&:has([data-state=checked])]:border-blue-600 [&:has([data-state=checked])]:bg-blue-50/30">
                    <RadioGroupItem value="subdivision" id="subdivision" className="sr-only" />
                    <span className="font-black uppercase tracking-tight text-lg">Subdivision</span>
                    <span className="text-xs text-gray-500 font-medium">Horizontal land division and civil works</span>
                  </Label>
                </div>
              </RadioGroup>
            )}
            {step === 2 && (
              <div className="space-y-6">
                <div className="grid gap-2">
                    <Label htmlFor="group-input" className="text-[10px] font-black uppercase text-gray-400">Group</Label>
                    <Input id="group-input" placeholder="e.g. Siare Holdings" value={formData.customer_group} onChange={e => setFormData({...formData, customer_group: e.target.value})} className="h-12 text-lg font-bold" />
                </div>
                <div className="grid gap-2 overflow-visible">
                    <Label htmlFor="address-input" className="text-[10px] font-black uppercase text-gray-400">Address</Label>
                    <AddressAutocomplete
                        value={formData.project_address}
                        onChange={(val) => setFormData({...formData, project_address: val})}
                        onSelect={handleAddressSelect}
                        placeholder="Start typing project address..."
                        className="h-12"
                    />
                </div>
              </div>
            )}
            {step === 3 && (
                <div className="space-y-4">
                    <div className="p-6 border-2 border-dashed rounded-2xl bg-blue-50/30 text-blue-900 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">Ready to Initialise</p>
                        <h3 className="text-xl font-black">{formData.project_address || "Unnamed Project"}</h3>
                        <p className="text-sm font-medium opacity-70 mt-1">{formData.customer_group || "Private Group"}</p>
                    </div>
                </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t bg-gray-50/50 p-6">
            <Button variant="ghost" onClick={() => step === 1 ? router.push('/') : setStep(s => s - 1)} disabled={isSubmitting} className="font-bold uppercase text-[11px] tracking-widest">Back</Button>
            <Button onClick={() => step === 3 ? handleSubmit() : setStep(s => s + 1)} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 px-8 font-black uppercase text-[11px] tracking-widest shadow-lg shadow-blue-900/20 text-white border-0">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {step === 3 ? "Create Assessment" : "Next"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
