"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import Link from 'next/link';

export default function EditHolidayPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  // Using React.use to properly unwrap dynamic params in Next.js 15
  const unwrappedParams = React.use(params);
  const id = unwrappedParams.id;
  
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    const fetchHoliday = async () => {
      try {
        const response = await fetch(`/api/admin/holidays/${id}`);
        const json = await response.json();
        
        if (json.success && json.data) {
          const d = json.data;
          setName(d.name || '');
          // Format date for the HTML date input (YYYY-MM-DD)
          if (d.date) {
            const dateObj = new Date(d.date);
            setDate(dateObj.toISOString().split('T')[0]);
          }
          setDescription(d.description || '');
        } else {
          alert('Holiday not found');
          router.push('/admin/holidays');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHoliday();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const response = await fetch(`/api/admin/holidays/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, date, description })
      });
      const json = await response.json();
      
      if (json.success) {
        router.push('/admin/holidays');
      } else {
        alert(json.message || 'Failed to update holiday');
        setSubmitLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert('Network error occurred');
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="flex items-center space-x-4">
        <Link href="/admin/holidays">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Edit Holiday</h2>
          <p className="text-sm text-slate-500">Update details for this holiday.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 flex flex-row items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
            <CalendarIcon size={20} />
          </div>
          <CardTitle className="text-lg">Holiday Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Holiday Name</label>
                <input 
                  type="text" 
                  required
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="e.g. Christmas Day"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <input 
                  type="date" 
                  required
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder="Brief details about this holiday..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all min-h-[100px]" 
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-6 border-t border-slate-100">
              <Link href="/admin/holidays">
                <Button type="button" variant="outline" className="border-slate-300">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={submitLoading} className="bg-blue-600 hover:bg-blue-700">
                {submitLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                Update Holiday
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
