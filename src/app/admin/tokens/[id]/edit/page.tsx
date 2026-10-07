"use client";
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Ticket } from 'lucide-react';
import Link from 'next/link';

export default function EditTokenPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const tokenId = unwrappedParams.id;
  
  const [tokenNumber, setTokenNumber] = useState('');
  const [status, setStatus] = useState('WAITING');
  
  const [initialLoading, setInitialLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await fetch(`/api/admin/tokens/${tokenId}`);
        const json = await res.json();
        
        if (json.success) {
          setTokenNumber(json.data.tokenNumber || '');
          setStatus(json.data.status || 'WAITING');
        } else {
          alert(json.message || 'Failed to fetch token');
          router.push('/admin/tokens');
        }
      } catch (err) {
        console.error(err);
        alert('Network error');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchToken();
  }, [tokenId, router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const res = await fetch(`/api/admin/tokens/${tokenId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status
        })
      });
      const json = await res.json();
      if (json.success) {
        router.push('/admin/tokens');
      } else {
        alert(json.message || 'Failed to update token');
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
        <Link href="/admin/tokens">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Edit Token Status</h2>
          <p className="text-sm text-slate-500">Update the current status of token {tokenNumber}.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
            <Ticket size={20} />
          </div>
          <CardTitle className="text-lg">Token Details</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Token Number</label>
                <input 
                  type="text" 
                  disabled
                  value={tokenNumber} 
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-slate-50 cursor-not-allowed outline-none transition-all" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select 
                  value={status} 
                  onChange={e => setStatus(e.target.value)} 
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="WAITING">Waiting</option>
                  <option value="CALLED">Called</option>
                  <option value="CHECKED_IN">Checked In</option>
                  <option value="SERVING">Serving</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="SKIPPED">Skipped</option>
                  <option value="NO_SHOW">No Show</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-6 border-t border-slate-100">
              <Link href="/admin/tokens">
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
