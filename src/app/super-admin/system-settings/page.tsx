import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SystemSettingsPage() {
  return (
    <div className="space-y-6 p-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">System Settings</h2>
          <p className="text-sm text-slate-500">Configure global QueueLess parameters.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Queue Configuration</CardTitle>
          <CardDescription>Global defaults for queue behavior across all organizations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="maxQueue">Maximum Queue Size per Counter</Label>
              <Input id="maxQueue" type="number" defaultValue="100" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="noShowTimeout">No-show Timeout (minutes)</Label>
              <Input id="noShowTimeout" type="number" defaultValue="5" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="checkInBuffer">Check-in Buffer (minutes)</Label>
              <Input id="checkInBuffer" type="number" defaultValue="15" />
              <p className="text-xs text-slate-500">How early a citizen can check in before estimated turn.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="aiRefreshRate">AI Prediction Refresh Rate (seconds)</Label>
              <Input id="aiRefreshRate" type="number" defaultValue="30" />
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
      
      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
          <CardDescription>Manage platform security policies.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input id="sessionTimeout" type="number" defaultValue="120" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
              <Input id="passwordExpiry" type="number" defaultValue="90" />
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Save size={16} className="mr-2" />
              Save Security
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
