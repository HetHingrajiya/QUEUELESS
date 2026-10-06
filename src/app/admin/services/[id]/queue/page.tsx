import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, UserSquare2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUserFromCookie } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Service } from '@/models/Service';
import { Token } from '@/models/Token';
import { Counter } from '@/models/Counter';
import mongoose from 'mongoose';

export default async function AdminServiceQueuePage({ params }: { params: Promise<{ id: string }> }) {
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

  // Get active queue for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tokens = await Token.find({ 
    serviceId: id,
    createdAt: { $gte: today }
  }).sort({ createdAt: -1 }).lean();

  const populatedTokens = await Promise.all(tokens.map(async (t) => {
    const counter = t.counterId ? await Counter.findById(t.counterId).select('name number').lean() : null;
    return { 
      ...t, 
      counterName: counter ? `${counter.name} (${counter.number})` : '-'
    };
  }));

  const waitingTokens = populatedTokens.filter(t => t.status === 'WAITING');
  const servingTokens = populatedTokens.filter(t => t.status === 'IN_PROGRESS');
  const otherTokens = populatedTokens.filter(t => t.status !== 'WAITING' && t.status !== 'IN_PROGRESS');

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
            <h2 className="text-2xl font-bold text-slate-800">Live Service Queue</h2>
            <p className="text-sm text-slate-500">{service.name} - Today</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-amber-600 flex items-center">
              <UserSquare2 className="mr-2" size={18} />
              Waiting ({waitingTokens.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {waitingTokens.length === 0 ? (
              <div className="p-6 text-center text-slate-500">No tokens waiting</div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm">
                  <tbody>
                    {waitingTokens.map(token => (
                      <tr key={token._id.toString()} className="border-b hover:bg-slate-50">
                        <td className="p-3">
                          <div className="font-bold text-lg">{token.tokenNumber}</div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="text-xs font-medium text-amber-600">Waiting</div>
                          <div className="text-xs text-slate-400">
                            {new Date(token.createdAt).toLocaleTimeString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-blue-600 flex items-center">
                <RefreshCw className="mr-2" size={18} />
                Serving Now ({servingTokens.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {servingTokens.length === 0 ? (
                <div className="p-6 text-center text-slate-500">No tokens currently being served</div>
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {servingTokens.map(token => (
                      <tr key={token._id.toString()} className="border-b hover:bg-slate-50">
                        <td className="p-3">
                          <div className="font-bold text-lg">{token.tokenNumber}</div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="text-xs font-medium text-blue-600">{token.counterName}</div>
                          <div className="text-xs text-slate-400">
                            {new Date(token.updatedAt).toLocaleTimeString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-slate-700">Completed / Other ({otherTokens.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {otherTokens.length === 0 ? (
                <div className="p-6 text-center text-slate-500">No other activity today</div>
              ) : (
                <div className="max-h-[250px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      {otherTokens.slice(0, 20).map(token => (
                        <tr key={token._id.toString()} className="border-b hover:bg-slate-50">
                          <td className="p-3">
                            <div className="font-medium">{token.tokenNumber}</div>
                          </td>
                          <td className="p-3 text-right">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              token.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                              token.status === 'NO_SHOW' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {token.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {otherTokens.length > 20 && (
                    <div className="p-3 text-center text-xs text-slate-500">
                      Showing 20 of {otherTokens.length}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
