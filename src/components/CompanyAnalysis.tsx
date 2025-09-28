import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ESGScoreCard } from './ESGScoreCard';
import { Building, TrendingUp, AlertTriangle, FileText, Calendar, ExternalLink } from 'lucide-react';

export function CompanyAnalysis() {
  return (
    <div className="grid gap-6">
      {/* Company Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockCompanies.map((company, index) => (
          <CompanyCard key={index} company={company} />
        ))}
      </div>

      {/* Detailed Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Company Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Tesla Inc.</h3>
                  <ESGScoreCard 
                    scores={{ environmental: 8.5, social: 7.2, governance: 8.8 }}
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Key Metrics</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Market Cap</div>
                        <div className="font-semibold">$789B</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Industry</div>
                        <div className="font-semibold">Automotive</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Employees</div>
                        <div className="font-semibold">127,855</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Last Report</div>
                        <div className="font-semibold">Q3 2024</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">ESG Highlights</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-success">
                        <div className="w-2 h-2 bg-success rounded-full"></div>
                        Leading in electric vehicle innovation
                      </div>
                      <div className="flex items-center gap-2 text-success">
                        <div className="w-2 h-2 bg-success rounded-full"></div>
                        Renewable energy integration
                      </div>
                      <div className="flex items-center gap-2 text-warning">
                        <div className="w-2 h-2 bg-warning rounded-full"></div>
                        Board diversity improvements needed
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="trends">
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Trend Analysis</h3>
                <p className="text-muted-foreground">Year-over-year ESG performance tracking coming soon.</p>
              </div>
            </TabsContent>

            <TabsContent value="benchmarks">
              <div className="text-center py-12">
                <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Industry Benchmarks</h3>
                <p className="text-muted-foreground">Compare against industry peers and standards.</p>
              </div>
            </TabsContent>

            <TabsContent value="reports">
              <div className="space-y-4">
                {mockReports.map((report, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <h4 className="font-medium">{report.title}</h4>
                        <p className="text-sm text-muted-foreground">{report.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{report.type}</Badge>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function CompanyCard({ company }: { company: any }) {
  return (
    <Card className="gradient-card hover:shadow-elegant transition-smooth">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{company.name}</CardTitle>
          </div>
          <Badge variant={company.risk === 'Low' ? 'default' : company.risk === 'Medium' ? 'secondary' : 'destructive'}>
            {company.risk} Risk
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{company.industry}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <ESGScoreCard scores={company.scores} compact />
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Last Updated</span>
          <span className="font-medium">{company.lastUpdate}</span>
        </div>

        <Button variant="outline" size="sm" className="w-full">
          View Analysis
        </Button>
      </CardContent>
    </Card>
  );
}

const mockCompanies = [
  {
    name: "Tesla Inc.",
    industry: "Automotive",
    scores: { environmental: 8.5, social: 7.2, governance: 8.8 },
    risk: "Low",
    lastUpdate: "2 days ago"
  },
  {
    name: "Microsoft Corp.",
    industry: "Technology",
    scores: { environmental: 9.1, social: 8.7, governance: 9.3 },
    risk: "Low",
    lastUpdate: "1 day ago"
  },
  {
    name: "ExxonMobil",
    industry: "Energy",
    scores: { environmental: 4.2, social: 5.8, governance: 6.1 },
    risk: "High",
    lastUpdate: "3 days ago"
  },
  {
    name: "Unilever PLC",
    industry: "Consumer Goods",
    scores: { environmental: 8.9, social: 9.2, governance: 8.4 },
    risk: "Low",
    lastUpdate: "1 week ago"
  },
  {
    name: "JP Morgan Chase",
    industry: "Financial Services",
    scores: { environmental: 6.8, social: 7.5, governance: 8.2 },
    risk: "Medium",
    lastUpdate: "5 days ago"
  },
  {
    name: "Amazon.com Inc.",
    industry: "Technology",
    scores: { environmental: 7.3, social: 6.9, governance: 7.8 },
    risk: "Medium",
    lastUpdate: "4 days ago"
  }
];

const mockReports = [
  {
    title: "Tesla Sustainability Report 2024",
    date: "March 15, 2024",
    type: "Sustainability"
  },
  {
    title: "Q4 2023 ESG Performance",
    date: "January 28, 2024",
    type: "Quarterly"
  },
  {
    title: "Climate Action Report",
    date: "November 10, 2023",
    type: "Climate"
  }
];