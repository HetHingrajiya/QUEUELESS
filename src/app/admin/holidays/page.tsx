"use client";
import { PageHeader } from '@/components/common/PageHeader';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Calendar as CalendarIcon, Trash2, CalendarOff, Edit } from 'lucide-react';
import Link from 'next/link';

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHolidays = async () => {
    try {
      const response = await fetch('/api/admin/holidays');
      const json = await response.json();
      if (json.success) {
        setHolidays(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this holiday?')) return;
    try {
      const response = await fetch(`/api/admin/holidays/${id}`, { method: 'DELETE' });
      const json = await response.json();
      if (json.success) {
        setHolidays(holidays.filter(h => h._id !== id));
      } else {
        alert(json.message || 'Failed to delete');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
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
    <div className="space-y-6 p-6">
      
      <PageHeader 
        title="Holidays"
        description="Manage organization-wide holidays where all offices will be closed."
        action={{ label: 'Add Holiday', href: '/admin/holidays/add', icon: <Plus size={18} /> }}
      />


      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-100 uppercase">
                <tr>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Holiday Name</th>
                  <th className="px-6 py-4 font-semibold">Description</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {holidays.map((holiday) => {
                  const dateObj = new Date(holiday.date);
                  return (
                    <tr key={holiday._id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                        <div className="flex items-center">
                          <CalendarIcon size={16} className="text-blue-500 mr-2" />
                          {dateObj.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-semibold">{holiday.name}</td>
                      <td className="px-6 py-4 text-slate-500">{holiday.description || '-'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <Link href={`/admin/holidays/${holiday._id}/edit`}>
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                              <Edit size={16} />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(holiday._id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {holidays.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      <CalendarOff className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                      <p>No holidays have been configured yet.</p>
                      <Link href="/admin/holidays/add">
                        <Button variant="link" className="text-blue-600 mt-2">Add your first holiday</Button>
                      </Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
