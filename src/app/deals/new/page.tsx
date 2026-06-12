"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { ChevronRight, ChevronLeft, Check, Loader2 } from "lucide-react";

export default function NewDealWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    deal_type: "construction",
    customer_group: "",
    project_address: "",
    owner_builder: "3rd Party",
    start_date: new Date().toISOString().split('T')[0],
    loan_term_months: 18,
    assigned_to: "Jules Smith"
  });

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

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
      }
    } catch (err) {
      console.error(err);
      alert("Failed to create deal. Check console.");
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
            <CardTitle>
              {step === 1 && "Select Deal Type"}
              {step === 2 && "Basic Details"}
              {step === 3 && "Confirm & Policy Overview"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Choose the primary nature of this property development deal."}
              {step === 2 && "Provide the core information about the customer and project."}
              {step === 3 && "Review defaults and finalize creation."}
            </CardDescription>
          </CardHeader>
          <CardContent className="py-6">
            {step === 1 && (
              <RadioGroup value={formData.deal_type} onValueChange={(v) => setFormData({...formData, deal_type: v})}>
                <div className="grid gap-4">
                  <Label
                    htmlFor="construction"
                    className="flex flex-col items-start justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-blue-600"
                  >
                    <RadioGroupItem value="construction" id="construction" className="sr-only" />
                    <div className="flex w-full items-center justify-between">
                      <span className="font-bold uppercase tracking-tight">Construction</span>
                    </div>
                    <span className="text-sm text-muted-foreground mt-2">
                      Vertical development of residential or commercial buildings.
                    </span>
                  </Label>
                  <Label
                    htmlFor="subdivision"
                    className="flex flex-col items-start justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-blue-600"
                  >
                    <RadioGroupItem value="subdivision" id="subdivision" className="sr-only" />
                    <div className="flex w-full items-center justify-between">
                      <span className="font-bold uppercase tracking-tight">Subdivision</span>
                    </div>
                    <span className="text-sm text-muted-foreground mt-2">
                      Land subdivision and lot creation.
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="customerGroup">Customer Group</Label>
                  <Input
                    id="customerGroup"
                    placeholder="e.g. Siare Development Group"
                    value={formData.customer_group}
                    onChange={(e) => setFormData({...formData, customer_group: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="projectAddress">Project Address</Label>
                  <Input
                    id="projectAddress"
                    placeholder="Full site address"
                    value={formData.project_address}
                    onChange={(e) => setFormData({...formData, project_address: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">Proposed Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="loanTerm">Loan Term (Months)</Label>
                    <Input
                      id="loanTerm"
                      type="number"
                      value={formData.loan_term_months}
                      onChange={(e) => setFormData({...formData, loan_term_months: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="rounded-lg bg-blue-50 p-4 text-sm">
                  <p className="font-semibold text-blue-900 mb-2">Policy Configuration Applied</p>
                  <p className="text-blue-800">This deal will be assessed against current policy thresholds.</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm border p-4 rounded-lg">
                  <div>
                    <p className="text-gray-500">Address</p>
                    <p className="font-bold">{formData.project_address}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Type</p>
                    <p className="font-bold uppercase">{formData.deal_type}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t bg-gray-50/50 p-6">
            <Button variant="outline" onClick={step === 1 ? () => router.back() : prevStep} disabled={isSubmitting}>
              {step === 1 ? "Cancel" : <><ChevronLeft className="mr-2 h-4 w-4" /> Previous</>}
            </Button>
            <Button onClick={step === 3 ? handleSubmit : nextStep} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {step === 3 ? "Create Assessment" : <>Next <ChevronRight className="ml-2 h-4 w-4" /></>}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
