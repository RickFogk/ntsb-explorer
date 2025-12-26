import type { Accident } from '../../../drizzle/schema';

// Re-export the database type
export type AccidentRecord = Accident;

export type SeverityLevel = 'FATL' | 'SERS' | 'MINR' | 'NONE' | 'UNKN';

export interface FilterState {
  search: string;
  severity: SeverityLevel[];
  state: string;
  dateFrom: string;
  dateTo: string;
  aircraftMake: string;
  hasProblableCause: boolean;
}

export interface DatabaseStats {
  totalEvents: number;
  eventsWithProbableCause: number;
  eventsWithFindings: number;
  fatalAccidents: number;
  seriousAccidents: number;
  minorAccidents: number;
  noInjuryAccidents: number;
}
