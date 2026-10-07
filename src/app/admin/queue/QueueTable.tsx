import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Filter, Activity } from 'lucide-react';
import dbConnect from '@/lib/db';
import { Token, TokenStatus } from '@/models/Token';
import { Office } from '@/models/Office';
import { Input } from '@/components/ui/input';

async function getTokensByStatus(orgId: string, statuses: TokenStatus[]) {
  await dbConnect();
  
  const offices = await Office.find({ organizationId: orgId }).select('_id');
  const officeIds = offices.map(o => o._id);
  
  if (officeIds.length === 0) return [];
  
  const tokens = await Token.find({ 
    officeId: { $in: officeIds },
    status: { $in: statuses }
  })
    .populate('officeId')
    .populate('serviceId')
    .populate('counterId')
    .sort({ createdAt: -1 }); // Sort newest first for lists
  return tokens;
}

export default async function QueueTable({ 
  orgId, 
  title, 
  description, 
  statuses 
}: { 
  orgId: string; 
  title: string; 
  description: string; 
  statuses: TokenStatus[];
}) {
  const tokens = await getTokensByStatus(orgId, statuses);

  return (
    <div className="space-y-6 p-6">
      
      <PageHeader 
        title={title}
        description={description}
      />


      <Card>
        <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
          <div className="flex space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <Input placeholder="Search token number..." className="pl-9 bg-white" />
            </div>
            <Button variant="outline" className="bg-white">
              <Filter size={16} className="mr-2 text-slate-500" />
              Filter by Office
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-4">Token Number</th>
                  <th scope="col" className="px-6 py-4">Office</th>
                  <th scope="col" className="px-6 py-4">Service</th>
                  <th scope="col" className="px-6 py-4">Counter</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4">Generated At</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((token) => (
                  <tr key={token._id.toString()} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-900">{token.tokenNumber}</td>
                    <td className="px-6 py-4">{token.officeId ? (token.officeId as any).name : '-'}</td>
                    <td className="px-6 py-4">{token.serviceId ? (token.serviceId as any).name : '-'}</td>
                    <td className="px-6 py-4">{token.counterId ? (token.counterId as any).name : 'Waiting'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                        token.status === TokenStatus.SERVING ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        token.status === TokenStatus.CALLED ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                        token.status === TokenStatus.WAITING ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        token.status === TokenStatus.COMPLETED ? 'bg-purple-100 text-purple-700 border-purple-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {token.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{new Date(token.createdAt).toLocaleTimeString()}</td>
                  </tr>
                ))}
                
                {tokens.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <Activity className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                      <p>No tokens found in this queue.</p>
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
