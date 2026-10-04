import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function PriorityRulesPage() {
  const rules = [
    { id: 1, name: 'Senior Citizen Priority', condition: 'Age >= 65', multiplier: '2.0x', active: true },
    { id: 2, name: 'Pregnant Women', condition: 'Self-declared', multiplier: '1.5x', active: true },
    { id: 3, name: 'Differently Abled', condition: 'Self-declared', multiplier: '3.0x', active: true },
    { id: 4, name: 'VVIP Pass', condition: 'Token matches VVIP list', multiplier: '5.0x', active: false },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Priority Rules</h2>
          <p className="text-sm text-slate-500">Configure AI dynamic priority multipliers.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus size={18} className="mr-2" />
          Add Rule
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-4">Rule Name</th>
                  <th scope="col" className="px-6 py-4">Condition</th>
                  <th scope="col" className="px-6 py-4">Priority Multiplier</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold text-slate-900">{rule.name}</td>
                    <td className="px-6 py-4 font-mono text-xs">{rule.condition}</td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        {rule.multiplier}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {rule.active ? (
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
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Edit">
                          <Edit size={14} className="text-slate-600" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" title="Delete">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
