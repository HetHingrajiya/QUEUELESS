import Link from 'next/link';
import { ArrowLeft, Clock, Users, Briefcase, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ServiceDetails({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center mb-6">
        <Link href="/citizen/offices/123" className="p-2 mr-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
          <ArrowLeft size={24} />
        </Link>
      </div>

      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Car size={36} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Driving Licence</h1>
        <p className="text-slate-500">RTO Rajkot</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center shadow-sm">
          <Users size={24} className="text-blue-500 mx-auto mb-2" />
          <p className="text-sm text-slate-500 mb-1">People Ahead</p>
          <p className="text-2xl font-bold text-slate-900">18</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center shadow-sm">
          <Clock size={24} className="text-amber-500 mx-auto mb-2" />
          <p className="text-sm text-slate-500 mb-1">Estimated Wait</p>
          <p className="text-2xl font-bold text-slate-900">32<span className="text-sm font-medium text-slate-500 ml-1">min</span></p>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500">Active Counters</span>
          <span className="font-semibold text-slate-900">4</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500">Average Service Time</span>
          <span className="font-semibold text-slate-900">3.1 minutes</span>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 md:static md:bg-transparent md:border-0 md:p-0 z-10">
        <div className="max-w-4xl mx-auto">
          <Link href="/citizen/token">
            <Button className="w-full h-14 text-lg font-semibold bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all">
              TAKE VIRTUAL TOKEN
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
