"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";

export default function NewDealWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    dealType: "construction",
    customerGroup: "",
    projectAddress: "",
    ownerBuilder: false,
    startDate: "",
    loanTermMonths: 18,
    assignedTo: "Jules Smith"
  });

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    router.push("/deals/mock-id/edit");
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
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
              <RadioGroup defaultValue="construction" onValueChange={(v) => setFormData({...formData, dealType: v})}>
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
                      Vertical development of residential or commercial buildings. Includes high-rise, townhouses, and mixed-use.
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
                      Land subdivision and lot creation. Includes civil works, utilities, and infrastructure.
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
                    value={formData.customerGroup}
                    onChange={(e) => setFormData({...formData, customerGroup: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="projectAddress">Project Address</Label>
                  <Input
                    id="projectAddress"
                    placeholder="Full site address"
                    value={formData.projectAddress}
                    onChange={(e) => setFormData({...formData, projectAddress: e.target.value})}
                  />
                </div>
                <div className="flex items-center space-x-4 pt-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="ownerBuilder"
                      checked={formData.ownerBuilder}
                      onCheckedChange={(v) => setFormData({...formData, ownerBuilder: v})}
                    />
                    <Label htmlFor="ownerBuilder">Owner Builder Deal</Label>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">Proposed Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="loanTerm">Loan Term (Months)</Label>
                    <Input
                      id="loanTerm"
                      type="number"
                      value={formData.loanTermMonths}
                      onChange={(e) => setFormData({...formData, loanTermMonths: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="rounded-lg bg-blue-50 p-4 text-sm">
                  <p className="font-semibold text-blue-900 mb-2">Policy Configuration Applied</p>
                  <p className="text-blue-800">This deal will be assessed against the <strong>2026 Policy</strong>. You can override individual thresholds later.</p>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <span className="text-gray-500">Max LVR (Gross)</span>
                  <span className="font-medium text-right">65.0%</span>
                  <span className="text-gray-500">Max LTC</span>
                  <span className="font-medium text-right">80.0%</span>
                  <span className="text-gray-500">Min ROC</span>
                  <span className="font-medium text-right">20.0%</span>
                  <span className="text-gray-500">Min Presales Cover</span>
                  <span className="font-medium text-right">80.0%</span>
                  <div className="col-span-2 border-t my-2" />
                  <span className="text-gray-500">Default Interest Rate</span>
                  <span className="font-medium text-right">9.99%</span>
                  <span className="text-gray-500">LAF Rate</span>
                  <span className="font-medium text-right">1.50%</span>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t bg-gray-50/50 p-6">
            <Button variant="outline" onClick={step === 1 ? () => router.back() : prevStep}>
              {step === 1 ? "Cancel" : <><ChevronLeft className="mr-2 h-4 w-4" /> Previous</>}
            </Button>
            <Button onClick={step === 3 ? handleSubmit : nextStep}>
              {step === 3 ? "Create Deal Assessment" : <>Next <ChevronRight className="ml-2 h-4 w-4" /></>}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
