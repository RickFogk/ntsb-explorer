import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, AlertTriangle, ChevronRight } from 'lucide-react';
import type { AccidentRecord } from '@/types/accident';
import { cn } from '@/lib/utils';

interface AccidentCardProps {
  accident: AccidentRecord;
  onClick: () => void;
}

function getSeverityConfig(severity: string | null) {
  switch (severity) {
    case 'FATL':
      return { label: 'Fatal', className: 'severity-fatal border' };
    case 'SERS':
      return { label: 'Serious', className: 'severity-serious border' };
    case 'MINR':
      return { label: 'Minor', className: 'severity-minor border' };
    case 'NONE':
      return { label: 'No Injury', className: 'severity-none border' };
    default:
      return { label: 'Unknown', className: 'bg-muted text-muted-foreground' };
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Unknown';
  const parts = dateStr.split(' ')[0].split('/');
  if (parts.length !== 3) return dateStr;
  
  const month = parseInt(parts[0]);
  const day = parseInt(parts[1]);
  let year = parseInt(parts[2]);
  if (year < 100) {
    year = year < 50 ? 2000 + year : 1900 + year;
  }
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[month - 1]} ${day}, ${year}`;
}

export function AccidentCard({ accident, onClick }: AccidentCardProps) {
  const severity = getSeverityConfig(accident.highestSeverity);
  const location = [accident.city, accident.state]
    .filter(Boolean)
    .join(', ') || 'Unknown Location';
  const aircraft = [accident.aircraftMake, accident.aircraftModel]
    .filter(Boolean)
    .join(' ') || 'Unknown Aircraft';

  return (
    <Card 
      className={cn(
        "glass-card hover:bg-card/90 transition-all duration-200 cursor-pointer group",
        "hover:border-primary/30 hover:glow-blue"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm text-primary">
                {accident.ntsbNumber || accident.eventId}
              </span>
              <Badge variant="outline" className={severity.className}>
                {severity.label}
              </Badge>
            </div>
            <h3 className="font-display font-semibold text-foreground truncate">
              {aircraft}
            </h3>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(accident.eventDate)}</span>
          </div>
        </div>
        
        {accident.probableCause && (
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground/80 line-clamp-2">
                {accident.probableCause}
              </p>
            </div>
          </div>
        )}

        {((accident.fatalCount || 0) > 0 || (accident.seriousCount || 0) > 0) && (
          <div className="flex gap-3 text-xs">
            {(accident.fatalCount || 0) > 0 && (
              <span className="text-red-400">
                {accident.fatalCount} fatal
              </span>
            )}
            {(accident.seriousCount || 0) > 0 && (
              <span className="text-orange-400">
                {accident.seriousCount} serious
              </span>
            )}
            {(accident.minorCount || 0) > 0 && (
              <span className="text-yellow-400">
                {accident.minorCount} minor
              </span>
            )}
          </div>
        )}

        {(accident.causeCount || 0) > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-0.5 bg-primary/10 text-primary rounded">
              {accident.causeCount} causes
            </span>
            {(accident.factorCount || 0) > 0 && (
              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded">
                {accident.factorCount} factors
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
