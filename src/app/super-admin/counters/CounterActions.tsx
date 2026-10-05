"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';

export function CounterActions({ counterId }: { counterId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this counter?')) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/counters/${counterId}`, {
        method: 'DELETE',
      });
      
      const result = await res.json();
      if (result.success) {
        router.refresh();
      } else {
        alert(result.message || 'Failed to delete counter');
      }
    } catch (error) {
      alert('An error occurred while deleting');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex justify-end space-x-2">
      <Link href={`/super-admin/counters/${counterId}/edit`}>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Edit">
          <Edit size={14} className="text-slate-600" />
        </Button>
      </Link>
      <Button 
        variant="outline" 
        size="sm" 
        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 border-red-200" 
        title="Delete"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
      </Button>
    </div>
  );
}
