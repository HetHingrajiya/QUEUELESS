"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, Plus, Filter } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Filter size={16} className="mr-2" />
            Filter
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700" size="sm">
            <Plus size={16} className="mr-2" />
            Add New
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Settings Data</CardTitle>
          <CardDescription>Manage and view information related to settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
          
          <div className="border border-slate-200 rounded-md overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="hover:bg-slate-50 transition-colors text-slate-600">
                  <td className="px-4 py-3">#001</td>
                  <td className="px-4 py-3 font-medium text-slate-800">Sample Record 1</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">Active</span>
                  </td>
                  <td className="px-4 py-3">2026-10-04</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" className="text-blue-600">View</Button>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors text-slate-600">
                  <td className="px-4 py-3">#002</td>
                  <td className="px-4 py-3 font-medium text-slate-800">Sample Record 2</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">Pending</span>
                  </td>
                  <td className="px-4 py-3">2026-10-04</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" className="text-blue-600">View</Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
