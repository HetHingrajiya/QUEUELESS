"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function DeleteButton({ 
  url, 
  entityName 
}: { 
  url: string; 
  entityName: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete this ${entityName}? This action cannot be undone.`)) return;
    
    setLoading(true);
    try {
      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();
      
      if (data.success) {
        alert(`${entityName} deleted successfully`);
        router.refresh();
      } else {
        alert(data.message || `Failed to delete ${entityName}`);
      }
    } catch (error) {
      alert(`Error deleting ${entityName}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleDelete}
      disabled={loading}
      className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 border-red-200" 
      title={`Delete ${entityName}`}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
    </Button>
  );
}
