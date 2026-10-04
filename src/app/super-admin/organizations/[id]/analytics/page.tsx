"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';

export default function GenericGeneratedPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Using generic endpoint mapping
        const response = await fetch('/api/generic?route=super-admin/organizations/[id]/analytics');
        const json = await response.json();
        
        if (json.success && json.data) {
          setData(json.data);
        } else {
          // If no specific data found, we intentionally leave it null to show Empty State
          setData(null);
        }
      } catch (err) {
        setError("Failed to load module data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50 mt-6">
        <CardContent className="p-6 text-center text-red-600">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-6 capitalize">analytics Module</h1>
        <Card className="border-slate-200 bg-white">
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-bold text-slate-700 mb-2">No Data Available</h3>
            <p className="text-slate-500 mb-4">There are currently no records available in this module.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6 capitalize">analytics</h1>
      <Card>
        <CardContent className="p-6">
          <pre className="text-sm text-slate-600 overflow-auto bg-slate-50 p-4 rounded-lg">
            {JSON.stringify(data, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
