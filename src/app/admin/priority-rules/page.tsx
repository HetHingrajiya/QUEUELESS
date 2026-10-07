"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Plus, AlertCircle, ShieldAlert, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PriorityRulesPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/priority-rules');
      const json = await response.json();
      
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.message || "Failed to load priority rules.");
      }
    } catch (err) {
      setError("Failed to load module data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this priority rule?')) return;
    
    try {
      const res = await fetch(`/api/admin/priority-rules/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        fetchRules();
      } else {
        alert(json.message || 'Failed to delete');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    }
  };

  if (loading && data.length === 0) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Priority Rules</h2>
          <p className="text-sm text-slate-500">Manage queue priority logic for specific groups (e.g., Senior Citizens).</p>
        </div>
        <div className="flex space-x-2">
          <Link href="/admin/priority-rules/add">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus size={16} className="mr-2" /> Add Rule
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 mt-6">
          <CardContent className="p-6 flex items-center text-red-600">
            <AlertCircle className="w-5 h-5 mr-3" />
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {data.length > 0 ? (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Rule Name</th>
                  <th className="px-6 py-3 font-medium">Description</th>
                  <th className="px-6 py-3 font-medium">Multiplier</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((rule, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-semibold text-slate-700 flex items-center">
                      <ShieldAlert size={16} className="text-amber-500 mr-2" />
                      {rule.name}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{rule.description}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">x{rule.priorityMultiplier}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${rule.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                        {rule.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <Link href={`/admin/priority-rules/${rule._id}/edit`}>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Edit">
                            <Edit size={14} className="text-slate-600" />
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(rule._id)} className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 border-red-200" title="Delete">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center">
              <h3 className="text-lg font-bold text-slate-700 mb-2">No Priority Rules</h3>
              <p className="text-slate-500 mb-6">You haven't set up any priority logic for your organization yet.</p>
              <Link href="/admin/priority-rules/add">
                <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                  Create your first rule
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
