"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';

export function AdminActions({ adminId }: { adminId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this administrator?')) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admins/${adminId}`, {
        method: 'DELETE',
      });
      
      const result = await res.json();
      if (result.success) {
        router.refresh();
      } else {
        alert(result.message || 'Failed to delete admin');
      }
    } catch (error) {
      alert('An error occurred while deleting');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex justify-end space-x-2">
      <Link href={`/super-admin/admins/${adminId}/edit`}>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Edit">
          <Edit size={14} className="text-slate-600" />
        </Button>
      </Link>
      <Button 
        variant="outline" 
        size="sm" 
        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" 
        title="Delete"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
      </Button>
    </div>
  );
}
