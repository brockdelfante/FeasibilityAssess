"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Search, Loader2, Building2, TrendingUp, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** The columns this dashboard reads. The API returns more; these are the ones rendered. */
interface DealRow {
  id: string;
  project_address?: string | null;
  customer_group?: string | null;
  status?: string | null;
  deal_type?: string | null;
  calc_roc?: number | string | null;
  calc_lvr_gross?: number | string | null;
  calc_risk_grade?: string | null;
  calc_covenant_breach?: boolean | null;
  updated_at: string;
}

export default function Dashboard() {
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // A failed fetch used to be indistinguishable from an empty portfolio: the
  // response was not an array, so the table rendered "no assessments" and the
  // stat tiles read zero. That is the worst possible failure mode for a
  // dashboard — it reports "nothing here" when the truth is "we could not
  // look". Surface the failure instead.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/deals")
      .then(async (res) => {
        if (!res.ok) throw new Error(`The server returned ${res.status}.`);
        const data: unknown = await res.json();
        if (!Array.isArray(data)) throw new Error("The server returned an unexpected response.");
        return data as DealRow[];
      })
      .then((data) => {
        if (cancelled) return;
        setDeals(data);
        setError(null);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const hasFilters = search !== "" || statusFilter !== "all" || typeFilter !== "all";

  const filteredDeals = deals.filter(d => {
    const matchesSearch = d.project_address?.toLowerCase().includes(search.toLowerCase()) ||
                         d.customer_group?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    const matchesType = typeFilter === "all" || d.deal_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const avgROC = deals.length > 0 ? deals.reduce((s, d) => s + (Number(d.calc_roc) || 0), 0) / deals.length : 0;
  const avgLVR = deals.length > 0 ? deals.reduce((s, d) => s + (Number(d.calc_lvr_gross) || 0), 0) / deals.length : 0;
  const breachCount = deals.filter(d => d.calc_covenant_breach).length;

  const formatPercent = (val: number | string | null | undefined) =>
    val ? (Number(val) * 100).toFixed(1) + '%' : '0.0%';

  return (
    <div className="flex-1 space-y-4 p-6 lg:p-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Portfolio Overview</h2>
            <p className="text-muted-foreground">Manage and track property development feasibility assessments.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild className="shadow-sm">
            <Link href="/deals/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Assessment
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Total Assessments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{deals.length}</div></CardContent>
        </Card>
        <Card className="shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Average ROC</CardTitle>
            <TrendingUp className="h-4 w-4 text-positive-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-positive-600">{formatPercent(avgROC)}</div></CardContent>
        </Card>
        <Card className="shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Average LVR</CardTitle>
            <div className="h-2 w-2 rounded-full bg-brand-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-brand-600">{formatPercent(avgLVR)}</div></CardContent>
        </Card>
        <Card className="shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Policy Breaches</CardTitle>
            <AlertTriangle className="h-4 w-4 text-critical-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-critical-600">{breachCount}</div></CardContent>
        </Card>
      </div>

      <div className="space-y-4 pt-4">
        <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search project or customer..."
                className="pl-10 h-10 bg-background"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 h-10 bg-background">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40 h-10 bg-background">
                    <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="subdivision">Subdivision</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <div className="rounded-xl border bg-background shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="text-[11px] uppercase tracking-wider font-bold">
                <TableHead className="w-[300px]">Project / Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">ROC</TableHead>
                <TableHead className="text-right">LVR (Gross)</TableHead>
                <TableHead>Risk Grade</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right pr-8">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground font-medium"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading portfolio data...</TableCell></TableRow>
              ) : error ? (
                <TableRow><TableCell colSpan={7} className="h-40 text-center">
                  <AlertTriangle className="h-6 w-6 mx-auto mb-3 text-critical-500" />
                  <p className="font-semibold text-foreground">We could not load your portfolio</p>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={() => window.location.reload()}>
                    Try again
                  </Button>
                </TableCell></TableRow>
              ) : deals.length === 0 ? (
                // A first-run user and a user whose filters exclude everything
                // need different things: one needs a way in, the other needs to
                // know it is the filters, not the data.
                <TableRow><TableCell colSpan={7} className="h-40 text-center">
                  <Building2 className="h-6 w-6 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="font-semibold text-foreground">No assessments yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Run a feasibility to see it here, or start a full deal assessment.</p>
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Button asChild size="sm">
                      <Link href="/feasibility">Run a feasibility</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/deals/new">New deal</Link>
                    </Button>
                  </div>
                </TableCell></TableRow>
              ) : filteredDeals.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-40 text-center">
                  <Search className="h-6 w-6 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="font-semibold text-foreground">No assessments match these filters</p>
                  <p className="text-sm text-muted-foreground mt-1">{deals.length} assessment{deals.length === 1 ? "" : "s"} are hidden by your search or filters.</p>
                  {hasFilters ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => { setSearch(""); setStatusFilter("all"); setTypeFilter("all"); }}
                    >
                      Clear filters
                    </Button>
                  ) : null}
                </TableCell></TableRow>
              ) : filteredDeals.map((deal) => (
                <TableRow key={deal.id} className="cursor-pointer hover:bg-brand-50/30 transition-colors group border-b last:border-0">
                  <TableCell className="py-4">
                    <Link href={`/deals/${deal.id}/edit`} className="block">
                        <div className="flex items-center text-[14px] font-bold text-foreground group-hover:text-brand-700 transition-colors">
                            {deal.project_address || "Unnamed Site"}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-medium mt-1 flex items-center">
                            {deal.customer_group || "Private Individual"}
                        </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={deal.status === 'draft' ? "outline" : "default"} className={`capitalize text-[10px] px-2 py-0 ${deal.status === 'draft' ? 'text-muted-foreground border-border' : 'bg-brand-600'}`}>
                      {deal.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-muted-foreground">{formatPercent(deal.calc_roc)}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-muted-foreground">{formatPercent(deal.calc_lvr_gross)}</TableCell>
                  <TableCell>
                    {deal.calc_risk_grade ? (
                        <Badge className="bg-positive-50 text-positive-700 border-positive-200 text-[10px] hover:bg-positive-50">{deal.calc_risk_grade}</Badge>
                    ) : <span className="text-muted-foreground/40">—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="uppercase text-[9px] font-black tracking-tighter bg-muted text-muted-foreground border-0">{deal.deal_type}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-[11px] text-muted-foreground pr-8">
                    {new Date(deal.updated_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
