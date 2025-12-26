import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, Users, Plane, Cloud, Building2, HelpCircle,
  Search, ChevronRight, ArrowLeft, Download, Copy, FileText
} from 'lucide-react';
import { Link } from 'wouter';
import { toast } from 'sonner';

// Category definitions based on NTSB taxonomy
const CATEGORY_CONFIG = {
  'Personnel issues': {
    icon: Users,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    description: 'Human factors including pilot actions, decisions, and performance'
  },
  'Aircraft': {
    icon: Plane,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    description: 'Mechanical issues, systems failures, and aircraft performance'
  },
  'Environmental issues': {
    icon: Cloud,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    description: 'Weather conditions, terrain, and physical environment'
  },
  'Organizational issues': {
    icon: Building2,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    description: 'Management, oversight, and organizational factors'
  },
  'Not determined': {
    icon: HelpCircle,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
    description: 'Cause could not be determined from available evidence'
  }
};

interface CategoryStats {
  category: string;
  total: number;
  causes: number;
  factors: number;
  subcategories: { name: string; count: number }[];
}

interface FindingDetail {
  fullPath: string;
  category: string;
  subcategory: string;
  detail: string;
  isCause: boolean;
  count: number;
}

export default function CausesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch category statistics
  const { data: categoryStats, isLoading } = trpc.accidents.getCategoryStats.useQuery();

  // Process findings into categories
  const processedData = categoryStats || null;

  const filteredFindings = useMemo(() => {
    if (!processedData?.findings) return [];
    
    let findings = processedData.findings;
    
    if (selectedCategory) {
      findings = findings.filter(f => f.category === selectedCategory);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      findings = findings.filter(f => 
        f.fullPath.toLowerCase().includes(term) ||
        f.category.toLowerCase().includes(term) ||
        f.subcategory.toLowerCase().includes(term)
      );
    }
    
    return findings;
  }, [processedData, selectedCategory, searchTerm]);

  const exportData = () => {
    if (!processedData) return;
    
    const exportObj = {
      summary: {
        totalFindings: processedData.totalFindings,
        totalCauses: processedData.totalCauses,
        totalFactors: processedData.totalFactors,
        categories: processedData.categories
      },
      findings: processedData.findings
    };
    
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ntsb_causes_categories.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Category data exported successfully');
  };

  const copyFinding = (finding: FindingDetail) => {
    const text = `${finding.fullPath} (${finding.isCause ? 'Cause' : 'Factor'}) - ${finding.count} occurrences`;
    navigator.clipboard.writeText(text);
    toast.success('Finding copied to clipboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Analyzing causes and factors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Explorer
                </Button>
              </Link>
              <div>
                <h1 className="font-display text-xl font-bold flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Causes & Contributing Factors
                </h1>
                <p className="text-sm text-muted-foreground">
                  Categorized analysis of accident causes for LLM training
                </p>
              </div>
            </div>
            <Button onClick={exportData} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Categories
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6">
        {/* Summary Stats */}
        {processedData && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary">
                  {processedData.totalFindings.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total Findings</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-red-500">
                  {processedData.totalCauses.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Direct Causes</div>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-amber-500">
                  {processedData.totalFactors.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Contributing Factors</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Category Overview</TabsTrigger>
            <TabsTrigger value="browse">Browse Findings</TabsTrigger>
            <TabsTrigger value="export">Export for LLM</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {processedData?.categories.map((cat) => {
                const config = CATEGORY_CONFIG[cat.category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG['Not determined'];
                const Icon = config.icon;
                const percentage = processedData.totalFindings > 0 
                  ? (cat.total / processedData.totalFindings) * 100 
                  : 0;

                return (
                  <Card 
                    key={cat.category}
                    className={`glass-card cursor-pointer transition-all hover:scale-[1.02] ${
                      selectedCategory === cat.category ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => {
                      setSelectedCategory(selectedCategory === cat.category ? null : cat.category);
                      setActiveTab('browse');
                    }}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <div className={`p-2 rounded-lg ${config.bgColor}`}>
                          <Icon className={`h-5 w-5 ${config.color}`} />
                        </div>
                        <span className="flex-1">{cat.category}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground mb-3">
                        {config.description}
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total findings</span>
                          <span className="font-semibold">{cat.total.toLocaleString()}</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{percentage.toFixed(1)}% of all findings</span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="text-red-400 border-red-400/50">
                            {cat.causes} causes
                          </Badge>
                          <Badge variant="outline" className="text-amber-400 border-amber-400/50">
                            {cat.factors} factors
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Top subcategories */}
                      {cat.subcategories.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-border">
                          <p className="text-xs text-muted-foreground mb-2">Top subcategories:</p>
                          <div className="space-y-1">
                            {cat.subcategories.slice(0, 3).map((sub) => (
                              <div key={sub.name} className="flex justify-between text-xs">
                                <span className="text-foreground/80 truncate">{sub.name}</span>
                                <span className="text-muted-foreground">{sub.count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Browse Tab */}
          <TabsContent value="browse" className="space-y-4">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search findings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {selectedCategory && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                >
                  Clear filter: {selectedCategory}
                </Button>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              {Object.entries(CATEGORY_CONFIG).map(([cat, config]) => {
                const Icon = config.icon;
                return (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                    className="gap-2"
                  >
                    <Icon className={`h-4 w-4 ${selectedCategory === cat ? '' : config.color}`} />
                    {cat}
                  </Button>
                );
              })}
            </div>

            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {filteredFindings.map((finding, idx) => {
                  const config = CATEGORY_CONFIG[finding.category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG['Not determined'];
                  const Icon = config.icon;
                  
                  return (
                    <Card key={idx} className={`glass-card ${config.borderColor} border`}>
                      <CardContent className="py-3">
                        <div className="flex items-start gap-3">
                          <div className={`p-1.5 rounded ${config.bgColor} mt-0.5`}>
                            <Icon className={`h-4 w-4 ${config.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge 
                                variant="outline" 
                                className={finding.isCause 
                                  ? 'text-red-400 border-red-400/50' 
                                  : 'text-amber-400 border-amber-400/50'
                                }
                              >
                                {finding.isCause ? 'CAUSE' : 'FACTOR'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {finding.count.toLocaleString()} occurrences
                              </span>
                            </div>
                            <p className="text-sm font-medium">{finding.fullPath}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span>{finding.category}</span>
                              {finding.subcategory && (
                                <>
                                  <ChevronRight className="h-3 w-3" />
                                  <span>{finding.subcategory}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => copyFinding(finding)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                
                {filteredFindings.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No findings match your search criteria</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-primary" />
                  Export for LLM Training
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Export categorized cause and factor data in formats optimized for LLM fine-tuning.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="bg-muted/30">
                    <CardContent className="pt-4">
                      <h4 className="font-semibold mb-2">Category Summary JSON</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Hierarchical structure with categories, subcategories, and counts.
                      </p>
                      <Button onClick={exportData} className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Export Categories
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-muted/30">
                    <CardContent className="pt-4">
                      <h4 className="font-semibold mb-2">Full Database</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Complete accident records with all fields in JSONL format.
                      </p>
                      <Link href="/">
                        <Button variant="outline" className="w-full">
                          <FileText className="h-4 w-4 mr-2" />
                          Go to Explorer
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <h4 className="font-semibold text-primary mb-2">Data Structure</h4>
                  <pre className="text-xs text-muted-foreground overflow-x-auto">
{`{
  "summary": {
    "totalFindings": 71803,
    "totalCauses": 48234,
    "totalFactors": 23569,
    "categories": [
      {
        "category": "Personnel issues",
        "total": 29153,
        "causes": 19234,
        "factors": 9919,
        "subcategories": [...]
      }
    ]
  },
  "findings": [
    {
      "fullPath": "Personnel issues-Task performance-Aircraft control",
      "category": "Personnel issues",
      "subcategory": "Task performance",
      "detail": "Aircraft control",
      "isCause": true,
      "count": 5234
    }
  ]
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
