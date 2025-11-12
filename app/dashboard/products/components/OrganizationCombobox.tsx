'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface Option {
  id: string;
  name: string;
  _count?: { products?: number };
}

interface OrganizationComboboxProps {
  label: string;
  placeholder: string;
  options: Option[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onCreate: (name: string) => Promise<void>;
  multiple?: boolean;
}

export function OrganizationCombobox({
  label,
  placeholder,
  options,
  selectedIds,
  onSelect,
  onRemove,
  onCreate,
  multiple = true,
}: OrganizationComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedOptions = options.filter(opt => selectedIds.includes(opt.id));
  const availableOptions = options.filter(opt => !selectedIds.includes(opt.id));

  const handleSelect = (id: string) => {
    onSelect(id);
    if (!multiple) {
      setOpen(false);
    }
    setSearch('');
  };

  const handleCreate = async () => {
    if (search.trim()) {
      await onCreate(search.trim());
      setSearch('');
      setOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && search.trim()) {
      e.preventDefault();
      handleCreate();
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      
      {/* Selected Items as Badges */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedOptions.map(option => (
            <Badge 
              key={option.id}
              variant="secondary"
              className="pl-2 pr-1 py-1 gap-1"
            >
              <span>{option.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(option.id);
                }}
                className="ml-1 rounded-full hover:bg-muted p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Combobox */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-muted-foreground"
          >
            {placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder={`Search ${label.toLowerCase()}...`}
              value={search}
              onValueChange={setSearch}
              onKeyDown={handleKeyDown}
            />
            <CommandList>
              {availableOptions.length === 0 && !search && (
                <CommandEmpty>No {label.toLowerCase()} found.</CommandEmpty>
              )}
              
              {search && (
                <CommandGroup>
                  <CommandItem
                    onSelect={handleCreate}
                    className="cursor-pointer"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Create "{search}"</span>
                  </CommandItem>
                </CommandGroup>
              )}

              {availableOptions.length > 0 && (
                <CommandGroup heading={search ? 'Existing' : undefined}>
                  {availableOptions.map((option) => (
                    <CommandItem
                      key={option.id}
                      value={option.id}
                      onSelect={() => handleSelect(option.id)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selectedIds.includes(option.id) ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className="flex-1">{option.name}</span>
                      {option._count?.products !== undefined && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {option._count.products} {option._count.products === 1 ? 'product' : 'products'}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
