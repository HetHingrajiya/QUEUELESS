export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import dbConnect from '@/lib/db';
import { PriorityRule } from '@/models/PriorityRule';
import { PriorityRuleActions } from './PriorityRuleActions';

async function getRules() {
  await dbConnect();
  const rules = await PriorityRule.find().populate('organizationId').populate('officeId').sort({ createdAt: -1 });
  return rules;
}

export default async function PriorityRulesPage() {
  const rules = await getRules();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Priority Rules</h2>
          <p className="text-sm text-slate-500">Configure AI dynamic priority multipliers.</p>
        </div>
        <Link href="/super-admin/priority-rules/add">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus size={18} className="mr-2" />
            Add Rule
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-4">Rule Name</th>
                  <th scope="col" className="px-6 py-4">Organization</th>
                  <th scope="col" className="px-6 py-4">Description</th>
                  <th scope="col" className="px-6 py-4">Multiplier</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule._id.toString()} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-900">{rule.name}</td>
                    <td className="px-6 py-4">
                      {rule.organizationId ? (rule.organizationId as any).name : '-'}
                      {rule.officeId && <div className="text-xs text-slate-400">{(rule.officeId as any).name}</div>}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{rule.description}</td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        {rule.priorityMultiplier.toFixed(1)}x
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {rule.status === 'ACTIVE' ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold border bg-emerald-100 text-emerald-700 border-emerald-200">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold border bg-slate-100 text-slate-700 border-slate-200">
                          INACTIVE
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <PriorityRuleActions ruleId={rule._id.toString()} />
                    </td>
                  </tr>
                ))}
                
                {rules.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      No priority rules found.
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
