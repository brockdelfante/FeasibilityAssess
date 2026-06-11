"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Save, History } from "lucide-react";

export default function PolicySettingsPage() {
  const [policy, setPolicy] = useState({
    maxLvrGross: 0.65,
    maxLtc: 0.80,
    minRoc: 0.20,
    minPresalesCover: 0.80,
    weightLocation: 0.20,
    weightDeveloperExp: 0.25,
    weightPresales: 0.20,
    weightLvr: 0.20,
    weightContingency: 0.15,
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Policy Configuration</h1>
          <p className="text-gray-500">Global lending thresholds and risk scoring weights.</p>
        </div>
        <Button className="bg-blue-600">
          <Save className="mr-2 h-4 w-4" />
          Save Policy Version
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lending Thresholds</CardTitle>
            <CardDescription>Hard limits for covenant compliance checks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <Label>Max LVR (Gross GRV)</Label>
                <span className="font-mono text-sm">{(policy.maxLvrGross * 100).toFixed(1)}%</span>
              </div>
              <Slider
                value={[policy.maxLvrGross]}
                min={0} max={1} step={0.01}
                onValueChange={([v]) => setPolicy({...policy, maxLvrGross: v})}
              />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <Label>Max LTC</Label>
                <span className="font-mono text-sm">{(policy.maxLtc * 100).toFixed(1)}%</span>
              </div>
              <Slider
                value={[policy.maxLtc]}
                min={0} max={1} step={0.01}
                onValueChange={([v]) => setPolicy({...policy, maxLtc: v})}
              />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <Label>Min ROC</Label>
                <span className="font-mono text-sm">{(policy.minRoc * 100).toFixed(1)}%</span>
              </div>
              <Slider
                value={[policy.minRoc]}
                min={0} max={0.5} step={0.01}
                onValueChange={([v]) => setPolicy({...policy, minRoc: v})}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Scoring Weights</CardTitle>
            <CardDescription>Relative importance of each risk category (must sum to 100%).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <Label>Location Quality</Label>
                <span className="font-mono text-sm">{(policy.weightLocation * 100).toFixed(0)}%</span>
              </div>
              <Slider
                value={[policy.weightLocation]}
                min={0} max={1} step={0.05}
                onValueChange={([v]) => setPolicy({...policy, weightLocation: v})}
              />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <Label>Developer Experience</Label>
                <span className="font-mono text-sm">{(policy.weightDeveloperExp * 100).toFixed(0)}%</span>
              </div>
              <Slider
                value={[policy.weightDeveloperExp]}
                min={0} max={1} step={0.05}
                onValueChange={([v]) => setPolicy({...policy, weightDeveloperExp: v})}
              />
            </div>
            <Separator />
            <div className="flex justify-between font-bold">
              <span>Total Weight</span>
              <span className={`font-mono ${Math.abs(policy.weightLocation + policy.weightDeveloperExp + policy.weightPresales + policy.weightLvr + policy.weightContingency - 1) < 0.001 ? "text-green-600" : "text-red-600"}`}>
                {((policy.weightLocation + policy.weightDeveloperExp + policy.weightPresales + policy.weightLvr + policy.weightContingency) * 100).toFixed(0)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
