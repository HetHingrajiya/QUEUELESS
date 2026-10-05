"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function EditPriorityRulePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const ruleId = unwrappedParams.id;
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priorityMultiplier, setPriorityMultiplier] = useState(2);
  const [status, setStatus] = useState('ACTIVE');
  
  const [initialLoading, setInitialLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    const fetchRule = async () => {
      try {
        const res = await fetch(`/api/admin/priority-rules/${ruleId}`);
        const json = await res.json();
        
        if (json.success) {
          setName(json.data.name || '');
          setDescription(json.data.description || '');
          setPriorityMultiplier(json.data.priorityMultiplier || 1);
          setStatus(json.data.status || 'ACTIVE');
        } else {
          alert(json.message || 'Failed to fetch priority rule');
          router.push('/admin/priority-rules');
        }
      } catch (err) {
        console.error(err);
        alert('Network error');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchRule();
  }, [ruleId, router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const res = await fetch(`/api/admin/priority-rules/${ruleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          priorityMultiplier,
          status
        })
      });
      const json = await res.json();
      if (json.success) {
        router.push('/admin/priority-rules');
      } else {
        alert(json.message || 'Failed to update priority rule');
        setSubmitLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
      setSubmitLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4">
        <Link href="/admin/priority-rules">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Edit Priority Rule</h2>
          <p className="text-sm text-slate-500">Update the details of your queue priority logic.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
            <ShieldAlert size={20} />
          </div>
          <CardTitle className="text-lg">Rule Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rule Name</label>
                <input 
                  type="text" 
                  required 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Priority Multiplier</label>
                <input 
                  type="number" 
                  required 
                  min="1" 
                  max="100" 
                  value={priorityMultiplier} 
                  onChange={e => setPriorityMultiplier(parseInt(e.target.value))} 
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  required 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white h-24 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select 
                  value={status} 
                  onChange={e => setStatus(e.target.value)} 
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-6 border-t border-slate-100">
              <Link href="/admin/priority-rules">
                <Button type="button" variant="outline" className="border-slate-300">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={submitLoading} className="bg-blue-600 hover:bg-blue-700">
                {submitLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
