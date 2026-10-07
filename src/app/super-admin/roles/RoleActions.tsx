"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';

export function RoleActions({ roleId, isSystem }: { roleId: string, isSystem: boolean }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (isSystem) {
       alert('System roles cannot be deleted.');
       return;
    }
    if (!confirm('Are you sure you want to delete this role?')) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE',
      });
      
      const result = await res.json();
      if (result.success) {
        window.location.reload();
      } else {
        alert(result.message || 'Failed to delete role');
      }
    } catch (error) {
      alert('An error occurred while deleting');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex justify-end space-x-2">
      <Link href={isSystem ? '#' : `/super-admin/roles/${roleId}/edit`}>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 w-8 p-0" 
          title={isSystem ? "System roles cannot be edited" : "Edit"}
          disabled={isSystem}
        >
          <Edit size={14} className="text-slate-600" />
        </Button>
      </Link>
      <Button 
        variant="outline" 
        size="sm" 
        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 border-red-200" 
        title={isSystem ? "System roles cannot be deleted" : "Delete"}
        onClick={handleDelete}
        disabled={isDeleting || isSystem}
      >
        {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
      </Button>
    </div>
  );
}
