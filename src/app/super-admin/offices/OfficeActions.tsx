"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';

export function OfficeActions({ officeId }: { officeId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this office?')) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/offices/${officeId}`, {
        method: 'DELETE',
      });
      
      const result = await res.json();
      if (result.success) {
        window.location.reload();
      } else {
        alert(result.message || 'Failed to delete office');
      }
    } catch (error) {
      alert('An error occurred while deleting');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <Link href={`/super-admin/offices/${officeId}/edit`}>
        <button 
          title="Edit"
          className="w-10 h-10 flex items-center justify-center bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-xl transition-all text-primary border-0"
        >
          <Edit size={16} />
        </button>
      </Link>
      
      <button 
        title="Delete"
        onClick={handleDelete}
        disabled={isDeleting}
        className="w-10 h-10 flex items-center justify-center bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-xl transition-all text-red-500 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed border-0"
      >
        {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
      </button>
    </div>
  );
}
