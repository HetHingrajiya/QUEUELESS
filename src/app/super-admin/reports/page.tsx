"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Calendar, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

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
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                          onClick={() => alert('Download will begin shortly...')}
                        >
                          <Download size={14} className="mr-1" /> Download
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
