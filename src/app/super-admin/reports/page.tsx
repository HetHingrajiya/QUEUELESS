"use client";

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Calendar, Loader2, Eye } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type BreakdownRow = { name?: string; day?: string; total?: number; completed?: number; count?: number };
type ReportRecord = {
  _id: string;
  name: string;
  type: string;
  reportType?: string;
  createdAt: string;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  status?: string;
  summaryData?: Record<string, string | number>;
  officeBreakdown?: BreakdownRow[];
  serviceBreakdown?: BreakdownRow[];
  dailyBreakdown?: BreakdownRow[];
};

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? '' : String(value);
  return '"' + text.replace(/"/g, '""') + '"';
}

function createReportCsv(report: ReportRecord) {
  const rows: unknown[][] = [
    ['SamaySetu System Report'],
    ['Report Name', report.name],
    ['Report Type', report.reportType || 'CUSTOM'],
    ['Generated At', new Date(report.createdAt).toISOString()],
    ['Period Start', report.dateRangeStart ? new Date(report.dateRangeStart).toISOString() : ''],
    ['Period End', report.dateRangeEnd ? new Date(report.dateRangeEnd).toISOString() : ''],
    ['Status', report.status || 'UNKNOWN'],
    [],
    ['Summary Metric', 'Value'],
    ...Object.entries(report.summaryData || {}),
    [],
    ['Office Breakdown'],
    ['Office', 'Total Tokens', 'Completed Tokens'],
    ...(report.officeBreakdown || []).map((row) => [row.name || 'Unknown office', row.total ?? 0, row.completed ?? 0]),
    [],
    ['Service Breakdown'],
    ['Service', 'Total Tokens', 'Completed Tokens'],
    ...(report.serviceBreakdown || []).map((row) => [row.name || 'Unknown service', row.total ?? 0, row.completed ?? 0]),
    [],
    ['Daily Breakdown'],
    ['Date', 'Token Count'],
    ...(report.dailyBreakdown || []).map((row) => [row.day || '', row.count ?? 0]),
  ];
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
}

function downloadReport(report: ReportRecord) {
  const blob = new Blob([createReportCsv(report)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${report.name.replace(/[^a-z0-9-_]+/gi, '_') || 'samaysetu_report'}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState<ReportRecord | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/reports', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Unable to load reports.');
      setReports(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load reports.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchReports(); }, [fetchReports]);

  const generateReport = async () => {
    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `System Overview ${new Date().toISOString().slice(0, 10)}`,
          reportType: 'CUSTOM',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Report generation failed.');
      await fetchReports();
      if (data.data) setSelectedReport(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Report generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const visibleReports = typeFilter === 'all'
    ? reports
    : reports.filter((report) => (report.reportType || 'CUSTOM').toLowerCase() === typeFilter);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Generated Reports</h2>
          <p className="text-sm text-slate-500">Reports generated from actual SamaySetu token, office, and service records.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={generateReport} disabled={generating}>
          {generating ? <Loader2 size={18} className="mr-2 animate-spin" /> : <FileText size={18} className="mr-2" />}
          Generate Custom Report
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value ?? 'all')}>
          <SelectTrigger className="w-[220px] bg-white"><SelectValue placeholder="Report Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Report Types</SelectItem>
            <SelectItem value="daily">Daily Summaries</SelectItem>
            <SelectItem value="weekly">Weekly Analysis</SelectItem>
            <SelectItem value="monthly">Monthly Reviews</SelectItem>
            <SelectItem value="custom">Custom Reports</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 text-sm text-slate-500"><Calendar size={16} /> Date range is shown for each generated report.</div>
      </div>

      {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <Card><CardContent className="p-0">
        <div className="min-h-[300px] overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-700">
              <tr><th className="px-6 py-4">Report Name</th><th className="px-6 py-4">Type / Format</th><th className="px-6 py-4">Generated</th><th className="px-6 py-4">Reporting Period</th><th className="px-6 py-4 text-right">Actions</th></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">Loading reports from database...</td></tr>
                : visibleReports.length === 0 ? <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">{error ? 'Reports could not be loaded.' : 'No saved reports for this filter. Generate a report to calculate one from current database records.'}</td></tr>
                : visibleReports.map((report) => <tr key={report._id} className="border-b border-slate-100 bg-white hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900"><span className="flex items-center"><FileText size={16} className="mr-2 text-slate-400" />{report.name}</span></td>
                  <td className="px-6 py-4"><span className="rounded border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{report.reportType || 'CUSTOM'} / CSV</span></td>
                  <td className="px-6 py-4">{new Date(report.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4">{report.dateRangeStart && report.dateRangeEnd ? `${new Date(report.dateRangeStart).toLocaleDateString()} – ${new Date(report.dateRangeEnd).toLocaleDateString()}` : 'Not recorded'}</td>
                  <td className="px-6 py-4"><div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" className="h-8" onClick={() => setSelectedReport(report)}><Eye size={14} className="mr-1" /> View Data</Button>
                    <Button variant="outline" size="sm" className="h-8 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100" onClick={() => downloadReport(report)}><Download size={14} className="mr-1" /> Download CSV</Button>
                  </div></td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </CardContent></Card>

      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center"><FileText className="mr-2 h-5 w-5 text-blue-600" />{selectedReport?.name}</DialogTitle>
            <DialogDescription>
              Actual stored report data · {selectedReport?.dateRangeStart ? new Date(selectedReport.dateRangeStart).toLocaleDateString() : 'Period not recorded'} – {selectedReport?.dateRangeEnd ? new Date(selectedReport.dateRangeEnd).toLocaleDateString() : 'Period not recorded'}
            </DialogDescription>
          </DialogHeader>
          {selectedReport && <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {Object.entries(selectedReport.summaryData || {}).map(([key, value]) => <div key={key} className="rounded border border-slate-200 bg-slate-50 p-3"><div className="text-xs capitalize text-slate-500">{key.replace(/([A-Z])/g, ' $1')}</div><div className="mt-1 text-xl font-semibold text-slate-900">{value}</div></div>)}
              {Object.keys(selectedReport.summaryData || {}).length === 0 && <p className="col-span-full text-sm text-slate-500">This saved report has no summary data. Generate a new report to calculate current database metrics.</p>}
            </div>
            {([
              ['Office Breakdown', selectedReport.officeBreakdown || []],
              ['Service Breakdown', selectedReport.serviceBreakdown || []],
              ['Daily Breakdown', selectedReport.dailyBreakdown || []],
            ] as [string, BreakdownRow[]][]).map(([title, rows]) => <section key={title} className="space-y-2">
              <h3 className="font-semibold text-slate-800">{title}</h3>
              {rows.length === 0 ? <p className="text-sm text-slate-500">No records for this section in the selected reporting period.</p> : <div className="overflow-x-auto rounded border border-slate-200"><table className="w-full text-left text-sm"><thead className="bg-slate-50"><tr><th className="px-3 py-2">Name / Date</th><th className="px-3 py-2">Total</th><th className="px-3 py-2">Completed</th></tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.name || row.day || 'row'}-${index}`} className="border-t border-slate-100"><td className="px-3 py-2">{row.name || row.day || '—'}</td><td className="px-3 py-2">{row.total ?? row.count ?? 0}</td><td className="px-3 py-2">{row.completed ?? '—'}</td></tr>)}</tbody></table></div>}
            </section>)}
            <div className="flex justify-end"><Button onClick={() => downloadReport(selectedReport)}><Download size={16} className="mr-2" /> Download actual report data (CSV)</Button></div>
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
