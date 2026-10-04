"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Loader2, ServerCog } from 'lucide-react';

export default function OrganizationTypes() {
  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTypes = async () => {
    try {
      const res = await fetch('/api/organization-types');
      const data = await res.json();
      if (data.success) {
        setTypes(data.data);
      }
    } catch (error) {
      console.error('Error fetching org types:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this organization type?')) return;
    
    try {
      const res = await fetch(`/api/organization-types/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchTypes();
      } else {
        alert(data.message || 'Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting org type:', error);
      alert('Error occurred');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Organization Types Master</h2>
          <p className="text-sm text-slate-500 mt-1">Manage all available organization classifications.</p>
        </div>
        <Link href="/super-admin/organization-types/add">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" /> Add New Type
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : types.length === 0 ? (
            <div className="text-center p-12 border-b border-slate-100">
              <div className="bg-slate-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ServerCog className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">No Organization Types</h3>
              <p className="text-slate-500 mb-4">You haven't created any organization types yet.</p>
              <Link href="/super-admin/organization-types/add">
                <Button variant="outline">Create your first type</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Description</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {types.map((type) => (
                    <tr key={type._id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{type.name}</td>
                      <td className="px-6 py-4">{type.description || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                          type.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {type.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center space-x-3">
                          <Link href={`/super-admin/organization-types/${type._id}/edit`} className="text-blue-600 hover:text-blue-800 transition-colors">
                            <Edit size={18} />
                          </Link>
                          <button onClick={() => handleDelete(type._id)} className="text-red-500 hover:text-red-700 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
