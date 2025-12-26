import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { 
  Filter, X, RotateCcw, AlertCircle, AlertTriangle, 
  MinusCircle, CheckCircle, Search, Check, ChevronsUpDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
  const [makeSearchOpen, setMakeSearchOpen] = useState(false);
  const [makeSearchValue, setMakeSearchValue] = useState('');

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

  // Filter makes based on search
  const filteredMakes = useMemo(() => {
    if (!makeSearchValue) return uniqueMakes.slice(0, 100);
    const search = makeSearchValue.toLowerCase();
    return uniqueMakes.filter(make => 
      make.toLowerCase().includes(search)
    ).slice(0, 100);
  }, [uniqueMakes, makeSearchValue]);

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

              {/* Aircraft Make - Searchable Combobox */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Aircraft Make
                  <span className="text-xs text-muted-foreground ml-2">
                    ({uniqueMakes.length.toLocaleString()} manufacturers)
                  </span>
                </Label>
                <Popover open={makeSearchOpen} onOpenChange={setMakeSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={makeSearchOpen}
                      className="w-full justify-between bg-sidebar-accent font-normal"
                    >
                      {filters.aircraftMake || "All manufacturers"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[280px] p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="Search manufacturers..." 
                        value={makeSearchValue}
                        onValueChange={setMakeSearchValue}
                      />
                      <CommandList>
                        <CommandEmpty>No manufacturer found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="all"
                            onSelect={() => {
                              updateFilter('aircraftMake', '');
                              setMakeSearchOpen(false);
                              setMakeSearchValue('');
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                !filters.aircraftMake ? "opacity-100" : "opacity-0"
                              )}
                            />
                            All manufacturers
                          </CommandItem>
                          {filteredMakes.map((make) => (
                            <CommandItem
                              key={make}
                              value={make}
                              onSelect={() => {
                                updateFilter('aircraftMake', make);
                                setMakeSearchOpen(false);
                                setMakeSearchValue('');
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  filters.aircraftMake === make ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {make}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
