"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Save, Loader2, CheckCircle2 } from "lucide-react";

export default function PolicySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [policy, setPolicy] = useState<any>(null);

  useEffect(() => {
    fetch("/api/policy")
      .then(res => res.json())
      .then(data => {
        setPolicy(data);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
        await fetch("/api/policy", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(policy)
        });
        alert("Policy saved successfully.");
    } finally {
        setIsSaving(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-muted/40"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Policy Configuration</h1>
          <p className="text-muted-foreground mt-1">Global lending thresholds and risk scoring weights applied to new assessments.</p>
        </div>
        <Button className="bg-brand-600 shadow-lg text-white" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Update Active Policy
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="bg-muted/40 border-b">
            <CardTitle className="text-lg">Lending Thresholds</CardTitle>
            <CardDescription>Hard limits for covenant compliance checks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
            {[
                { label: 'Max LVR (Gross GRV)', key: 'max_lvr_gross', min: 0, max: 1 },
                { label: 'Max LVR (NRV)', key: 'max_lvr_net', min: 0, max: 1 },
                { label: 'Max LTC', key: 'max_ltc', min: 0, max: 1 },
                { label: 'Min ROC', key: 'min_roc', min: 0, max: 0.5 },
                { label: 'Min Presales Cover', key: 'min_presales_cover', min: 0, max: 2 },
            ].map(item => (
                <div key={item.key} className="space-y-4">
                    <div className="flex justify-between items-center">
                        <Label className="font-bold uppercase text-[11px] text-muted-foreground">{item.label}</Label>
                        <span className="font-mono text-sm bg-brand-50 text-brand-700 px-2 py-0.5 rounded">{(policy[item.key] * 100).toFixed(1)}%</span>
                    </div>
                    <Slider
                        value={[policy[item.key]]}
                        min={item.min} max={item.max} step={0.01}
                        onValueChange={([v]) => setPolicy({...policy, [item.key]: v})}
                    />
                </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="bg-muted/40 border-b">
            <CardTitle className="text-lg">Risk Scoring Weights</CardTitle>
            <CardDescription>Must sum to exactly 100%.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
            {[
                { label: 'Location Quality', key: 'weight_location' },
                { label: 'Developer Exp', key: 'weight_developer_exp' },
                { label: 'Presales Coverage', key: 'weight_presales' },
                { label: 'LVR Position', key: 'weight_lvr' },
                { label: 'Contingency', key: 'weight_contingency' },
            ].map(item => (
                <div key={item.key} className="space-y-4">
                    <div className="flex justify-between items-center">
                        <Label className="font-bold uppercase text-[11px] text-muted-foreground">{item.label}</Label>
                        <span className="font-mono text-sm bg-positive-50 text-positive-700 px-2 py-0.5 rounded">{(policy[item.key] * 100).toFixed(0)}%</span>
                    </div>
                    <Slider
                        value={[policy[item.key]]}
                        min={0} max={1} step={0.05}
                        onValueChange={([v]) => setPolicy({...policy, [item.key]: v})}
                    />
                </div>
            ))}
            <Separator />
            <div className="flex justify-between font-bold items-center">
              <span className="text-xs uppercase text-muted-foreground">Total Calculation Weight</span>
              <span className={`font-mono p-2 rounded ${Math.abs(policy.weight_location + policy.weight_developer_exp + policy.weight_presales + policy.weight_lvr + policy.weight_contingency - 1) < 0.001 ? "bg-positive-100 text-positive-800" : "bg-critical-100 text-critical-800"}`}>
                {((policy.weight_location + policy.weight_developer_exp + policy.weight_presales + policy.weight_lvr + policy.weight_contingency) * 100).toFixed(0)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
