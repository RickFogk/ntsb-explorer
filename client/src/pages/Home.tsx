import { useState, useMemo, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { FilterSidebar } from '@/components/FilterSidebar';
import { AccidentCard } from '@/components/AccidentCard';
import { AccidentDetail } from '@/components/AccidentDetail';
import { StatsCard } from '@/components/StatsCard';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Plane, Database, AlertTriangle, FileText, 
  AlertCircle, MinusCircle, CheckCircle, ChevronDown,
  LayoutGrid, List, Download
} from 'lucide-react';
import type { FilterState } from '@/types/accident';

const ITEMS_PER_PAGE = 24;

export default function Home() {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    severity: [],
    state: '',
    dateFrom: '',
    dateTo: '',
    aircraftMake: '',
    hasProblableCause: false,
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedAccidentId, setSelectedAccidentId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = trpc.accidents.getStats.useQuery();
  
  // Fetch filter options
  const { data: filterOptions } = trpc.accidents.getFilterOptions.useQuery();
  
  // Fetch accidents with filters
  const { data: accidentsData, isLoading: accidentsLoading, error } = trpc.accidents.search.useQuery({
    search: filters.search,
    severity: filters.severity,
    state: filters.state,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    aircraftMake: filters.aircraftMake,
    hasProblableCause: filters.hasProblableCause,
    limit: displayCount,
    offset: 0,
  });

  // Fetch selected accident details
  const { data: selectedAccident } = trpc.accidents.getById.useQuery(
    { id: selectedAccidentId! },
    { enabled: selectedAccidentId !== null }
  );

  const loading = statsLoading || accidentsLoading;

  const handleAccidentClick = useCallback((id: number) => {
    setSelectedAccidentId(id);
    setDetailOpen(true);
  }, []);

  const handleLoadMore = useCallback(() => {
    setDisplayCount(prev => prev + ITEMS_PER_PAGE);
  }, []);

  const handleExportJSON = useCallback(() => {
    if (!accidentsData?.accidents) return;
    const dataStr = JSON.stringify(accidentsData.accidents, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ntsb_filtered_accidents.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [accidentsData]);

  if (loading && !accidentsData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="relative">
            <Plane className="h-16 w-16 mx-auto text-primary animate-pulse" />
          </div>
          <h2 className="font-display text-xl font-semibold">Loading NTSB Database</h2>
          <p className="text-muted-foreground text-sm">
            Fetching accident records...
          </p>
          <Progress value={50} className="h-2" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md px-4">
          <AlertCircle className="h-16 w-16 mx-auto text-destructive" />
          <h2 className="font-display text-xl font-semibold">Error Loading Data</h2>
          <p className="text-muted-foreground">{error.message}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const accidents = accidentsData?.accidents || [];
  const totalCount = accidentsData?.total || 0;

  return (
    <div className="min-h-screen bg-background flex">
      <FilterSidebar
        filters={filters}
        onFiltersChange={setFilters}
        uniqueStates={filterOptions?.states || []}
        uniqueMakes={filterOptions?.makes || []}
        resultCount={totalCount}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <main className="flex-1 min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="container py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="font-display text-2xl font-bold flex items-center gap-3">
                  <Plane className="h-7 w-7 text-primary" />
                  NTSB Aviation Accident Explorer
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Explore probable causes and contributing factors for LLM training
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportJSON}
                  disabled={accidents.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export JSON
                </Button>
                <div className="hidden sm:flex items-center border border-border rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="container py-6 space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <StatsCard
              title="Total Events"
              value={stats?.totalEvents || 0}
              icon={Database}
              color="blue"
            />
            <StatsCard
              title="With Probable Cause"
              value={stats?.eventsWithProbableCause || 0}
              icon={AlertTriangle}
              color="default"
            />
            <StatsCard
              title="With Findings"
              value={stats?.eventsWithFindings || 0}
              icon={FileText}
              color="default"
            />
            <StatsCard
              title="Fatal"
              value={stats?.fatalAccidents || 0}
              icon={AlertCircle}
              color="red"
            />
            <StatsCard
              title="Serious"
              value={stats?.seriousAccidents || 0}
              icon={AlertTriangle}
              color="orange"
            />
            <StatsCard
              title="Minor"
              value={stats?.minorAccidents || 0}
              icon={MinusCircle}
              color="yellow"
            />
            <StatsCard
              title="No Injury"
              value={stats?.noInjuryAccidents || 0}
              icon={CheckCircle}
              color="green"
            />
          </div>

          {/* Results */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-lg">
                {totalCount === stats?.totalEvents 
                  ? 'All Accidents' 
                  : `Filtered Results (${totalCount.toLocaleString()})`
                }
              </h2>
              {accidents.length < totalCount && (
                <p className="text-sm text-muted-foreground">
                  Showing {accidents.length.toLocaleString()} of {totalCount.toLocaleString()}
                </p>
              )}
            </div>

            {accidents.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-display font-semibold text-lg mb-2">No Results Found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters to find more accidents.
                </p>
              </div>
            ) : (
              <>
                <div className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'
                    : 'space-y-3'
                }>
                  {accidents.map((accident) => (
                    <AccidentCard
                      key={accident.id}
                      accident={accident}
                      onClick={() => handleAccidentClick(accident.id)}
                    />
                  ))}
                </div>

                {accidents.length < totalCount && (
                  <div className="flex justify-center mt-8">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={handleLoadMore}
                      className="gap-2"
                    >
                      <ChevronDown className="h-4 w-4" />
                      Load More ({Math.min(ITEMS_PER_PAGE, totalCount - accidents.length)} more)
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <AccidentDetail
        accident={selectedAccident || null}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
}
