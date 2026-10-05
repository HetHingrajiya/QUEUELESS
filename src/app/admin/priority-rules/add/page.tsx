"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function AddPriorityRulePage() {
  const router = useRouter();
  
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newMultiplier, setNewMultiplier] = useState(2);
  const [submitLoading, setSubmitLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const res = await fetch('/api/admin/priority-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          description: newDesc,
          priorityMultiplier: newMultiplier
        })
      });
      const json = await res.json();
      if (json.success) {
        router.push('/admin/priority-rules');
      } else {
        alert(json.message || 'Failed to create priority rule');
        setSubmitLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
      setSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4">
        <Link href="/admin/priority-rules">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Add Priority Rule</h2>
          <p className="text-sm text-slate-500">Create a new queue priority logic for your organization.</p>
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
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rule Name</label>
                <input 
                  type="text" 
                  required 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  placeholder="e.g. Senior Citizen" 
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
                  value={newMultiplier} 
                  onChange={e => setNewMultiplier(parseInt(e.target.value))} 
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                />
                <p className="text-xs text-slate-500 mt-1.5">Higher number = higher queue priority</p>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  required 
                  value={newDesc} 
                  onChange={e => setNewDesc(e.target.value)} 
                  placeholder="Explain when this rule applies" 
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white h-24 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none" 
                />
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
                Save Priority Rule
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
