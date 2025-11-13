'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Edit2, Check } from 'lucide-react';

interface OptionValue {
  id: string;
  value: string;
  position: number;
}

interface OptionGroup {
  id: string;
  name: string;
  position: number;
  values: OptionValue[];
}

interface OptionGroupsEditorProps {
  productId: string;
  options: OptionGroup[];
  onOptionsChange: () => void;
}

export function OptionGroupsEditor({
  productId,
  options,
  onOptionsChange,
}: OptionGroupsEditorProps) {
  const [newOptionName, setNewOptionName] = useState('');
  const [newValues, setNewValues] = useState<Record<string, string>>({});
  const [editingOption, setEditingOption] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddOption = async () => {
    if (!newOptionName.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/products/${productId}/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newOptionName.trim() }),
      });

      if (response.ok) {
        setNewOptionName('');
        onOptionsChange();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add option');
      }
    } catch (error) {
      console.error('Error adding option:', error);
      alert('Failed to add option');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOption = async (optionId: string) => {
    if (!editingName.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/products/${productId}/options`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: optionId, name: editingName.trim() }),
      });

      if (response.ok) {
        setEditingOption(null);
        setEditingName('');
        onOptionsChange();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update option');
      }
    } catch (error) {
      console.error('Error updating option:', error);
      alert('Failed to update option');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOption = async (optionId: string, optionName: string) => {
    if (!confirm(`Delete option "${optionName}"? This will remove all its values.`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/products/${productId}/options`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: optionId }),
      });

      if (response.ok) {
        onOptionsChange();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete option');
      }
    } catch (error) {
      console.error('Error deleting option:', error);
      alert('Failed to delete option');
    } finally {
      setLoading(false);
    }
  };

  const handleAddValue = async (optionId: string) => {
    const value = newValues[optionId]?.trim();
    if (!value) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/products/${productId}/options/${optionId}/values`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value }),
        }
      );

      if (response.ok) {
        setNewValues({ ...newValues, [optionId]: '' });
        onOptionsChange();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to add value');
      }
    } catch (error) {
      console.error('Error adding value:', error);
      alert('Failed to add value');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteValue = async (optionId: string, valueId: string, valueName: string) => {
    if (!confirm(`Delete value "${valueName}"?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/products/${productId}/options/${optionId}/values`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: valueId }),
        }
      );

      if (response.ok) {
        onOptionsChange();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete value');
      }
    } catch (error) {
      console.error('Error deleting value:', error);
      alert('Failed to delete value');
    } finally {
      setLoading(false);
    }
  };

  const hasValidOptions = options.some(opt => opt.values.length > 0);

  return (
    <div className="space-y-6">
      {/* Add New Option Group */}
      <div className="flex gap-2">
        <Input
          placeholder="Add option (e.g., Size, Color)"
          value={newOptionName}
          onChange={(e) => setNewOptionName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddOption();
          }}
          disabled={loading}
        />
        <Button onClick={handleAddOption} disabled={loading || !newOptionName.trim()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Option
        </Button>
      </div>

      {/* Option Groups List */}
      {options.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No options yet. Add your first option group above.</p>
          <p className="text-sm mt-2">Examples: Size, Color, Material, Style</p>
        </div>
      ) : (
        <div className="space-y-4">
          {options.map((option) => (
            <div key={option.id} className="border rounded-lg p-4">
              {/* Option Header */}
              <div className="flex items-center justify-between mb-3">
                {editingOption === option.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateOption(option.id);
                        if (e.key === 'Escape') {
                          setEditingOption(null);
                          setEditingName('');
                        }
                      }}
                      className="max-w-xs"
                      autoFocus
                      disabled={loading}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleUpdateOption(option.id)}
                      disabled={loading}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingOption(null);
                        setEditingName('');
                      }}
                      disabled={loading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <h3 className="font-semibold text-lg">{option.name}</h3>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingOption(option.id);
                          setEditingName(option.name);
                        }}
                        disabled={loading}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteOption(option.id, option.name)}
                        disabled={loading}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>

              {/* Values */}
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {option.values.map((value) => (
                    <Badge key={value.id} variant="secondary" className="text-sm">
                      {value.value}
                      <button
                        onClick={() => handleDeleteValue(option.id, value.id, value.value)}
                        className="ml-2 hover:text-red-600"
                        disabled={loading}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>

                {/* Add Value Input */}
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder={`Add ${option.name.toLowerCase()} value`}
                    value={newValues[option.id] || ''}
                    onChange={(e) =>
                      setNewValues({ ...newValues, [option.id]: e.target.value })
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddValue(option.id);
                    }}
                    disabled={loading}
                    className="max-w-xs"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleAddValue(option.id)}
                    disabled={loading || !newValues[option.id]?.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Helper Text */}
      {options.length > 0 && !hasValidOptions && (
        <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded">
          Add at least one value to each option before generating variants.
        </div>
      )}
    </div>
  );
}
