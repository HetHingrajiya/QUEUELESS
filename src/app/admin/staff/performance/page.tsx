import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { User, UserRole } from '@/models/User';
import { Token } from '@/models/Token';
import mongoose from 'mongoose';

export default async function AdminGlobalStaffPerformancePage() {
  const currentUser = await getUserFromCookie();
  
  if (!currentUser || currentUser.role !== 'ADMIN') {
    redirect('/login');
  }

  await dbConnect();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get all staff members for the org
  const staffMembers = await User.find({ 
    role: UserRole.STAFF, 
    organizationId: currentUser.organizationId 
  }).lean();

  const staffIds = staffMembers.map(s => s._id);

  // Aggregate performance for these staff
  const pipeline = [
    {
      $match: {
        servedBy: { $in: staffIds },
        status: { $in: ['COMPLETED', 'NO_SHOW', 'SKIPPED'] },
        updatedAt: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: "$servedBy",
        totalHandled: { $sum: 1 },
        completed: { 
          $sum: { $cond: [{ $eq: ["$status", "COMPLETED"] }, 1, 0] } 
        },
        noShow: { 
          $sum: { $cond: [{ $eq: ["$status", "NO_SHOW"] }, 1, 0] } 
        },
        skipped: { 
          $sum: { $cond: [{ $eq: ["$status", "SKIPPED"] }, 1, 0] } 
        },
        avgServiceTime: {
          $avg: {
            $cond: [
              { $and: [{ $eq: ["$status", "COMPLETED"] }, { $ne: ["$servedAt", null] }] },
              { $divide: [{ $subtract: ["$completedAt", "$servedAt"] }, 60000] },
              null
            ]
          }
        }
      }
    }
  ];

  const stats = await Token.aggregate(pipeline);

  // Merge staff info with stats
  const performanceData = staffMembers.map(staff => {
    const stat = stats.find(s => s._id?.toString() === staff._id.toString()) || {
      totalHandled: 0,
      completed: 0,
      noShow: 0,
      skipped: 0,
      avgServiceTime: 0
    };

    const completionRate = stat.totalHandled > 0 ? Math.round((stat.completed / stat.totalHandled) * 100) : 0;
    
    return {
      ...staff,
      stats: {
        totalHandled: stat.totalHandled,
        completed: stat.completed,
        noShow: stat.noShow,
        skipped: stat.skipped,
        avgServiceTime: Math.round(stat.avgServiceTime || 0),
        completionRate
      }
    };
  }).sort((a, b) => b.stats.completed - a.stats.completed); // Sort by highest completed

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Global Staff Performance</h2>
          <p className="text-sm text-slate-500">30-day performance metrics for all staff members.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Staff Leaderboard</CardTitle>
            <div className="flex space-x-2">
               <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">Last 30 Days</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Staff Name</th>
                  <th className="px-6 py-4 text-center">Total Handled</th>
                  <th className="px-6 py-4 text-center">Completed</th>
                  <th className="px-6 py-4 text-center">No-Shows</th>
                  <th className="px-6 py-4 text-center">Avg Service Time</th>
                  <th className="px-6 py-4 text-center">Completion Rate</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {performanceData.map((staff) => (
                  <tr key={staff._id.toString()} className="bg-white hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {staff.fullName}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-slate-700">
                      {staff.stats.totalHandled}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-emerald-600">
                      {staff.stats.completed}
                    </td>
                    <td className="px-6 py-4 text-center text-amber-600">
                      {staff.stats.noShow}
                    </td>
                    <td className="px-6 py-4 text-center text-blue-600 font-medium">
                      {staff.stats.avgServiceTime} min
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        staff.stats.completionRate >= 80 ? 'bg-emerald-100 text-emerald-700' :
                        staff.stats.completionRate >= 50 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {staff.stats.completionRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/staff/${staff._id}/performance`}>
                        <Button variant="outline" size="sm" className="h-8 text-xs text-indigo-600 border-indigo-200" title="Detailed Metrics">
                          <TrendingUp size={14} className="mr-1" />
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
                
                {performanceData.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      No staff members found in your organization.
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
