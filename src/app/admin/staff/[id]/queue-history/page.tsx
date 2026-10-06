import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, History } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { User, UserRole } from '@/models/User';
import { Token } from '@/models/Token';
import { Service } from '@/models/Service';
import { Counter } from '@/models/Counter';
import mongoose from 'mongoose';

export default async function AdminStaffQueueHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await getUserFromCookie();
  
  if (!currentUser || currentUser.role !== 'ADMIN') {
    redirect('/login');
  }

  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return (
      <div className="p-6 text-center text-red-600">
        <h2 className="font-bold text-xl">Invalid Staff ID</h2>
      </div>
    );
  }

  const staff = await User.findOne({ _id: id, role: UserRole.STAFF }).lean();

  if (!staff || staff.organizationId?.toString() !== currentUser.organizationId) {
    return (
      <div className="p-6 text-center text-slate-800">
        <h2 className="font-bold text-xl">Staff member not found or unauthorized</h2>
        <Link href="/admin/staff">
          <Button variant="outline" className="mt-4">Back to Staff</Button>
        </Link>
      </div>
    );
  }

  const tokens = await Token.find({ 
    servedBy: id,
    status: { $in: ['COMPLETED', 'NO_SHOW', 'TRANSFERRED'] }
  }).sort({ completedAt: -1, updatedAt: -1 }).limit(50).lean();

  const populatedTokens = await Promise.all(tokens.map(async (t) => {
    const service = t.serviceId ? await Service.findById(t.serviceId).select('name').lean() : null;
    const counter = t.counterId ? await Counter.findById(t.counterId).select('name number').lean() : null;
    return { 
      ...t, 
      serviceName: service?.name || '-',
      counterName: counter ? `${counter.name} (${counter.number})` : '-'
    };
  }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href={`/admin/staff/${id}`}>
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Queue History</h2>
            <p className="text-sm text-slate-500">{staff.fullName} - Last 50 Tokens</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Tokens</CardTitle>
          <CardDescription>Latest tokens processed by this staff member</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Token</th>
                  <th className="px-6 py-4">Service</th>
                  <th className="px-6 py-4">Counter</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Completed At</th>
                </tr>
              </thead>
              <tbody>
                {populatedTokens.map((token) => (
                  <tr key={token._id.toString()} className="bg-white border-b hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {token.tokenNumber}
                    </td>
                    <td className="px-6 py-4">{token.serviceName}</td>
                    <td className="px-6 py-4">{token.counterName}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        token.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                        token.status === 'NO_SHOW' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {token.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {token.completedAt ? new Date(token.completedAt).toLocaleString() : new Date(token.updatedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
                
                {populatedTokens.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No queue history found for this staff member.
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
