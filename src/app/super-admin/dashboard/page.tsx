// The dashboard reads live MongoDB counts; never prerender it at build time.
export const dynamic = 'force-dynamic';

import { StatCard } from '@/components/common/StatCard';
import { Building2, MapPin, Users, UserCog, User, Ticket, CheckCircle2, Clock, XCircle, Timer } from 'lucide-react';
import dbConnect from '@/lib/db';
import { Organization } from '@/models/Organization';
import { Office } from '@/models/Office';
import { User as UserModel, UserRole } from '@/models/User';
import { Token, TokenStatus } from '@/models/Token';
import { DashboardCharts } from './DashboardCharts';

async function getDashboardStats() {
  await dbConnect();
  
  const [
    totalOrgs,
    totalOffices,
    totalAdmins,
    totalStaff,
    totalCitizens,
  ] = await Promise.all([
    Organization.countDocuments(),
    Office.countDocuments(),
    UserModel.countDocuments({ role: UserRole.ADMIN }),
    UserModel.countDocuments({ role: UserRole.STAFF }),
    UserModel.countDocuments({ role: UserRole.CITIZEN }),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    todaysTokens,
    completedTokens,
    waitingTokens,
    noShowTokens,
    hourlyCounts,
    serviceCounts,
  ] = await Promise.all([
    Token.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
    Token.countDocuments({ createdAt: { $gte: today, $lt: tomorrow }, status: TokenStatus.COMPLETED }),
    Token.countDocuments({ createdAt: { $gte: today, $lt: tomorrow }, status: TokenStatus.WAITING }),
    Token.countDocuments({ createdAt: { $gte: today, $lt: tomorrow }, status: TokenStatus.NO_SHOW }),
    Token.aggregate([
      { $match: { createdAt: { $gte: today, $lt: tomorrow } } },
      { $group: { _id: { $hour: '$createdAt' }, queue: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Token.aggregate([
      { $match: { serviceId: { $exists: true, $ne: null } } },
      { $lookup: { from: 'services', localField: 'serviceId', foreignField: '_id', as: 'service' } },
      { $group: { _id: { $ifNull: [{ $arrayElemAt: ['$service.name', 0] }, 'Unassigned service'] }, value: { $sum: 1 } } },
      { $sort: { value: -1 } },
      { $limit: 8 },
    ]),
  ]);

  const completedDocs = await Token.find({ 
    createdAt: { $gte: today }, 
    status: TokenStatus.COMPLETED,
    checkInTime: { $exists: true },
    callTime: { $exists: true }
  });

  let totalWaitTime = 0;
  completedDocs.forEach(doc => {
    if (doc.callTime && doc.checkInTime) {
      totalWaitTime += (doc.callTime.getTime() - doc.checkInTime.getTime());
    }
  });

  const avgWaitTimeMinutes = completedDocs.length > 0 
    ? Math.round(totalWaitTime / completedDocs.length / 60000) 
    : 0;

  const noShowRate = todaysTokens > 0 
    ? Math.round((noShowTokens / todaysTokens) * 100) 
    : 0;

  return {
    totalOrgs,
    totalOffices,
    totalAdmins,
    totalStaff,
    totalCitizens,
    todaysTokens,
    completedTokens,
    waitingTokens,
    avgWaitTimeMinutes,
    noShowRate,
    hourlyData: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      time: hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`,
      queue: hourlyCounts.find((item: { _id: number }) => item._id === hour)?.queue ?? 0,
    })),
    serviceData: serviceCounts.map((item: { _id: string; value: number }) => ({
      name: item._id,
      value: item.value,
    })),
  };
}

export default async function SuperAdminDashboard() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6 lg:space-y-8 pb-20 max-w-6xl mx-auto pt-4 cursor-default">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 lg:mb-8 px-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-semibold mt-1">Real-time statistics across the Queueless platform.</p>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 space-y-6 lg:space-y-8">
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Row 1: System Stats */}
            <StatCard title="Organizations" value={stats.totalOrgs} icon={<Building2 size={20} className="text-blue-500" />} />
            <StatCard title="Offices" value={stats.totalOffices} icon={<MapPin size={20} className="text-green-500" />} />
            <StatCard title="Admins" value={stats.totalAdmins} icon={<UserCog size={20} className="text-purple-500" />} />
            <StatCard title="Staff" value={stats.totalStaff} icon={<Users size={20} className="text-orange-500" />} />
            <StatCard title="Citizens" value={stats.totalCitizens} icon={<User size={20} className="text-pink-500" />} />
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Row 2: Today's Queue Stats */}
            <StatCard title="Today's Tokens" value={stats.todaysTokens} icon={<Ticket size={20} className="text-blue-600" />} />
            <StatCard title="Completed" value={stats.completedTokens} icon={<CheckCircle2 size={20} className="text-emerald-500" />} />
            <StatCard title="Waiting" value={stats.waitingTokens} icon={<Clock size={20} className="text-amber-500" />} />
            <StatCard title="Avg Wait Time" value={`${stats.avgWaitTimeMinutes} min`} icon={<Timer size={20} className="text-indigo-500" />} />
            <StatCard title="No-Show Rate" value={`${stats.noShowRate}%`} icon={<XCircle size={20} className="text-red-500" />} />
         </div>

         {/* Charts Section */}
         <DashboardCharts hourlyData={stats.hourlyData} serviceData={stats.serviceData} />
      </div>
    </div>
  );
}
