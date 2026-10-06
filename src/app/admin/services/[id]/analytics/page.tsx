import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Activity, Clock, UserSquare2, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Service } from '@/models/Service';
import { Token } from '@/models/Token';
import mongoose from 'mongoose';

export default async function AdminServiceAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUserFromCookie();
  
  if (!user || user.role !== 'ADMIN') {
    redirect('/login');
  }

  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return (
      <div className="p-6 text-center text-red-600">
        <h2 className="font-bold text-xl">Invalid Service ID</h2>
      </div>
    );
  }

  const service = await Service.findById(id).lean();
  if (!service || service.organizationId?.toString() !== user.organizationId) {
    return (
      <div className="p-6 text-center text-slate-800">
        <h2 className="font-bold text-xl">Service not found</h2>
        <Link href="/admin/services">
          <Button variant="outline" className="mt-4">Back to Services</Button>
        </Link>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Aggregate stats for last 30 days
  const pipeline = [
    { 
      $match: { 
        serviceId: new mongoose.Types.ObjectId(id),
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

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href={`/admin/services/${id}`}>
            <Button variant="ghost" size="sm" className="mr-2">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Service Analytics</h2>
            <p className="text-sm text-slate-500">{service.name} - Last 30 Days</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Requests</p>
                <h3 className="text-3xl font-bold text-slate-800">{data.totalTokens}</h3>
              </div>
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Activity size={20} />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4">Last 30 days</p>
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
            <p className="text-xs text-slate-500 mt-4">Average across all offices</p>
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
            <p className="text-xs text-slate-500 mt-4">Average handle time</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">No-Show Rate</p>
                <h3 className="text-3xl font-bold text-slate-800">{noShowRate}%</h3>
              </div>
              <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                <TrendingDown size={20} />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4">{data.noShowTokens} missed appointments</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Breakdown</CardTitle>
          <CardDescription>Performance metrics for this service</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
             <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                <span className="font-medium text-slate-700">Configured Average Time</span>
                <span className="font-bold">{service.averageServiceTime} mins</span>
             </div>
             <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                <span className="font-medium text-slate-700">Actual Average Time</span>
                <span className={`font-bold ${avgServiceTime > service.averageServiceTime ? 'text-red-600' : 'text-emerald-600'}`}>
                  {avgServiceTime} mins
                </span>
             </div>
             <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                <span className="font-medium text-slate-700">Completion Rate</span>
                <span className="font-bold">
                  {data.totalTokens > 0 ? Math.round((data.completedTokens / data.totalTokens) * 100) : 0}%
                </span>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
