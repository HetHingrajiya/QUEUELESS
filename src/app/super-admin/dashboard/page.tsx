// The dashboard reads live MongoDB counts; never prerender it at build time.
export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  const [
    todaysTokens,
    completedTokens,
    waitingTokens,
    noShowTokens,
  ] = await Promise.all([
    Token.countDocuments({ createdAt: { $gte: today } }),
    Token.countDocuments({ createdAt: { $gte: today }, status: TokenStatus.COMPLETED }),
    Token.countDocuments({ createdAt: { $gte: today }, status: TokenStatus.WAITING }),
    Token.countDocuments({ createdAt: { $gte: today }, status: TokenStatus.NO_SHOW }),
  ]);

  // Calculate average waiting time for completed tokens today
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
    noShowRate
  };
}

export default async function SuperAdminDashboard() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Row 1: System Stats */}
        <StatCard title="Organizations" value={stats.totalOrgs} icon={<Building2 size={20} className="text-blue-500" />} />
        <StatCard title="Offices" value={stats.totalOffices} icon={<MapPin size={20} className="text-green-500" />} />
        <StatCard title="Admins" value={stats.totalAdmins} icon={<UserCog size={20} className="text-purple-500" />} />
        <StatCard title="Staff" value={stats.totalStaff} icon={<Users size={20} className="text-orange-500" />} />
        <StatCard title="Citizens" value={stats.totalCitizens} icon={<User size={20} className="text-pink-500" />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Row 2: Today's Queue Stats */}
        <StatCard title="Today's Tokens" value={stats.todaysTokens} icon={<Ticket size={20} className="text-blue-600" />} />
        <StatCard title="Completed" value={stats.completedTokens} icon={<CheckCircle2 size={20} className="text-emerald-500" />} />
        <StatCard title="Waiting" value={stats.waitingTokens} icon={<Clock size={20} className="text-amber-500" />} />
        <StatCard title="Avg Wait Time" value={`${stats.avgWaitTimeMinutes} min`} icon={<Timer size={20} className="text-indigo-500" />} />
        <StatCard title="No-Show Rate" value={`${stats.noShowRate}%`} icon={<XCircle size={20} className="text-red-500" />} />
      </div>

      {/* Charts Section */}
      <DashboardCharts />
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
      </CardContent>
    </Card>
  );
}
