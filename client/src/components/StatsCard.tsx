import { Card, CardContent } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'default' | 'red' | 'orange' | 'yellow' | 'green' | 'blue';
}

const colorClasses = {
  default: 'text-primary bg-primary/10',
  red: 'text-red-500 bg-red-500/10',
  orange: 'text-orange-500 bg-orange-500/10',
  yellow: 'text-yellow-500 bg-yellow-500/10',
  green: 'text-green-500 bg-green-500/10',
  blue: 'text-blue-500 bg-blue-500/10',
};

export function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  description,
  color = 'default'
}: StatsCardProps) {
  return (
    <Card className="glass-card hover:border-primary/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <p className="text-2xl font-display font-bold">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <div className={cn('p-2 rounded-lg', colorClasses[color])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
