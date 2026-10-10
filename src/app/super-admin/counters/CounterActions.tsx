"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

export function CounterActions({ counterId }: { counterId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this counter?')) {
      return;
    }
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/counters/${counterId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        window.location.reload();
      } else {
        alert(data.message || 'Failed to delete counter');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while deleting.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex justify-end gap-3">
      <Link href={`/super-admin/counters/${counterId}/edit`}>
        <button 
          className="w-10 h-10 flex items-center justify-center bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-xl transition-all border-0 text-slate-500 hover:text-primary" 
          title="Edit"
        >
          <Edit size={16} />
        </button>
      </Link>
      
      <button 
        className="w-10 h-10 flex items-center justify-center bg-background shadow-neu hover:shadow-neu-hover active:shadow-neu-inset rounded-xl transition-all border-0 text-red-400 hover:text-red-500 disabled:opacity-50" 
        title="Delete"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
