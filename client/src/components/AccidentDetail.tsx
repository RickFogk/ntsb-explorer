import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plane, MapPin, Calendar, AlertTriangle, FileText, 
  Users, Cloud, Sun, Moon, Compass, Copy
} from 'lucide-react';
import type { AccidentRecord } from '@/types/accident';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AccidentDetailProps {
  accident: AccidentRecord | null;
  open: boolean;
  onClose: () => void;
}

function getSeverityConfig(severity: string | null) {
  switch (severity) {
    case 'FATL':
      return { label: 'Fatal', className: 'severity-fatal border' };
    case 'SERS':
      return { label: 'Serious Injury', className: 'severity-serious border' };
    case 'MINR':
      return { label: 'Minor Injury', className: 'severity-minor border' };
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
  
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[month - 1]} ${day}, ${year}`;
}

function getLightCondition(light: string | null): { icon: typeof Sun; label: string } {
  switch (light) {
    case 'DAYL':
      return { icon: Sun, label: 'Daylight' };
    case 'NITE':
      return { icon: Moon, label: 'Night' };
    case 'DUSK':
      return { icon: Sun, label: 'Dusk' };
    case 'DAWN':
      return { icon: Sun, label: 'Dawn' };
    default:
      return { icon: Sun, label: light || 'Unknown' };
  }
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: string | null; icon?: typeof Plane }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />}
      <div className="flex-1">
        <dt className="text-xs text-muted-foreground uppercase tracking-wide">{label}</dt>
        <dd className="text-sm text-foreground mt-0.5">{value}</dd>
      </div>
    </div>
  );
}

function FindingsList({ findings }: { findings: string }) {
  const items = findings.split(' | ').filter(Boolean);
  
  return (
    <div className="space-y-2">
      {items.map((finding, index) => {
        const isCause = finding.endsWith(' - C');
        const isFactor = finding.endsWith(' - F');
        const cleanFinding = finding.replace(/ - [CF]$/, '');
        const parts = cleanFinding.split('-').map(p => p.trim());
        
        return (
          <div 
            key={index}
            className={`p-3 rounded-lg border ${
              isCause 
                ? 'bg-primary/5 border-primary/20' 
                : isFactor 
                  ? 'bg-amber-500/5 border-amber-500/20'
                  : 'bg-muted/50 border-border'
            }`}
          >
            <div className="flex items-start gap-2">
              <Badge 
                variant="outline" 
                className={`text-xs flex-shrink-0 ${
                  isCause 
                    ? 'text-primary border-primary/50' 
                    : isFactor 
                      ? 'text-amber-500 border-amber-500/50'
                      : 'text-muted-foreground'
                }`}
              >
                {isCause ? 'CAUSE' : isFactor ? 'FACTOR' : 'FINDING'}
              </Badge>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground font-medium">
                  {parts[0]}
                </p>
                {parts.length > 1 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {parts.slice(1).join(' → ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AccidentDetail({ accident, open, onClose }: AccidentDetailProps) {
  if (!accident) return null;

  const severity = getSeverityConfig(accident.highestSeverity);
  const location = [accident.city, accident.state, accident.country]
    .filter(Boolean)
    .join(', ') || 'Unknown Location';
  const aircraft = [accident.aircraftMake, accident.aircraftModel]
    .filter(Boolean)
    .join(' ') || 'Unknown Aircraft';
  const lightCondition = getLightCondition(accident.lightCondition);
  const LightIcon = lightCondition.icon;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-card border-border">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono text-lg text-primary">
                  {accident.ntsbNumber || accident.eventId}
                </span>
                <Badge variant="outline" className={severity.className}>
                  {severity.label}
                </Badge>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={() => copyToClipboard(accident.ntsbNumber || accident.eventId, 'Case number')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <DialogTitle className="font-display text-xl font-semibold">
                {aircraft}
              </DialogTitle>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span>{location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(accident.eventDate)}</span>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="p-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="cause">Probable Cause</TabsTrigger>
                <TabsTrigger value="findings">Findings</TabsTrigger>
                <TabsTrigger value="narrative">Narrative</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Injuries Summary */}
                <div className="glass-card p-4">
                  <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Injuries
                  </h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-3 rounded-lg bg-red-500/10">
                      <div className="text-2xl font-bold text-red-500">
                        {accident.fatalCount || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Fatal</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-orange-500/10">
                      <div className="text-2xl font-bold text-orange-500">
                        {accident.seriousCount || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Serious</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-yellow-500/10">
                      <div className="text-2xl font-bold text-yellow-500">
                        {accident.minorCount || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">Minor</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-green-500/10">
                      <div className="text-2xl font-bold text-green-500">
                        {accident.highestSeverity === 'NONE' ? '✓' : '-'}
                      </div>
                      <div className="text-xs text-muted-foreground">No Injury</div>
                    </div>
                  </div>
                </div>

                {/* Aircraft & Conditions */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="glass-card p-4">
                    <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
                      <Plane className="h-4 w-4 text-primary" />
                      Aircraft
                    </h3>
                    <dl className="space-y-1">
                      <InfoRow label="Make" value={accident.aircraftMake} />
                      <InfoRow label="Model" value={accident.aircraftModel} />
                      <InfoRow label="Category" value={accident.aircraftCategory} />
                      <InfoRow label="FAR Part" value={accident.farPart} />
                      <InfoRow label="Damage" value={accident.damage} />
                    </dl>
                  </div>

                  <div className="glass-card p-4">
                    <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
                      <Cloud className="h-4 w-4 text-primary" />
                      Conditions
                    </h3>
                    <dl className="space-y-1">
                      <InfoRow label="Weather" value={accident.weather} icon={Cloud} />
                      <InfoRow label="Light" value={lightCondition.label} icon={LightIcon} />
                      <InfoRow label="Flight Phase" value={accident.flightPhase} icon={Compass} />
                    </dl>
                  </div>
                </div>

                {/* Location */}
                <div className="glass-card p-4">
                  <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Location
                  </h3>
                  <dl className="grid md:grid-cols-2 gap-x-6">
                    <InfoRow label="City" value={accident.city} />
                    <InfoRow label="State" value={accident.state} />
                    <InfoRow label="Country" value={accident.country} />
                    <InfoRow 
                      label="Coordinates" 
                      value={accident.latitude && accident.longitude 
                        ? `${accident.latitude}, ${accident.longitude}`
                        : null
                      } 
                    />
                  </dl>
                </div>
              </TabsContent>

              <TabsContent value="cause" className="space-y-4">
                {accident.probableCause ? (
                  <div className="glass-card p-6 glow-amber">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h3 className="font-display font-semibold text-amber-500 mb-3">
                          Probable Cause
                        </h3>
                        <p className="text-foreground leading-relaxed">
                          {accident.probableCause}
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-4"
                          onClick={() => copyToClipboard(accident.probableCause!, 'Probable cause')}
                        >
                          <Copy className="h-3 w-3 mr-2" />
                          Copy
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="glass-card p-6 text-center text-muted-foreground">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No probable cause determination available for this accident.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="findings" className="space-y-4">
                {accident.findings ? (
                  <>
                    <div className="flex items-center gap-4 mb-4">
                      <Badge variant="outline" className="text-primary border-primary/50">
                        {accident.causeCount || 0} Causes
                      </Badge>
                      <Badge variant="outline" className="text-amber-500 border-amber-500/50">
                        {accident.factorCount || 0} Contributing Factors
                      </Badge>
                    </div>
                    <FindingsList findings={accident.findings} />
                  </>
                ) : (
                  <div className="glass-card p-6 text-center text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No findings available for this accident.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="narrative" className="space-y-4">
                {accident.narrativePreliminary && (
                  <div className="glass-card p-6">
                    <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Preliminary Narrative
                    </h3>
                    <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                      {accident.narrativePreliminary}
                    </p>
                  </div>
                )}
                
                {accident.narrativeFactual && (
                  <div className="glass-card p-6">
                    <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Factual Narrative
                    </h3>
                    <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                      {accident.narrativeFactual}
                    </p>
                  </div>
                )}

                {!accident.narrativePreliminary && !accident.narrativeFactual && (
                  <div className="glass-card p-6 text-center text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No narrative available for this accident.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
