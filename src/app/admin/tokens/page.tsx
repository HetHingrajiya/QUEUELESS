"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter, Loader2, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminTokensListPage() {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTokens = async () => {
    try {
      const res = await fetch('/api/admin/tokens');
      const json = await res.json();
      if (json.success) {
        setTokens(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this token?')) return;
    
    try {
      const res = await fetch(`/api/admin/tokens/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        fetchTokens();
      } else {
        alert(json.message || 'Failed to delete');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Tokens</h2>
          <p className="text-sm text-slate-500">Manage your tokens list and details.</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline"><Filter size={16} className="mr-2" /> Filter</Button>
          <Link href="/admin/tokens/add">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus size={16} className="mr-2" /> Add New
            </Button>
          </Link>
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
          
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin h-6 w-6 text-blue-600" />
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-3">Token Number</th>
                  <th className="px-6 py-3">Service</th>
                  <th className="px-6 py-3">Office</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tokens.length > 0 ? (
                  tokens.map((token: any) => (
                    <tr key={token.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-medium">{token.tokenNumber}</td>
                      <td className="px-6 py-4">{token.service}</td>
                      <td className="px-6 py-4">{token.office}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          token.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                          token.status === 'SERVING' ? 'bg-blue-100 text-blue-700' :
                          token.status === 'NO_SHOW' || token.status === 'SKIPPED' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {token.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(token.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <Link href={`/admin/tokens/${token.id}/edit`}>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Edit">
                              <Edit size={14} className="text-slate-600" />
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(token.id)} className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 border-red-200" title="Delete">
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      No tokens found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
