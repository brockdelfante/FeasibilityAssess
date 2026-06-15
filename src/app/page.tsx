"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Search, Filter, Loader2, MapPin, Building2, TrendingUp, AlertTriangle, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Dashboard() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    fetch("/api/deals")
      .then(res => res.json())
      .then(data => {
        setDeals(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

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

  const formatPercent = (val: any) => val ? (Number(val) * 100).toFixed(1) + '%' : '0.0%';

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between space-y-2">
        <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Portfolio Overview</h2>
            <p className="text-gray-500">Manage and track property development feasibility assessments.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild className="bg-blue-600 shadow-md hover:bg-blue-700 text-white">
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
            <CardTitle className="text-xs font-bold uppercase text-gray-400">Total Assessments</CardTitle>
            <Building2 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{deals.length}</div></CardContent>
        </Card>
        <Card className="shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase text-gray-400">Average ROC</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{formatPercent(avgROC)}</div></CardContent>
        </Card>
        <Card className="shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase text-gray-400">Average LVR</CardTitle>
            <div className="h-2 w-2 rounded-full bg-blue-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-600">{formatPercent(avgLVR)}</div></CardContent>
        </Card>
        <Card className="shadow-sm border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase text-gray-400">Policy Breaches</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{breachCount}</div></CardContent>
        </Card>
      </div>

      <div className="space-y-4 pt-4">
        <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search project or customer..."
                className="pl-10 h-10 shadow-sm bg-white"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 h-10 bg-white">
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
                <SelectTrigger className="w-40 h-10 bg-white">
                    <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="subdivision">Subdivision</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50/50">
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
                <TableRow><TableCell colSpan={7} className="h-32 text-center text-gray-400 font-medium"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading portfolio data...</TableCell></TableRow>
              ) : filteredDeals.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-32 text-center text-gray-400 italic">No assessments match your current filters.</TableCell></TableRow>
              ) : filteredDeals.map((deal) => (
                <TableRow key={deal.id} className="cursor-pointer hover:bg-blue-50/30 transition-colors group border-b last:border-0">
                  <TableCell className="py-4">
                    <Link href={`/deals/${deal.id}/edit`} className="block">
                        <div className="flex items-center text-[14px] font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                            {deal.project_address || "Unnamed Site"}
                        </div>
                        <div className="text-[11px] text-gray-500 font-medium mt-1 flex items-center">
                            {deal.customer_group || "Private Individual"}
                        </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={deal.status === 'draft' ? "outline" : "default"} className={`capitalize text-[10px] px-2 py-0 ${deal.status === 'draft' ? 'text-gray-400 border-gray-200' : 'bg-blue-600'}`}>
                      {deal.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-gray-700">{formatPercent(deal.calc_roc)}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-gray-700">{formatPercent(deal.calc_lvr_gross)}</TableCell>
                  <TableCell>
                    {deal.calc_risk_grade ? (
                        <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px] hover:bg-green-50">{deal.calc_risk_grade}</Badge>
                    ) : <span className="text-gray-300">—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="uppercase text-[9px] font-black tracking-tighter bg-gray-100 text-gray-500 border-0">{deal.deal_type}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-[11px] text-gray-400 pr-8">
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
