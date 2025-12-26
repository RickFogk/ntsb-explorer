import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Filter, X, RotateCcw, AlertCircle, AlertTriangle, 
  MinusCircle, CheckCircle, Search
} from 'lucide-react';
import type { FilterState, SeverityLevel } from '@/types/accident';

interface FilterSidebarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  uniqueStates: string[];
  uniqueMakes: string[];
  resultCount: number;
  isOpen: boolean;
  onToggle: () => void;
}

const severityOptions: { value: SeverityLevel; label: string; icon: typeof AlertCircle; color: string }[] = [
  { value: 'FATL', label: 'Fatal', icon: AlertCircle, color: 'text-red-500' },
  { value: 'SERS', label: 'Serious', icon: AlertTriangle, color: 'text-orange-500' },
  { value: 'MINR', label: 'Minor', icon: MinusCircle, color: 'text-yellow-500' },
  { value: 'NONE', label: 'No Injury', icon: CheckCircle, color: 'text-green-500' },
];

export function FilterSidebar({ 
  filters, 
  onFiltersChange, 
  uniqueStates, 
  uniqueMakes,
  resultCount,
  isOpen,
  onToggle
}: FilterSidebarProps) {
  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleSeverity = (severity: SeverityLevel) => {
    const current = filters.severity;
    if (current.includes(severity)) {
      updateFilter('severity', current.filter(s => s !== severity));
    } else {
      updateFilter('severity', [...current, severity]);
    }
  };

  const resetFilters = () => {
    onFiltersChange({
      search: '',
      severity: [],
      state: '',
      dateFrom: '',
      dateTo: '',
      aircraftMake: '',
      hasProblableCause: false,
    });
  };

  const hasActiveFilters = filters.search || 
    filters.severity.length > 0 || 
    filters.state || 
    filters.dateFrom || 
    filters.dateTo || 
    filters.aircraftMake ||
    filters.hasProblableCause;

  return (
    <>
      {/* Mobile toggle button */}
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 z-50 lg:hidden h-12 w-12 rounded-full shadow-lg"
        onClick={onToggle}
      >
        <Filter className="h-5 w-5" />
      </Button>

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:sticky top-0 left-0 z-40 h-screen w-80 
          bg-sidebar border-r border-sidebar-border
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-lg flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                Filters
              </h2>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={resetFilters}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Reset
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={onToggle}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {resultCount.toLocaleString()} results
            </p>
          </div>

          {/* Filters */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search" className="text-sm font-medium">
                  Search
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search accidents..."
                    value={filters.search}
                    onChange={(e) => updateFilter('search', e.target.value)}
                    className="pl-9 bg-sidebar-accent"
                  />
                </div>
              </div>

              <Separator />

              {/* Severity */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Injury Severity</Label>
                <div className="space-y-2">
                  {severityOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <div 
                        key={option.value}
                        className="flex items-center space-x-3"
                      >
                        <Checkbox
                          id={`severity-${option.value}`}
                          checked={filters.severity.includes(option.value)}
                          onCheckedChange={() => toggleSeverity(option.value)}
                        />
                        <label
                          htmlFor={`severity-${option.value}`}
                          className={`flex items-center gap-2 text-sm cursor-pointer ${option.color}`}
                        >
                          <Icon className="h-4 w-4" />
                          {option.label}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* State */}
              <div className="space-y-2">
                <Label htmlFor="state" className="text-sm font-medium">
                  State
                </Label>
                <Select 
                  value={filters.state} 
                  onValueChange={(value) => updateFilter('state', value === 'all' ? '' : value)}
                >
                  <SelectTrigger className="bg-sidebar-accent">
                    <SelectValue placeholder="All states" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All states</SelectItem>
                    {uniqueStates.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Aircraft Make */}
              <div className="space-y-2">
                <Label htmlFor="make" className="text-sm font-medium">
                  Aircraft Make
                </Label>
                <Select 
                  value={filters.aircraftMake} 
                  onValueChange={(value) => updateFilter('aircraftMake', value === 'all' ? '' : value)}
                >
                  <SelectTrigger className="bg-sidebar-accent">
                    <SelectValue placeholder="All manufacturers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All manufacturers</SelectItem>
                    {uniqueMakes.slice(0, 100).map((make) => (
                      <SelectItem key={make} value={make}>
                        {make}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Date Range */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Date Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="dateFrom" className="text-xs text-muted-foreground">
                      From
                    </Label>
                    <Input
                      id="dateFrom"
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => updateFilter('dateFrom', e.target.value)}
                      className="bg-sidebar-accent text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dateTo" className="text-xs text-muted-foreground">
                      To
                    </Label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => updateFilter('dateTo', e.target.value)}
                      className="bg-sidebar-accent text-sm"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Has Probable Cause */}
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="hasProbableCause"
                  checked={filters.hasProblableCause}
                  onCheckedChange={(checked) => updateFilter('hasProblableCause', !!checked)}
                />
                <label
                  htmlFor="hasProbableCause"
                  className="text-sm cursor-pointer"
                >
                  Has probable cause determination
                </label>
              </div>
            </div>
          </ScrollArea>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
}
