"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Loader2, ServerCog, Layers } from 'lucide-react';

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
    <div className="space-y-8 pb-20 max-w-6xl mx-auto pt-4 cursor-default">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 px-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Organization Types</h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-semibold mt-1">Manage all available organization classifications.</p>
        </div>
        <Link href="/super-admin/organization-types/add">
          <button className="h-12 px-6 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-2xl text-xs uppercase font-black tracking-widest text-primary flex items-center justify-center transition-all border-0">
            <Plus size={18} className="mr-2" /> Add New Type
          </button>
        </Link>
      </div>

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="bg-background shadow-neu rounded-[2.5rem] p-6 sm:p-10 border-0">
          
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <div className="w-16 h-16 rounded-2xl bg-background shadow-neu flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            </div>
          ) : types.length === 0 ? (
            <div className="bg-background shadow-neu-inset rounded-[2rem] p-12 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-background shadow-neu rounded-full flex items-center justify-center text-muted-foreground mb-6">
                <ServerCog size={32} />
              </div>
              <h3 className="text-xl font-black text-foreground mb-2">No Organization Types</h3>
              <p className="text-sm font-semibold text-muted-foreground mb-8">You haven't created any organization classifications yet.</p>
              <Link href="/super-admin/organization-types/add">
                <button className="h-12 px-8 bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-full text-xs font-black uppercase tracking-widest text-primary transition-all border-0">
                  Create your first type
                </button>
              </Link>
            </div>
          ) : (
            <div className="w-full overflow-x-auto custom-scrollbar pb-4">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap">Name</th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap">Description</th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 whitespace-nowrap">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b-2 border-primary/5 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {types.map((type) => (
                    <tr key={type._id} className="group hover:bg-primary/5 transition-colors">
                      <td className="px-6 py-5 border-b border-primary/5 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-background shadow-neu-inset flex items-center justify-center text-indigo-500 shrink-0">
                            <Layers size={16} />
                          </div>
                          <span className="font-black text-sm text-foreground whitespace-nowrap">{type.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 border-b border-primary/5 transition-all text-sm font-semibold text-muted-foreground">
                        {type.description || '-'}
                      </td>
                      <td className="px-6 py-5 border-b border-primary/5 transition-all">
                        <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-background shadow-neu-inset whitespace-nowrap ${
                          type.status === 'ACTIVE' ? 'text-emerald-500' : 'text-amber-500'
                        }`}>
                          {type.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 border-b border-primary/5 transition-all text-right">
                        <div className="flex justify-end gap-3">
                          <Link href={`/super-admin/organization-types/${type._id}/edit`}>
                            <button 
                              className="w-10 h-10 flex items-center justify-center bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-xl transition-all border-0 text-slate-500 hover:text-primary" 
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                          </Link>
                          
                          <button 
                            className="w-10 h-10 flex items-center justify-center bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-xl transition-all border-0 text-red-400 hover:text-red-500" 
                            title="Delete"
                            onClick={() => handleDelete(type._id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
