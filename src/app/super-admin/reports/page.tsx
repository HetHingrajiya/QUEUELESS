import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ReportsPage() {
  const reports = [
    { id: 1, name: 'Daily Executive Summary', type: 'PDF', date: '2023-10-24', size: '1.2 MB' },
    { id: 2, name: 'Weekly Organization Performance', type: 'CSV', date: '2023-10-22', size: '450 KB' },
    { id: 3, name: 'Monthly Wait Time Analysis', type: 'Excel', date: '2023-10-01', size: '2.4 MB' },
    { id: 4, name: 'Staff Efficiency Report', type: 'PDF', date: '2023-09-30', size: '890 KB' },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Generated Reports</h2>
          <p className="text-sm text-slate-500">Download and manage scheduled system reports.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <FileText size={18} className="mr-2" />
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
          <div className="overflow-x-auto">
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
                {reports.map((report) => (
                  <tr key={report.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900 flex items-center">
                      <FileText size={16} className="mr-2 text-slate-400" />
                      {report.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {report.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">{report.date}</td>
                    <td className="px-6 py-4 text-slate-500">{report.size}</td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="outline" size="sm" className="h-8 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
                        <Download size={14} className="mr-1" /> Download
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
