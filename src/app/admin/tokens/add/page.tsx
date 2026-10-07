"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Ticket } from 'lucide-react';
import Link from 'next/link';

export default function AddTokenPage() {
  const router = useRouter();
  
  const [offices, setOffices] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  
  const [officeId, setOfficeId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [citizenEmail, setCitizenEmail] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [officesRes, servicesRes] = await Promise.all([
          fetch('/api/offices'),
          fetch('/api/services')
        ]);
        
        const officesJson = await officesRes.json();
        const servicesJson = await servicesRes.json();
        
        if (officesJson.success) setOffices(officesJson.data);
        if (servicesJson.success) setServices(servicesJson.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const res = await fetch('/api/admin/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officeId,
          serviceId,
          citizenEmail: citizenEmail || undefined
        })
      });
      const json = await res.json();
      if (json.success) {
        router.push('/admin/tokens');
      } else {
        alert(json.message || 'Failed to create token');
        setSubmitLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
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
        <Link href="/admin/tokens">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Create New Token</h2>
          <p className="text-sm text-slate-500">Manually issue a token for a walk-in citizen or existing user.</p>
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
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Office Location</label>
                <select 
                  required 
                  value={officeId} 
                  onChange={e => {
                    setOfficeId(e.target.value);
                    setServiceId(''); // Reset service when office changes
                  }} 
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                >
                  <option value="">Select Office</option>
                  {offices.map(o => (
                    <option key={o._id} value={o._id}>{o.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Service</label>
                <select 
                  required 
                  value={serviceId} 
                  onChange={e => setServiceId(e.target.value)} 
                  disabled={!officeId}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-slate-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select Service</option>
                  {services.filter(s => s.officeId === officeId || s.officeId?._id === officeId).map(s => (
                    <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Citizen Email (Optional)</label>
                <input 
                  type="email" 
                  value={citizenEmail} 
                  onChange={e => setCitizenEmail(e.target.value)} 
                  placeholder="Leave blank to issue an anonymous walk-in token" 
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
                />
                <p className="text-xs text-slate-500 mt-1.5">If provided, the token will be linked to the registered citizen's account.</p>
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
                Generate Token
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
