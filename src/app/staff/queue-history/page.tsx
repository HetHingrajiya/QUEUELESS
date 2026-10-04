import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Calendar } from 'lucide-react';
import dbConnect from '@/lib/db';
import { Token } from '@/models/Token';
import { getUserFromCookie } from '@/lib/auth';
import { Input } from '@/components/ui/input';
import { redirect } from 'next/navigation';

async function getQueueHistory(officeId: string) {
  await dbConnect();
  // Fetch completed, skipped, cancelled, or no-show tokens
  const tokens = await Token.find({ 
    officeId: officeId,
    status: { $nin: ['WAITING', 'CALLED', 'CHECKED_IN', 'SERVING'] }
  })
    .populate('serviceId')
    .sort({ updatedAt: -1 })
    .limit(50);
  return tokens;
}

export default async function StaffQueueHistoryPage() {
  const user = await getUserFromCookie();
  if (!user || user.role !== 'STAFF') redirect('/login');
  
  const tokens = await getQueueHistory(user.officeId as string);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Queue History</h2>
          <p className="text-sm text-slate-500">Recently processed tokens.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
          <div className="flex space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <Input placeholder="Search token number..." className="pl-9 bg-white" />
            </div>
            <Button variant="outline" className="bg-white">
              <Calendar size={16} className="mr-2 text-slate-500" />
              Today
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-4">Token Number</th>
                  <th scope="col" className="px-6 py-4">Service</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4">Time Resolved</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((token) => (
                  <tr key={token._id.toString()} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-900">{token.tokenNumber}</td>
                    <td className="px-6 py-4">{token.serviceId ? (token.serviceId as any).name : '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        token.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                        token.status === 'NO_SHOW' ? 'bg-red-100 text-red-700 border-red-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {token.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{new Date(token.updatedAt).toLocaleString()}</td>
                  </tr>
                ))}
                
                {tokens.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      No queue history for today.
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
