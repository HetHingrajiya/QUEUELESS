import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function QueueSettingsPage() {
  return (
    <div className="space-y-6 p-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Global Queue Settings</h2>
          <p className="text-sm text-slate-500">Configure core queue algorithms and limitations.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI Prediction Engine</CardTitle>
          <CardDescription>Configure how wait times are calculated globally.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
            <div>
              <Label className="text-base font-semibold">Enable AI Wait Time Prediction</Label>
              <p className="text-sm text-slate-500">Use machine learning to estimate wait times dynamically instead of static averages.</p>
            </div>
            <Switch defaultChecked />
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="historicalWeight">Historical Data Weight (%)</Label>
              <Input id="historicalWeight" type="number" defaultValue="40" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="liveWeight">Live Velocity Weight (%)</Label>
              <Input id="liveWeight" type="number" defaultValue="60" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Token Generation Rules</CardTitle>
          <CardDescription>Configure limits on token generation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="maxTokensUser">Max Daily Tokens per User</Label>
              <Input id="maxTokensUser" type="number" defaultValue="3" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="concurrentTokens">Max Concurrent Active Tokens</Label>
              <Input id="concurrentTokens" type="number" defaultValue="1" />
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Save size={16} className="mr-2" />
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
