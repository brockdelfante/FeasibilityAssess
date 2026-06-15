"use client";

import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Code, Terminal, ChevronRight, Activity, Clock, ShieldCheck, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";

interface ApiLog {
  id: string;
  endpoint: string;
  status_code: number;
  created_at: string;
  request_payload: any;
  response_payload: any;
}

export function ApiLogSheet({ dealId }: { dealId: string }) {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/deals/${dealId}/api-logs`);
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" onClick={fetchLogs} className="bg-white border-gray-200 font-bold text-[11px] uppercase tracking-widest shadow-sm">
          <Terminal className="h-4 w-4 mr-2 text-blue-600" />
          Logs
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[600px] sm:w-[800px] overflow-hidden flex flex-col border-l-4 border-l-gray-900 bg-white">
        <SheetHeader className="border-b pb-6 shrink-0">
          <SheetTitle className="flex items-center font-black uppercase tracking-tighter text-2xl text-gray-900">
            <Activity className="h-6 w-6 mr-3 text-blue-600" />
            API Traffic Monitor
          </SheetTitle>
          <SheetDescription className="font-medium text-gray-500">Real-time inspection of 3rd party API calls and responses.</SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 mt-6">
            <div className="space-y-4 pb-20 px-1">
                {logs.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest italic">No API traffic recorded yet.</p>
                    </div>
                ) : (
                    <Accordion type="multiple" className="space-y-4">
                        {logs.map((log) => (
                            <AccordionItem key={log.id} value={log.id} className="border rounded-xl bg-white shadow-sm overflow-hidden border-gray-100">
                                <AccordionTrigger className="hover:no-underline px-6 py-4">
                                    <div className="flex items-center justify-between w-full pr-6">
                                        <div className="flex items-center space-x-4">
                                            {log.status_code < 300 ? <ShieldCheck className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                                            <div className="text-left">
                                                <p className="text-[11px] font-black uppercase text-gray-900 tracking-tight">{log.endpoint}</p>
                                                <p className="text-[10px] text-gray-400 font-medium">{new Date(log.created_at).toLocaleTimeString()}</p>
                                            </div>
                                        </div>
                                        <Badge variant={log.status_code < 300 ? "secondary" : "destructive"} className="text-[10px] font-mono px-2 py-0">
                                            {log.status_code}
                                        </Badge>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-6 pb-6">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Request Payload</Label>
                                            <pre className="bg-gray-900 text-blue-300 p-4 rounded-xl text-[11px] font-mono overflow-auto max-h-40">
                                                {JSON.stringify(log.request_payload, null, 2)}
                                            </pre>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Response Body</Label>
                                            <pre className="bg-gray-900 text-green-300 p-4 rounded-xl text-[11px] font-mono overflow-auto max-h-[400px]">
                                                {JSON.stringify(log.response_payload, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
