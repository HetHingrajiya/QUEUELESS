import Link from 'next/link';
import { MapPin, Clock, Users, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

import { use } from 'react';

export default function OfficeDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Link href="/citizen/home" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">RTO Rajkot</h1>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
          <div className="flex items-center text-emerald-600 mb-2">
            <CheckCircle2 size={18} className="mr-2" />
            <span className="font-semibold text-sm">Open Now</span>
          </div>
          <p className="text-xs text-slate-600">Closes at 6:00 PM</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <div className="flex items-center text-blue-600 mb-2">
            <Users size={18} className="mr-2" />
            <span className="font-semibold text-sm">47 Waiting</span>
          </div>
          <p className="text-xs text-slate-600">Total current queue</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start text-sm text-slate-600 space-x-3 mb-4">
          <MapPin size={18} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <p>Marketing Yard Rd, Navagam, Rajkot, Gujarat 360003</p>
        </div>
        <div className="flex items-start text-sm text-slate-600 space-x-3 border-t border-slate-100 pt-4">
          <Clock size={18} className="text-slate-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="mb-1"><span className="font-medium">Active Counters:</span> 6</p>
            <p><span className="font-medium">Avg Service Time:</span> 3.2 minutes</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4">Select Service</h2>
        <div className="space-y-3">
          {[
            { id: '1', name: 'Driving Licence', wait: '18', time: '32 min' },
            { id: '2', name: 'Vehicle Registration', wait: '11', time: '20 min' },
            { id: '3', name: 'Permit', wait: '7', time: '15 min' },
            { id: '4', name: 'Address Change', wait: '4', time: '10 min' },
            { id: '5', name: 'Duplicate RC', wait: '2', time: '5 min' },
          ].map((service) => (
            <Link key={service.id} href={`/citizen/services/${service.id}`} className="block transition-transform hover:scale-[1.01]">
              <Card className="hover:border-blue-300 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">{service.name}</h3>
                    <div className="flex items-center text-xs text-slate-500 space-x-4">
                      <span className="flex items-center">
                        <Users size={14} className="mr-1" /> {service.wait} waiting
                      </span>
                      <span className="flex items-center">
                        <Clock size={14} className="mr-1" /> ~{service.time}
                      </span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <ArrowRight size={18} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
