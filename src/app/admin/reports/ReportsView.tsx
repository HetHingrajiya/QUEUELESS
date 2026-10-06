"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, FileText, Loader2, Eye, Trash2, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ReportsViewProps {
  title: string;
  reportType: string;
}

export default function ReportsView({ title, reportType }: ReportsViewProps) {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Report generation form
  const [showGenerate, setShowGenerate] = useState(false);
  const [genStart, setGenStart] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [genEnd, setGenEnd] = useState(new Date().toISOString().split('T')[0]);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (data.success) {
        const normalized = reportType === 'All'
          ? data.data
          : data.data.filter((r: any) => r.reportType === reportType.toUpperCase());
        setReports(normalized);
      } else {
        setError(data.message || 'Failed to load reports.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [reportType]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const generateReport = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: reportType === 'All' ? 'CUSTOM' : reportType.toUpperCase(),
          startDate: genStart,
          endDate: genEnd,
          name: `${reportType === 'All' ? 'Custom' : reportType} Report – ${genStart} to ${genEnd}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowGenerate(false);
        fetchReports();
      } else {
        alert(data.message || 'Failed to generate report.');
      }
    } catch {
      alert('Network error.');
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = async (reportId: string, reportName: string) => {
    setDownloading(reportId);
    try {
      const res = await fetch(`/api/reports/${reportId}?format=csv`);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportName.replace(/\s+/g, '_')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Download failed. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  const viewReport = async (reportId: string) => {
    try {
      const res = await fetch(`/api/reports/${reportId}`);
      const data = await res.json();
      if (data.success) {
        setSelectedReport(data.data);
      } else {
        alert(data.message || 'Failed to load report.');
      }
    } catch {
      alert('Failed to load report.');
    }
  };

  const deleteReport = async (reportId: string, reportName: string) => {
    if (!confirm(`Delete report "${reportName}"? This cannot be undone.`)) return;
    setDeleting(reportId);
    try {
      const res = await fetch(`/api/reports/${reportId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setReports(prev => prev.filter(r => r._id !== reportId));
      } else {
        alert(data.message || 'Delete failed.');
      }
    } catch {
      alert('Delete failed.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
          <p className="text-sm text-slate-500">Generate, view, download, and manage {title.toLowerCase()}.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchReports} size="sm">
            <RefreshCw size={14} className="mr-1" /> Refresh
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowGenerate(v => !v)} disabled={generating}>
            <FileText size={18} className="mr-2" />
            Generate {reportType !== 'All' ? reportType : 'New'} Report
          </Button>
        </div>
      </div>

      {/* Generate form */}
      {showGenerate && (
        <Card className="border-blue-200 bg-blue-50/40">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-slate-700 mb-3">Configure Report</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div className="space-y-1">
                <Label>Start Date</Label>
                <Input type="date" value={genStart} onChange={e => setGenStart(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>End Date</Label>
                <Input type="date" value={genEnd} onChange={e => setGenEnd(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button className="bg-blue-600 hover:bg-blue-700 text-sm" onClick={generateReport} disabled={generating}>
                {generating ? <><Loader2 size={14} className="mr-1 animate-spin" /> Generating...</> : 'Generate Report'}
              </Button>
              <Button variant="outline" className="text-sm" onClick={() => setShowGenerate(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 text-red-600 text-sm flex items-center justify-between">
            {error}
            <Button variant="ghost" size="sm" onClick={fetchReports}><RefreshCw size={14} className="mr-1" /> Retry</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Report Name</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Date Range</th>
                  <th className="px-6 py-4">Generated By</th>
                  <th className="px-6 py-4">Generated At</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      <Loader2 className="animate-spin inline mr-2" /> Loading reports...
                    </td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      No {reportType !== 'All' ? reportType.toLowerCase() : ''} reports generated yet.
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <tr key={report._id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900 flex items-center">
                        <FileText size={16} className="mr-2 text-slate-400 shrink-0" />
                        {report.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {report.reportType || report.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {report.dateRangeStart ? (
                          <>{new Date(report.dateRangeStart).toLocaleDateString()} → {new Date(report.dateRangeEnd).toLocaleDateString()}</>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {report.generatedBy?.fullName || report.generatedBy?.email || '—'}
                      </td>
                      <td className="px-6 py-4">{new Date(report.createdAt).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          report.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          report.status === 'FAILED' ? 'bg-red-50 text-red-700 border border-red-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>{report.status}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline" size="sm"
                            className="h-8 text-slate-700 hover:bg-slate-100"
                            onClick={() => viewReport(report._id)}
                          >
                            <Eye size={14} className="mr-1" /> View
                          </Button>
                          <Button
                            variant="outline" size="sm"
                            className="h-8 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                            disabled={downloading === report._id}
                            onClick={() => downloadReport(report._id, report.name)}
                          >
                            {downloading === report._id
                              ? <Loader2 size={14} className="mr-1 animate-spin" />
                              : <Download size={14} className="mr-1" />}
                            Download
                          </Button>
                          <Button
                            variant="outline" size="sm"
                            className="h-8 text-red-600 border-red-200 hover:bg-red-50"
                            disabled={deleting === report._id}
                            onClick={() => deleteReport(report._id, report.name)}
                          >
                            {deleting === report._id
                              ? <Loader2 size={14} className="mr-1 animate-spin" />
                              : <Trash2 size={14} className="mr-1" />}
                            Delete
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

      {/* Real Report Viewer Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5 text-blue-600" />
              {selectedReport?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedReport?.dateRangeStart && (
                <>
                  {new Date(selectedReport.dateRangeStart).toLocaleDateString()} – {new Date(selectedReport.dateRangeEnd).toLocaleDateString()}
                  {' · '}
                </>
              )}
              Generated on {selectedReport && new Date(selectedReport.createdAt).toLocaleString()}
              {selectedReport?.generatedBy?.fullName && ` by ${selectedReport.generatedBy.fullName}`}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto bg-slate-50 border border-slate-200 rounded-md p-6 mt-4 space-y-6">
            {!selectedReport?.summaryData ? (
              <div className="text-center text-slate-500 py-12">No data available for this report.</div>
            ) : (
              <>
                {/* Summary */}
                <div>
                  <h3 className="font-semibold text-slate-800 mb-3 text-sm uppercase tracking-wide">Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Total Tokens', value: selectedReport.summaryData.total },
                      { label: 'Completed', value: selectedReport.summaryData.completed },
                      { label: 'Waiting', value: selectedReport.summaryData.waiting },
                      { label: 'No-Show', value: selectedReport.summaryData.noShow },
                      { label: 'Skipped', value: selectedReport.summaryData.skipped },
                      { label: 'Cancelled', value: selectedReport.summaryData.cancelled },
                      { label: 'Avg Wait', value: `${selectedReport.summaryData.avgWaitMin} min` },
                      { label: 'Avg Service', value: `${selectedReport.summaryData.avgServiceMin} min` },
                      { label: 'Completion Rate', value: `${selectedReport.summaryData.completionRate}%` },
                      { label: 'No-show Rate', value: `${selectedReport.summaryData.noShowRate}%` },
                    ].map((item, i) => (
                      <div key={i} className="bg-white rounded border border-slate-100 p-3">
                        <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                        <p className="font-bold text-slate-800 text-lg">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Office Breakdown */}
                {selectedReport.officeBreakdown?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-3 text-sm uppercase tracking-wide">Office Breakdown</h3>
                    <table className="w-full text-sm text-left border border-slate-200 rounded">
                      <thead className="bg-slate-100 text-slate-600 text-xs uppercase">
                        <tr>
                          <th className="px-4 py-2">Office</th>
                          <th className="px-4 py-2">Total</th>
                          <th className="px-4 py-2">Completed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedReport.officeBreakdown.map((o: any, i: number) => (
                          <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-2">{o.name || 'N/A'}</td>
                            <td className="px-4 py-2">{o.total}</td>
                            <td className="px-4 py-2">{o.completed}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Service Breakdown */}
                {selectedReport.serviceBreakdown?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-3 text-sm uppercase tracking-wide">Service Breakdown</h3>
                    <table className="w-full text-sm text-left border border-slate-200 rounded">
                      <thead className="bg-slate-100 text-slate-600 text-xs uppercase">
                        <tr>
                          <th className="px-4 py-2">Service</th>
                          <th className="px-4 py-2">Total</th>
                          <th className="px-4 py-2">Completed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedReport.serviceBreakdown.map((s: any, i: number) => (
                          <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-2">{s.name || 'N/A'}</td>
                            <td className="px-4 py-2">{s.total}</td>
                            <td className="px-4 py-2">{s.completed}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <Button variant="outline" onClick={() => setSelectedReport(null)}>Close</Button>
            {selectedReport && (
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                disabled={downloading === selectedReport._id}
                onClick={() => downloadReport(selectedReport._id, selectedReport.name)}
              >
                {downloading === selectedReport._id
                  ? <Loader2 size={14} className="mr-1 animate-spin" />
                  : <Download size={14} className="mr-1" />}
                Download CSV
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
