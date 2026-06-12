"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Search, Filter, Loader2, MapPin, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Dashboard() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/deals")
      .then(res => res.json())
      .then(data => {
        setDeals(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  }, []);

  const filteredDeals = deals.filter(d =>
    d.project_address?.toLowerCase().includes(search.toLowerCase()) ||
    d.customer_group?.toLowerCase().includes(search.toLowerCase())
  );

  const formatPercent = (val: any) => val ? (Number(val) * 100).toFixed(1) + '%' : '-';

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Siare Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/deals/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Deal
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Active Deals</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{deals.length}</div></CardContent>
        </Card>
        {/* Simplified stats for now */}
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by address or group..."
                className="pl-8"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
        </div>

        <div className="rounded-md border bg-white overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Project / Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">ROC</TableHead>
                <TableHead className="text-right">LVR (Gross)</TableHead>
                <TableHead>Risk Grade</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                        <div className="flex justify-center items-center"><Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading assessments...</div>
                    </TableCell>
                </TableRow>
              ) : filteredDeals.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No assessments found.</TableCell>
                </TableRow>
              ) : filteredDeals.map((deal) => (
                <TableRow key={deal.id} className="cursor-pointer hover:bg-gray-50 group">
                  <TableCell className="font-medium">
                    <Link href={`/deals/${deal.id}/edit`} className="block">
                        <div className="flex items-center text-blue-600 group-hover:underline">
                            <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                            {deal.project_address || "Untitled Project"}
                        </div>
                        <div className="text-xs text-gray-500 font-normal mt-1 flex items-center">
                            <Building2 className="h-3 w-3 mr-1" />
                            {deal.customer_group || "No Customer Group"}
                        </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={deal.status === 'draft' ? "outline" : "default"} className="capitalize">
                      {deal.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">{formatPercent(deal.calc_roc)}</TableCell>
                  <TableCell className="text-right font-mono">{formatPercent(deal.calc_lvr_gross)}</TableCell>
                  <TableCell>
                    {deal.calc_risk_grade ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200">{deal.calc_risk_grade}</Badge>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="uppercase text-[10px]">{deal.deal_type}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {new Date(deal.updated_at).toLocaleDateString()}
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
