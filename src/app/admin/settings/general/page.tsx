"use client";
import { PageHeader } from '@/components/common/PageHeader';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Building2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function GeneralSettingsPage() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    contactNumber: '',
    email: '',
    address: '',
    type: ''
  });

  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        // Get current user to find their organization
        const userRes = await fetch('/api/auth/me');
        const userData = await userRes.json();
        
        if (userData.success && userData.data?.user?.organizationId) {
          const organizationId = userData.data.user.organizationId;
          setOrgId(organizationId);
          
          // Fetch organization details
          const orgRes = await fetch(`/api/organizations/${organizationId}`);
          const orgData = await orgRes.json();
          
          if (orgData.success) {
            setFormData({
              name: orgData.data.name || '',
              code: orgData.data.code || '',
              description: orgData.data.description || '',
              contactNumber: orgData.data.contactNumber || '',
              email: orgData.data.email || '',
              address: orgData.data.address || '',
              type: orgData.data.type || ''
            });
          }
        }
      } catch (error) {
        console.error('Failed to load organization data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initialize();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSave = async () => {
    if (!orgId) return;
    
    try {
      setSaving(true);
      const res = await fetch(`/api/organizations/${orgId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (data.success) {
        alert('Organization details updated successfully.');
      } else {
        alert(data.message || 'Failed to update organization details.');
      }
    } catch (error) {
      console.error('Error saving organization:', error);
      alert('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (!orgId) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">General Settings</h2>
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6 text-center text-red-600">
            You do not have an active organization assigned.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      
      <PageHeader 
        title="General Settings"
        description="Manage your organization's core details and information."
      />


      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Building2 className="text-blue-600" size={20} />
            <CardTitle>Organization Profile</CardTitle>
          </div>
          <CardDescription>Update your public-facing organization details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name <span className="text-red-500">*</span></Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={handleChange} 
                placeholder="E.g., City of Metropolis"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Organization Code</Label>
              <Input 
                id="code" 
                value={formData.code} 
                disabled
                className="bg-slate-50 cursor-not-allowed"
                title="Code cannot be changed"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email">Support Email</Label>
              <Input 
                id="email" 
                type="email"
                value={formData.email} 
                onChange={handleChange} 
                placeholder="contact@organization.gov"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact Phone Number</Label>
              <Input 
                id="contactNumber" 
                value={formData.contactNumber} 
                onChange={handleChange} 
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Organization Type</Label>
            <Input 
              id="type" 
              value={formData.type} 
              disabled
              className="bg-slate-50 cursor-not-allowed"
            />
            <p className="text-xs text-slate-500">Managed by Super Admin.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Headquarters / Main Address</Label>
            <Textarea 
              id="address" 
              value={formData.address} 
              onChange={handleChange} 
              placeholder="Full street address..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">About the Organization</Label>
            <Textarea 
              id="description" 
              value={formData.description} 
              onChange={handleChange} 
              placeholder="Brief description of your organization's services..."
              rows={4}
            />
          </div>
          
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={saving || !formData.name} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Save size={16} className="mr-2" /> Save Organization Details</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
