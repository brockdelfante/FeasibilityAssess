"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronRight, ChevronLeft, Check, Loader2 } from "lucide-react";

export default function NewDealWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    deal_type: "construction",
    customer_group: "",
    project_address: "",
    start_date: new Date().toISOString().split('T')[0],
    loan_term_months: 18,
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            ...formData,
            status: 'draft',
            created_by: 'Jules Smith',
            interest_rate: 0.0999,
            laf_rate: 0.015,
            gst_method: 'standard',
            site_value: 0,
            construction: 0,
            professional_fees: 0,
            development_contingency: 0,
            customer_cash_equity: 0,
        })
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
            <CardTitle>{step === 1 ? "Select Type" : step === 2 ? "Basic Details" : "Confirm"}</CardTitle>
          </CardHeader>
          <CardContent className="py-6">
            {step === 1 && (
              <RadioGroup value={formData.deal_type} onValueChange={(v) => setFormData({...formData, deal_type: v})}>
                <div className="grid gap-4">
                  <Label htmlFor="construction" className="flex flex-col border-2 p-4 rounded-md cursor-pointer [&:has([data-state=checked])]:border-blue-600">
                    <RadioGroupItem value="construction" id="construction" className="sr-only" />
                    <span className="font-bold">Construction</span>
                    <span className="text-xs text-gray-500">Vertical development</span>
                  </Label>
                  <Label htmlFor="subdivision" className="flex flex-col border-2 p-4 rounded-md cursor-pointer [&:has([data-state=checked])]:border-blue-600">
                    <RadioGroupItem value="subdivision" id="subdivision" className="sr-only" />
                    <span className="font-bold">Subdivision</span>
                    <span className="text-xs text-gray-500">Land division</span>
                  </Label>
                </div>
              </RadioGroup>
            )}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid gap-2"><Label>Group</Label><Input value={formData.customer_group} onChange={e => setFormData({...formData, customer_group: e.target.value})} /></div>
                <div className="grid gap-2"><Label>Address</Label><Input value={formData.project_address} onChange={e => setFormData({...formData, project_address: e.target.value})} /></div>
              </div>
            )}
            {step === 3 && <div className="p-4 border rounded-lg bg-blue-50 text-blue-900 font-medium">Ready to create assessment for {formData.project_address}</div>}
          </CardContent>
          <CardFooter className="flex justify-between border-t bg-gray-50/50 p-6">
            <Button variant="outline" onClick={() => step === 1 ? router.push('/') : setStep(s => s - 1)} disabled={isSubmitting}>Back</Button>
            <Button onClick={() => step === 3 ? handleSubmit() : setStep(s => s + 1)} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {step === 3 ? "Create" : "Next"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
