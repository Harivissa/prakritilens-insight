import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  Upload, 
  Search, 
  Filter, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  FileText,
  Star,
  Globe,
  Leaf,
  Users,
  Building
} from 'lucide-react';
import { ESGScoreCard } from './ESGScoreCard';
import { FileUpload } from './FileUpload';
import { CompanyAnalysis } from './CompanyAnalysis';
import { SearchFilters } from './SearchFilters';

interface DashboardProps {
  onLogout: () => void;
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-card">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Leaf className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
              PrakritiLens
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies, reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button variant="outline" onClick={onLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="upload">Upload & Analyze</TabsTrigger>
            <TabsTrigger value="companies">Companies</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="gradient-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">1,247</div>
                    <p className="text-xs text-muted-foreground">
                      +12% from last month
                    </p>
                  </CardContent>
                </Card>

                <Card className="gradient-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Companies Analyzed</CardTitle>
                    <Building className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">342</div>
                    <p className="text-xs text-muted-foreground">
                      +7% from last month
                    </p>
                  </CardContent>
                </Card>

                <Card className="gradient-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg ESG Score</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">7.2</div>
                    <p className="text-xs text-success">
                      +0.5 improvement
                    </p>
                  </CardContent>
                </Card>

                <Card className="gradient-card">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">High Risk Companies</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-warning" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">23</div>
                    <p className="text-xs text-warning">
                      -3 from last month
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Analyses */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent ESG Analyses</CardTitle>
                  <CardDescription>Latest company sustainability assessments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockRecentAnalyses.map((analysis, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-smooth">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Building className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{analysis.company}</h4>
                            <p className="text-sm text-muted-foreground">{analysis.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <ESGScoreCard scores={analysis.scores} compact />
                          <Badge variant={analysis.risk === 'Low' ? 'default' : analysis.risk === 'Medium' ? 'secondary' : 'destructive'}>
                            {analysis.risk} Risk
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="upload">
            <FileUpload />
          </TabsContent>

          <TabsContent value="companies">
            <div className="space-y-6">
              <SearchFilters />
              <CompanyAnalysis />
            </div>
          </TabsContent>

          <TabsContent value="insights">
            <Card>
              <CardHeader>
                <CardTitle>ESG Insights & Trends</CardTitle>
                <CardDescription>Industry benchmarks and analytical insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
                  <p className="text-muted-foreground">Advanced analytics and industry insights are being developed.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

const mockRecentAnalyses = [
  {
    company: "Tesla Inc.",
    date: "2 hours ago",
    scores: { environmental: 8.5, social: 7.2, governance: 8.8 },
    risk: "Low"
  },
  {
    company: "Microsoft Corporation",
    date: "1 day ago", 
    scores: { environmental: 9.1, social: 8.7, governance: 9.3 },
    risk: "Low"
  },
  {
    company: "ExxonMobil",
    date: "2 days ago",
    scores: { environmental: 4.2, social: 5.8, governance: 6.1 },
    risk: "High"
  },
  {
    company: "Unilever PLC",
    date: "3 days ago",
    scores: { environmental: 8.9, social: 9.2, governance: 8.4 },
    risk: "Low"
  }
];