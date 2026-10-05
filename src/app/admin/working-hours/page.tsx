"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Clock, Save, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DEFAULT_HOURS = { isOpen: true, openingTime: '09:00', closingTime: '17:00' };

export default function WorkingHoursPage() {
  const [offices, setOffices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const initializeWorkingHours = (office: any) => {
    if (office.workingHours && office.workingHours.length === 7) {
      return office.workingHours;
    }
    // Fallback to legacy or default
    return DAYS_OF_WEEK.map(day => ({
      day,
      isOpen: day !== 'Sunday',
      openingTime: office.openingTime || '09:00',
      closingTime: office.closingTime || '17:00',
      breakStartTime: '13:00',
      breakEndTime: '14:00'
    }));
  };

  const fetchOffices = async () => {
    try {
      const response = await fetch('/api/offices');
      const json = await response.json();
      if (json.success) {
        const enrichedOffices = json.data.map((o: any) => ({
          ...o,
          workingHours: initializeWorkingHours(o)
        }));
        setOffices(enrichedOffices);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffices();
  }, []);

  const handleTimeChange = (officeIndex: number, dayIndex: number, field: string, value: any) => {
    const newOffices = [...offices];
    newOffices[officeIndex].workingHours[dayIndex] = {
      ...newOffices[officeIndex].workingHours[dayIndex],
      [field]: value
    };
    setOffices(newOffices);
  };

  const handleSave = async (office: any) => {
    setSavingId(office._id);
    try {
      const response = await fetch(`/api/offices/${office._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workingHours: office.workingHours
        })
      });
      const json = await response.json();
      if (json.success) {
        alert('Working hours updated successfully for ' + office.name);
      } else {
        alert(json.message || 'Failed to update');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setSavingId(null);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Working Hours</h2>
          <p className="text-sm text-slate-500">Configure operating hours for each day of the week per office.</p>
        </div>
      </div>

      <div className="space-y-6">
        {offices.map((office, oIdx) => (
          <Card key={office._id} className="overflow-hidden border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50 border-b border-slate-100 py-4 flex flex-row items-center space-x-3">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Building2 size={20} />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">{office.name}</CardTitle>
                <p className="text-xs text-slate-500 font-medium">Code: {office.code}</p>
              </div>
              <Button 
                className="bg-blue-600 hover:bg-blue-700" 
                onClick={() => handleSave(office)}
                disabled={savingId === office._id}
              >
                {savingId === office._id ? (
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 bg-white border-b border-slate-100 uppercase">
                    <tr>
                      <th className="px-6 py-4 font-semibold w-40">Day</th>
                      <th className="px-6 py-4 font-semibold w-32">Status</th>
                      <th className="px-6 py-4 font-semibold">Opening Time</th>
                      <th className="px-6 py-4 font-semibold">Closing Time</th>
                      <th className="px-6 py-4 font-semibold">Break Start</th>
                      <th className="px-6 py-4 font-semibold">Break End</th>
                    </tr>
                  </thead>
                  <tbody>
                    {office.workingHours.map((wh: any, dIdx: number) => (
                      <tr key={wh.day} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="px-6 py-3 font-medium text-slate-700">
                          {wh.day}
                        </td>
                        <td className="px-6 py-3">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              className="sr-only peer" 
                              checked={wh.isOpen}
                              onChange={(e) => handleTimeChange(oIdx, dIdx, 'isOpen', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            <span className={`ml-3 text-sm font-medium ${wh.isOpen ? 'text-blue-600' : 'text-slate-500'}`}>
                              {wh.isOpen ? 'Open' : 'Closed'}
                            </span>
                          </label>
                        </td>
                        <td className="px-6 py-3">
                          <Input 
                            type="time" 
                            disabled={!wh.isOpen}
                            value={wh.openingTime}
                            onChange={(e) => handleTimeChange(oIdx, dIdx, 'openingTime', e.target.value)}
                            className={`w-36 ${!wh.isOpen ? 'opacity-50' : ''}`}
                          />
                        </td>
                        <td className="px-6 py-3">
                          <Input 
                            type="time" 
                            disabled={!wh.isOpen}
                            value={wh.closingTime}
                            onChange={(e) => handleTimeChange(oIdx, dIdx, 'closingTime', e.target.value)}
                            className={`w-36 ${!wh.isOpen ? 'opacity-50' : ''}`}
                          />
                        </td>
                        <td className="px-6 py-3">
                          <Input 
                            type="time" 
                            disabled={!wh.isOpen}
                            value={wh.breakStartTime || ''}
                            onChange={(e) => handleTimeChange(oIdx, dIdx, 'breakStartTime', e.target.value)}
                            className={`w-36 ${!wh.isOpen ? 'opacity-50' : ''}`}
                          />
                        </td>
                        <td className="px-6 py-3">
                          <Input 
                            type="time" 
                            disabled={!wh.isOpen}
                            value={wh.breakEndTime || ''}
                            onChange={(e) => handleTimeChange(oIdx, dIdx, 'breakEndTime', e.target.value)}
                            className={`w-36 ${!wh.isOpen ? 'opacity-50' : ''}`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))}

        {offices.length === 0 && (
          <div className="py-12 text-center text-slate-500 border border-dashed rounded-lg border-slate-300 bg-white">
            <p>No offices found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
