import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function NotificationsPage() {
  return (
    <div className="space-y-6 p-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Notification Settings</h2>
          <p className="text-sm text-slate-500">Configure global SMS, Email, and Push notification templates.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Channels Overview</CardTitle>
          <CardDescription>Toggle notification channels across the platform.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
            <div>
              <Label className="text-base font-semibold">SMS Notifications</Label>
              <p className="text-sm text-slate-500">Send text messages for critical alerts (Twilio).</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
            <div>
              <Label className="text-base font-semibold">Push Notifications</Label>
              <p className="text-sm text-slate-500">Send FCM push notifications to the Flutter app.</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
            <div>
              <Label className="text-base font-semibold">Email Notifications</Label>
              <p className="text-sm text-slate-500">Send emails for account creation and reports.</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Citizen Alerts</CardTitle>
          <CardDescription>Configure when citizens are notified about their queue status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="nPeopleAhead">Notify when N people ahead</Label>
              <Input id="nPeopleAhead" type="number" defaultValue="5" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minutesAhead">Notify when estimated time is &lt; N minutes</Label>
              <Input id="minutesAhead" type="number" defaultValue="15" />
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Save size={16} className="mr-2" />
              Save Configurations
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
