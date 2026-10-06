import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { User, UserRole } from '@/models/User';
import { Token } from '@/models/Token';
import mongoose from 'mongoose';

export default async function AdminStaffPerformancePage({ params }: { params: Promise<{ id: string }> }) {
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

  // Get last 30 days performance
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const pipeline = [
    {
      $match: {
        servedBy: new mongoose.Types.ObjectId(id),
        status: 'COMPLETED',
        completedAt: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: null,
        totalServed: { $sum: 1 },
        avgServiceTime: {
          $avg: {
            $divide: [{ $subtract: ["$completedAt", "$servedAt"] }, 60000] // minutes
          }
        }
      }
    }
  ];

  const stats = await Token.aggregate(pipeline);
  const data = stats[0] || { totalServed: 0, avgServiceTime: 0 };
  const avgTime = Math.round(data.avgServiceTime);

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
            <h2 className="text-2xl font-bold text-slate-800">Staff Performance</h2>
            <p className="text-sm text-slate-500">{staff.fullName} - Last 30 Days</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Tokens Served</p>
                <h3 className="text-3xl font-bold text-slate-800">{data.totalServed}</h3>
              </div>
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                <CheckCircle size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Avg Service Time</p>
                <h3 className="text-3xl font-bold text-slate-800">{avgTime} <span className="text-sm font-normal text-slate-500">min</span></h3>
              </div>
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Clock size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
          <CardDescription>Overview of service metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-600">
            {data.totalServed === 0 ? (
              <p>Not enough data to calculate performance insights for the last 30 days.</p>
            ) : (
              <p>Staff member has served <b>{data.totalServed}</b> customers in the last 30 days, averaging <b>{avgTime} minutes</b> per customer.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
