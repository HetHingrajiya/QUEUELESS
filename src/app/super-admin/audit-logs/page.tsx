export const dynamic = 'force-dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Filter, Calendar } from 'lucide-react';
import dbConnect from '@/lib/db';
import { AuditLog } from '@/models/AuditLog';
import { Input } from '@/components/ui/input';

async function getAuditLogs() {
  await dbConnect();
  // Fetch logs and populate user if available. Safe fallback used below.
  const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(100);
  return logs;
}

export default async function AuditLogsPage() {
  const logs = await getAuditLogs();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Audit Logs</h2>
          <p className="text-sm text-slate-500">Track all system activities and security events.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
          <div className="flex space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <Input placeholder="Search logs..." className="pl-9 bg-white" />
            </div>
            <Button variant="outline" className="bg-white">
              <Calendar size={16} className="mr-2 text-slate-500" />
              Date Range
            </Button>
            <Button variant="outline" className="bg-white">
              <Filter size={16} className="mr-2 text-slate-500" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-4">Timestamp</th>
                  <th scope="col" className="px-6 py-4">Action</th>
                  <th scope="col" className="px-6 py-4">Module</th>
                  <th scope="col" className="px-6 py-4">User ID</th>
                  <th scope="col" className="px-6 py-4">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id.toString()} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono text-xs whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        log.action === 'LOGIN' ? 'bg-blue-50 text-blue-700' :
                        log.action === 'DELETE' ? 'bg-red-50 text-red-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {log.action}
                      </span>
                      <p className="text-xs text-slate-500 mt-1">{log.details}</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {log.module}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {log.userId ? log.userId.toString() : 'SYSTEM'}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
                
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No audit logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
