"use client";

import { useCallback, useEffect, useState } from 'react';
import { Download, FileText, Calendar, Loader2, Eye, FilePieChart, BarChart3, TrendingUp, PieChart } from 'lucide-react';
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
    <div className="space-y-6 lg:space-y-8 pb-20 max-w-6xl mx-auto pt-4 cursor-default">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-8 px-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Generated Reports</h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-semibold mt-1">Reports generated from actual SamaySetu token, office, and service records.</p>
        </div>
        
        <button 
          onClick={generateReport} 
          disabled={generating}
          className="h-12 px-6 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-2xl text-xs uppercase font-black tracking-widest text-primary flex items-center justify-center transition-all border-0 disabled:opacity-50"
        >
          {generating ? <Loader2 size={18} className="mr-2 animate-spin" /> : <FilePieChart size={18} className="mr-2" />}
          Generate Custom Report
        </button>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 space-y-6">
         
         {/* Filter Bar */}
         <div className="bg-background shadow-neu rounded-[2rem] p-4 flex flex-col md:flex-row items-center gap-4 border-0">
            <div className="w-full md:w-64">
               <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value ?? 'all')}>
                  <SelectTrigger className="w-full h-12 pl-4 pr-4 bg-background shadow-neu-inset rounded-2xl text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all border-0">
                     <SelectValue placeholder="Report Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-background shadow-neu border-0 rounded-2xl">
                     <SelectItem value="all" className="text-xs font-bold focus:bg-primary/5 cursor-pointer rounded-xl my-1">All Report Types</SelectItem>
                     <SelectItem value="daily" className="text-xs font-bold focus:bg-primary/5 cursor-pointer rounded-xl my-1">Daily Summaries</SelectItem>
                     <SelectItem value="weekly" className="text-xs font-bold focus:bg-primary/5 cursor-pointer rounded-xl my-1">Weekly Analysis</SelectItem>
                     <SelectItem value="monthly" className="text-xs font-bold focus:bg-primary/5 cursor-pointer rounded-xl my-1">Monthly Reviews</SelectItem>
                     <SelectItem value="custom" className="text-xs font-bold focus:bg-primary/5 cursor-pointer rounded-xl my-1">Custom Reports</SelectItem>
                  </SelectContent>
               </Select>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest bg-background shadow-neu-inset px-4 h-12 rounded-2xl w-full md:w-auto">
               <Calendar size={14} className="text-primary shrink-0" />
               Date range is shown for each generated report
            </div>
         </div>

         {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-bold flex items-center justify-center">
               {error}
            </div>
         )}

         {/* Desktop Table View */}
         <div className="hidden lg:block bg-background shadow-neu rounded-[2.5rem] p-6 sm:p-10 border-0">
            <div className="w-full overflow-x-auto custom-scrollbar pb-4 min-h-[400px]">
               <table className="w-full text-left">
                  <thead>
                     <tr>
                     <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap">Report Name</th>
                     <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap">Type / Format</th>
                     <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap">Generated</th>
                     <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap">Reporting Period</th>
                     <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 text-right whitespace-nowrap">Actions</th>
                     </tr>
                  </thead>
                  <tbody>
                     {loading ? (
                     <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground font-bold text-sm">Loading reports from database...</td>
                     </tr>
                     ) : visibleReports.length === 0 ? (
                     <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground font-bold text-sm">
                           {error ? 'Reports could not be loaded.' : 'No saved reports for this filter. Generate a report to calculate one.'}
                        </td>
                     </tr>
                     ) : (
                     visibleReports.map((report) => (
                        <tr key={report._id} className="group hover:bg-primary/5 transition-colors">
                           <td className="px-6 py-5 border-b border-primary/5 transition-all">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-xl bg-background shadow-neu-inset flex items-center justify-center text-primary shrink-0">
                                    <FileText size={16} />
                                 </div>
                                 <span className="font-black text-sm text-foreground whitespace-nowrap">{report.name}</span>
                              </div>
                           </td>
                           <td className="px-6 py-5 border-b border-primary/5 transition-all">
                              <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-background shadow-neu-inset text-blue-500 whitespace-nowrap">
                                 {report.reportType || 'CUSTOM'} / CSV
                              </span>
                           </td>
                           <td className="px-6 py-5 border-b border-primary/5 transition-all">
                              <span className="font-mono text-xs font-bold text-slate-500 whitespace-nowrap bg-background shadow-neu-inset px-3 py-1.5 rounded-xl">
                                 {new Date(report.createdAt).toLocaleString()}
                              </span>
                           </td>
                           <td className="px-6 py-5 border-b border-primary/5 transition-all font-semibold text-muted-foreground text-sm">
                              {report.dateRangeStart && report.dateRangeEnd 
                                 ? `${new Date(report.dateRangeStart).toLocaleDateString()} – ${new Date(report.dateRangeEnd).toLocaleDateString()}` 
                                 : 'Not recorded'}
                           </td>
                           <td className="px-6 py-5 border-b border-primary/5 transition-all text-right">
                              <div className="flex justify-end gap-3">
                                 <button 
                                    onClick={() => setSelectedReport(report)}
                                    className="w-10 h-10 flex items-center justify-center bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-xl transition-all border-0 text-slate-500 hover:text-primary" 
                                    title="View Data"
                                 >
                                    <Eye size={16} />
                                 </button>
                                 <button 
                                    onClick={() => downloadReport(report)}
                                    className="w-10 h-10 flex items-center justify-center bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-xl transition-all border-0 text-blue-500 hover:text-blue-600" 
                                    title="Download CSV"
                                 >
                                    <Download size={16} />
                                 </button>
                              </div>
                           </td>
                        </tr>
                     ))
                     )}
                  </tbody>
               </table>
            </div>
         </div>

         {/* Mobile/Tablet Card View */}
         <div className="lg:hidden w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
               {loading ? (
                  <div className="col-span-1 md:col-span-2 py-12 text-center text-muted-foreground font-bold text-sm bg-background shadow-neu-inset rounded-[2rem]">Loading reports from database...</div>
               ) : visibleReports.length === 0 ? (
                  <div className="col-span-1 md:col-span-2 py-12 text-center text-muted-foreground font-bold text-sm bg-background shadow-neu-inset rounded-[2rem]">
                     {error ? 'Reports could not be loaded.' : 'No saved reports for this filter. Generate a report to calculate one.'}
                  </div>
               ) : (
                  visibleReports.map((report) => (
                  <div key={report._id} className="bg-background shadow-neu rounded-3xl p-5 flex flex-col gap-4 border border-primary/5 relative overflow-hidden w-full">
                     <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                           <div className="w-10 h-10 rounded-xl bg-background shadow-neu-inset flex items-center justify-center text-primary shrink-0">
                              <FileText size={16} />
                           </div>
                           <div className="min-w-0">
                              <h3 className="font-black text-[13px] text-foreground truncate">{report.name}</h3>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[11px] font-bold text-muted-foreground truncate">
                                 <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-background shadow-neu-inset text-blue-500 whitespace-nowrap">
                                    {report.reportType || 'CUSTOM'} / CSV
                                 </span>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="h-px w-full bg-primary/5"></div>

                     <div className="flex flex-col gap-2 min-w-0">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
                           <span className="font-mono bg-background shadow-neu-inset px-2 py-1 rounded text-slate-500">
                              {new Date(report.createdAt).toLocaleString()}
                           </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
                           <Calendar size={12} className="text-slate-400 shrink-0" />
                           <span className="truncate">
                              {report.dateRangeStart && report.dateRangeEnd 
                                 ? `${new Date(report.dateRangeStart).toLocaleDateString()} – ${new Date(report.dateRangeEnd).toLocaleDateString()}` 
                                 : 'Not recorded'}
                           </span>
                        </div>
                     </div>

                     <div className="h-px w-full bg-primary/5"></div>

                     <div className="flex justify-end gap-3">
                        <button 
                           onClick={() => setSelectedReport(report)}
                           className="h-10 px-4 flex items-center justify-center bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-xl transition-all border-0 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary" 
                        >
                           <Eye size={14} className="mr-2" /> View
                        </button>
                        <button 
                           onClick={() => downloadReport(report)}
                           className="h-10 px-4 flex items-center justify-center bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-xl transition-all border-0 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-600" 
                        >
                           <Download size={14} className="mr-2" /> CSV
                        </button>
                     </div>
                  </div>
                  ))
               )}
            </div>
         </div>
      </div>

      <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto bg-background border-0 shadow-2xl rounded-[2rem] p-6 sm:p-10">
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-background shadow-neu-inset rounded-2xl flex items-center justify-center text-primary shrink-0">
                  <PieChart size={20} />
               </div>
               <div>
                  <DialogTitle className="text-xl font-black text-foreground">{selectedReport?.name}</DialogTitle>
                  <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">
                     Actual stored report data · {selectedReport?.dateRangeStart ? new Date(selectedReport.dateRangeStart).toLocaleDateString() : 'Period not recorded'} – {selectedReport?.dateRangeEnd ? new Date(selectedReport.dateRangeEnd).toLocaleDateString() : 'Period not recorded'}
                  </DialogDescription>
               </div>
            </div>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-8">
               
               {/* Summary Cards */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  {Object.entries(selectedReport.summaryData || {}).map(([key, value]) => (
                     <div key={key} className="bg-background shadow-neu rounded-[1.5rem] p-5 flex flex-col items-center text-center justify-center">
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                           {key.replace(/([A-Z])/g, ' $1')}
                        </div>
                        <div className="text-2xl font-black text-foreground">
                           {value}
                        </div>
                     </div>
                  ))}
                  {Object.keys(selectedReport.summaryData || {}).length === 0 && (
                     <p className="col-span-full text-sm font-bold text-muted-foreground text-center bg-background shadow-neu-inset rounded-2xl p-6">
                        This saved report has no summary data. Generate a new report to calculate current database metrics.
                     </p>
                  )}
               </div>

               {/* Breakdowns */}
               {([
                  ['Office Breakdown', selectedReport.officeBreakdown || [], <BarChart3 size={16} className="mr-2" key="ob" />],
                  ['Service Breakdown', selectedReport.serviceBreakdown || [], <PieChart size={16} className="mr-2" key="sb" />],
                  ['Daily Breakdown', selectedReport.dailyBreakdown || [], <TrendingUp size={16} className="mr-2" key="db" />],
               ] as [string, BreakdownRow[], React.ReactNode][]).map(([title, rows, icon]) => (
                  <section key={title} className="space-y-4">
                     <h3 className="text-sm font-black uppercase tracking-widest text-foreground flex items-center ml-2">
                        {icon} {title}
                     </h3>
                     {rows.length === 0 ? (
                        <p className="text-xs font-bold text-muted-foreground bg-background shadow-neu-inset rounded-2xl p-6 text-center">
                           No records for this section in the selected reporting period.
                        </p>
                     ) : (
                        <div className="bg-background shadow-neu-inset rounded-[1.5rem] p-4 overflow-x-auto custom-scrollbar">
                           <table className="w-full text-left">
                              <thead>
                                 <tr>
                                    <th className="px-4 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap">Name / Date</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap text-right">Total</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap text-right">Completed</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 {rows.map((row, index) => (
                                    <tr key={`${row.name || row.day || 'row'}-${index}`} className="border-b border-primary/5 last:border-0 hover:bg-primary/5 transition-colors">
                                       <td className="px-4 py-3 text-sm font-bold text-foreground">{row.name || row.day || '—'}</td>
                                       <td className="px-4 py-3 text-sm font-black text-slate-500 text-right">{row.total ?? row.count ?? 0}</td>
                                       <td className="px-4 py-3 text-sm font-black text-green-500 text-right">{row.completed ?? '—'}</td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                     )}
                  </section>
               ))}
               
               <div className="flex justify-end pt-4 border-t border-primary/5">
                  <button 
                     onClick={() => downloadReport(selectedReport)}
                     className="h-12 px-8 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-2xl text-xs font-black tracking-widest text-blue-500 uppercase flex items-center justify-center transition-all border-0"
                  >
                     <Download size={16} className="mr-2" /> Download CSV
                  </button>
               </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
