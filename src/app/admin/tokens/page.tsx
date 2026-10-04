import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter } from 'lucide-react';
import Link from 'next/link';

export default function AdminTokensListPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Tokens</h2>
          <p className="text-sm text-slate-500">Manage your tokens list and details.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline"><Filter size={16} className="mr-2" /> Filter</Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus size={16} className="mr-2" /> Add New
          </Button>
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b border-slate-100 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input type="text" placeholder="Search..." className="w-full pl-9 pr-4 py-2 border rounded-md text-sm" />
            </div>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-6 py-3">ID / Reference</th>
                <th className="px-6 py-3">Details</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[1,2,3].map(i => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-medium">#REF-00{i}</td>
                  <td className="px-6 py-4">Sample Data Row {i}</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">Active</span></td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm">View</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
