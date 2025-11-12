'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pencil, Trash2, Check, X, GitMerge, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OrganizationItem {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

interface OrganizationTableProps {
  type: 'category' | 'tag' | 'brand';
  items: OrganizationItem[];
  onUpdate: (items: OrganizationItem[]) => void;
}

export function OrganizationTable({ type, items, onUpdate }: OrganizationTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [mergeId, setMergeId] = useState<string | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState<string | null>(null);
  const { toast } = useToast();

  const apiEndpoint = type === 'category' ? 'categories' : type === 'tag' ? 'tags' : 'brands';

  const startEdit = (item: OrganizationItem) => {
    setEditingId(item.id);
    setEditValue(item.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveEdit = async (id: string) => {
    if (!editValue.trim()) {
      toast({
        title: 'Error',
        description: 'Name cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`/api/${apiEndpoint}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editValue.trim() }),
      });

      if (!response.ok) throw new Error('Failed to update');

      const data = await response.json();
      onUpdate(items.map(item => item.id === id ? { ...item, name: data.name, slug: data.slug } : item));
      
      toast({
        title: 'Success',
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully`,
      });
      
      cancelEdit();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/${apiEndpoint}/${deleteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      onUpdate(items.filter(item => item.id !== deleteId));
      
      toast({
        title: 'Success',
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`,
      });
      
      setDeleteId(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleMerge = async () => {
    if (!mergeId || !mergeTargetId) return;

    try {
      const response = await fetch(`/api/${apiEndpoint}/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: mergeId,
          targetId: mergeTargetId,
        }),
      });

      if (!response.ok) throw new Error('Failed to merge');

      // Remove source item and update target count
      const sourceItem = items.find(i => i.id === mergeId);
      const targetItem = items.find(i => i.id === mergeTargetId);
      
      if (sourceItem && targetItem) {
        onUpdate(
          items
            .filter(item => item.id !== mergeId)
            .map(item => 
              item.id === mergeTargetId 
                ? { ...item, productCount: item.productCount + sourceItem.productCount }
                : item
            )
        );
      }
      
      toast({
        title: 'Success',
        description: `Merged successfully. All products updated.`,
      });
      
      setMergeId(null);
      setMergeTargetId(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to merge. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const itemToDelete = items.find(i => i.id === deleteId);
  const itemToMerge = items.find(i => i.id === mergeId);
  const mergeOptions = items.filter(i => i.id !== mergeId);

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Products</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  No {type}s yet. Create one from the product editor.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {editingId === item.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(item.id);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                          className="max-w-xs"
                          autoFocus
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => saveEdit(item.id)}
                        >
                          <Check className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={cancelEdit}
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <span className="font-medium">{item.name}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.productCount > 0 ? 'default' : 'secondary'}>
                      {item.productCount} {item.productCount === 1 ? 'product' : 'products'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => startEdit(item)}
                        disabled={editingId !== null}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setMergeId(item.id)}
                        disabled={items.length < 2}
                      >
                        <GitMerge className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteId(item.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {type}?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              {itemToDelete && itemToDelete.productCount > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-semibold">
                      This {type} is used in {itemToDelete.productCount} product{itemToDelete.productCount !== 1 ? 's' : ''}.
                    </span>
                  </div>
                  <div>
                    Deleting it will remove it from all products. This action cannot be undone.
                  </div>
                </div>
              ) : (
                <div>
                  Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Merge Dialog */}
      <AlertDialog open={mergeId !== null} onOpenChange={() => { setMergeId(null); setMergeTargetId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Merge {type}</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-4 mt-4">
                <p>
                  Merge "{itemToMerge?.name}" into another {type}. All products will be updated to use the target {type}.
                </p>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Select target {type}:
                  </label>
                  <Select value={mergeTargetId || ''} onValueChange={setMergeTargetId}>
                    <SelectTrigger>
                      <SelectValue placeholder={`Choose a ${type}...`} />
                    </SelectTrigger>
                    <SelectContent>
                      {mergeOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name} ({option.productCount} products)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMergeTargetId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleMerge} disabled={!mergeTargetId}>
              Merge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
