"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Calendar, Loader2, Eye, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (data.success) {
        setReports(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `System Overview ${new Date().toISOString().split('T')[0]}`,
          type: 'PDF'
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReports([data.data, ...reports]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Generated Reports</h2>
          <p className="text-sm text-slate-500">Download and manage scheduled system reports.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={generateReport} disabled={generating}>
          {generating ? <Loader2 size={18} className="mr-2 animate-spin" /> : <FileText size={18} className="mr-2" />}
          Generate Custom Report
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <Select defaultValue="all">
          <SelectTrigger className="w-[200px] bg-white"><SelectValue placeholder="Report Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="daily">Daily Summaries</SelectItem>
            <SelectItem value="weekly">Weekly Analysis</SelectItem>
            <SelectItem value="monthly">Monthly Reviews</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="bg-white">
          <Calendar size={16} className="mr-2 text-slate-500" />
          Select Date Range
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-4">Report Name</th>
                  <th scope="col" className="px-6 py-4">Format</th>
                  <th scope="col" className="px-6 py-4">Generated Date</th>
                  <th scope="col" className="px-6 py-4">Size</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">Loading reports...</td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">No reports generated yet.</td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <tr key={report._id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900 flex items-center">
                        <FileText size={16} className="mr-2 text-slate-400" />
                        {report.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {report.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">{new Date(report.createdAt).toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-500">{report.fileSize}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-slate-700 hover:bg-slate-100"
                            onClick={() => setSelectedReport(report)}
                          >
                            <Eye size={14} className="mr-1" /> View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                            onClick={() => {
                              // Create a mock CSV instead of PDF so the browser doesn't try to open an invalid PDF
                              const csvContent = `Report Name,Generated Date,Status\n"${report.name}","${new Date(report.createdAt).toLocaleString()}","${report.status || 'COMPLETED'}"`;
                              const link = document.createElement('a');
                              link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
                              link.download = `${report.name.replace(/\s+/g, '_')}.csv`;
                              link.click();
                            }}
                          >
                            <Download size={14} className="mr-1" /> Download
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Report Viewer Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5 text-blue-600" />
              {selectedReport?.name}
            </DialogTitle>
            <DialogDescription>
              Generated on {selectedReport && new Date(selectedReport.createdAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto bg-slate-50 border border-slate-200 rounded-md p-8 mt-4">
            {/* Mock Report Content */}
            <div className="max-w-2xl mx-auto bg-white p-8 shadow-sm border border-slate-100 min-h-full">
              <div className="border-b border-slate-200 pb-4 mb-6">
                <h1 className="text-3xl font-serif text-slate-900 mb-2">QueueLess System Report</h1>
                <p className="text-slate-500">{selectedReport?.name}</p>
              </div>
              
              <div className="space-y-6 text-slate-700">
                <p>This is a system-generated report containing aggregated overview data for the entire QueueLess platform.</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded border border-slate-100">
                    <span className="block text-sm text-slate-500 mb-1">Status</span>
                    <span className="font-semibold text-emerald-600">{selectedReport?.status || 'COMPLETED'}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded border border-slate-100">
                    <span className="block text-sm text-slate-500 mb-1">Format</span>
                    <span className="font-semibold">{selectedReport?.type}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded border border-slate-100">
                    <span className="block text-sm text-slate-500 mb-1">File Size</span>
                    <span className="font-semibold">{selectedReport?.fileSize}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded border border-slate-100">
                    <span className="block text-sm text-slate-500 mb-1">Report ID</span>
                    <span className="font-semibold text-xs">{selectedReport?._id}</span>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-200 text-sm text-slate-500 text-center">
                  <p>CONFIDENTIAL AND PROPRIETARY</p>
                  <p>QueueLess System</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
