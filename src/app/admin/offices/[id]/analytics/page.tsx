import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Activity, Clock, UserSquare2, TrendingDown, Users } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Office } from '@/models/Office';
import { Token } from '@/models/Token';
import mongoose from 'mongoose';

export default async function AdminOfficeAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUserFromCookie();
  
  if (!user || user.role !== 'ADMIN') {
    redirect('/login');
  }

  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return (
      <div className="p-6 text-center text-red-600">
        <h2 className="font-bold text-xl">Invalid Office ID</h2>
      </div>
    );
  }

  const office = await Office.findById(id).lean();
  if (!office || office.organizationId?.toString() !== user.organizationId) {
    return (
      <div className="p-6 text-center text-slate-800">
        <h2 className="font-bold text-xl">Office not found</h2>
        <Link href="/admin/offices">
          <Button variant="outline" className="mt-4">Back to Offices</Button>
        </Link>
      </div>
    );
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Aggregate stats for last 30 days
  const pipeline = [
    { 
      $match: { 
        officeId: new mongoose.Types.ObjectId(id),
        createdAt: { $gte: thirtyDaysAgo }
      } 
    },
    {
      $group: {
        _id: null,
        totalTokens: { $sum: 1 },
        completedTokens: {
          $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] }
        },
        noShowTokens: {
          $sum: { $cond: [{ $eq: ["$status", "NO_SHOW"] }, 1, 0] }
        },
        avgServiceTimeStr: {
          $avg: {
            $cond: [
              { $and: [{ $eq: ["$status", "COMPLETED"] }, { $ne: ["$servedAt", null] }, { $ne: ["$completedAt", null] }] },
              { $divide: [{ $subtract: ["$completedAt", "$servedAt"] }, 60000] }, // in minutes
              null
            ]
          }
        },
        avgWaitTimeStr: {
          $avg: {
            $cond: [
              { $ne: ["$servedAt", null] },
              { $divide: [{ $subtract: ["$servedAt", "$createdAt"] }, 60000] }, // in minutes
              null
            ]
          }
        }
      }
    }
  ];

  const stats = await Token.aggregate(pipeline);
  const data = stats[0] || {
    totalTokens: 0,
    completedTokens: 0,
    noShowTokens: 0,
    avgServiceTimeStr: 0,
    avgWaitTimeStr: 0
  };

  const avgWaitTime = data.avgWaitTimeStr ? Math.round(data.avgWaitTimeStr) : 0;
  const avgServiceTime = data.avgServiceTimeStr ? Math.round(data.avgServiceTimeStr) : 0;
  const noShowRate = data.totalTokens > 0 ? Math.round((data.noShowTokens / data.totalTokens) * 100) : 0;
  const completionRate = data.totalTokens > 0 ? Math.round((data.completedTokens / data.totalTokens) * 100) : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href={`/admin/offices/${id}`}>
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Office Analytics</h2>
            <p className="text-sm text-slate-500">{office.name} - Last 30 Days</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Visitors</p>
                <h3 className="text-3xl font-bold text-slate-800">{data.totalTokens}</h3>
              </div>
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Users size={20} />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4">Tokens generated</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Avg Wait Time</p>
                <h3 className="text-3xl font-bold text-slate-800">{avgWaitTime}<span className="text-sm font-normal text-slate-500 ml-1">min</span></h3>
              </div>
              <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                <Clock size={20} />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4">Before reaching counter</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Avg Service Time</p>
                <h3 className="text-3xl font-bold text-slate-800">{avgServiceTime}<span className="text-sm font-normal text-slate-500 ml-1">min</span></h3>
              </div>
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                <UserSquare2 size={20} />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4">Time at counter</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Completion Rate</p>
                <h3 className="text-3xl font-bold text-slate-800">{completionRate}%</h3>
              </div>
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                <Activity size={20} />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4">{noShowRate}% No-Show</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>Overview of office performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-600">
            {data.totalTokens === 0 ? (
              <p>Not enough data to calculate performance insights for the last 30 days.</p>
            ) : (
              <p>This office has handled <b>{data.totalTokens}</b> requests in the last 30 days, completing <b>{data.completedTokens}</b> successfully. Visitors waited an average of <b>{avgWaitTime} minutes</b> and spent <b>{avgServiceTime} minutes</b> being served.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
