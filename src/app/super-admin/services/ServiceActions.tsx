"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

export function ServiceActions({ serviceId }: { serviceId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this service?')) {
      return;
    }
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        window.location.reload();
      } else {
        alert(data.message || 'Failed to delete service');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while deleting.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex justify-end space-x-2">
      <Link href={`/super-admin/services/${serviceId}/edit`}>
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
        <Trash2 size={14} />
      </Button>
    </div>
  );
}
