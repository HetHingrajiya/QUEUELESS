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

export default async function AdminGlobalStaffHistoryPage() {
  const currentUser = await getUserFromCookie();
  
  if (!currentUser || currentUser.role !== 'ADMIN') {
    redirect('/login');
  }

  await dbConnect();

  // Get all staff members for the org
  const staffMembers = await User.find({ 
    role: UserRole.STAFF, 
    organizationId: currentUser.organizationId 
  }).lean();

  const staffIds = staffMembers.map(s => s._id);

  const tokens = await Token.find({ 
    servedBy: { $in: staffIds },
    status: { $in: ['COMPLETED', 'NO_SHOW', 'TRANSFERRED'] }
  }).sort({ completedAt: -1, updatedAt: -1 }).limit(100).lean();

  const populatedTokens = await Promise.all(tokens.map(async (t) => {
    const service = t.serviceId ? await Service.findById(t.serviceId).select('name').lean() : null;
    const counter = t.counterId ? await Counter.findById(t.counterId).select('name number').lean() : null;
    const staff = staffMembers.find(s => s._id.toString() === t.servedBy?.toString());
    
    return { 
      ...t, 
      serviceName: service?.name || '-',
      counterName: counter ? `${counter.name} (${counter.number})` : '-',
      staffName: staff ? staff.fullName : 'Unknown Staff'
    };
  }));

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Global Queue History</h2>
          <p className="text-sm text-slate-500">Most recent tokens handled by any staff member in your organization.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Recent Queue Interactions</CardTitle>
            <div className="flex space-x-2">
               <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">Last 100 Records</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Token</th>
                  <th className="px-6 py-4">Staff</th>
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
                    <td className="px-6 py-4 font-medium text-blue-700">
                      <Link href={`/admin/staff/${token.servedBy?.toString()}`}>
                        {token.staffName}
                      </Link>
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
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No queue history found for your organization.
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
