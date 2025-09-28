import { X, Download, Printer, CheckCircle, AlertTriangle, Leaf, Globe, Users, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface ReportData {
  company: string;
  overallScore: number;
  risks: string[];
  opportunities: string[];
}

interface DetailedReportProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  data: ReportData;
}

export function DetailedReport({ isOpen, onClose, fileName, data }: DetailedReportProps) {
  if (!isOpen) return null;

  const handleDownloadPDF = () => {
    // In a real implementation, this would generate and download a PDF
    console.log('Downloading PDF report...');
  };

  const handlePrint = () => {
    window.print();
  };

  // Mock data for demonstration
  const esgBreakdown = {
    environment: 78,
    social: 82,
    governance: 85
  };

  const advancedInsights = {
    carbonFootprint: '4.2M tons CO₂e',
    sentiment: 72,
    industryAverage: 7.5
  };

  const recommendations = [
    'Adopt renewable sourcing for supply chain',
    'Enhance ESG disclosures in annual reports', 
    'Set targets for Scope 3 emissions reduction'
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background max-w-6xl w-full max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-8 relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 text-primary-foreground hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </Button>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Leaf className="h-8 w-8" />
              <h1 className="text-3xl font-bold">PrakritiLens</h1>
            </div>
            <p className="text-lg opacity-90">Comprehensive ESG & Sustainability Insights</p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              <div>
                <p className="text-sm opacity-80">Report</p>
                <p className="font-semibold">{fileName}</p>
              </div>
              <div>
                <p className="text-sm opacity-80">Company</p>
                <p className="font-semibold">{data.company}</p>
              </div>
              <div>
                <p className="text-sm opacity-80">Date of Analysis</p>
                <p className="font-semibold">{new Date().toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm opacity-80">Overall ESG Score</p>
                <p className="text-2xl font-bold">{data.overallScore.toFixed(1)} / 10</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Section 1: ESG Breakdown */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Globe className="h-6 w-6 text-primary" />
                ESG Breakdown
              </h2>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">Environment</span>
                    <span className="text-2xl font-bold ml-auto">{esgBreakdown.environment}%</span>
                  </div>
                  <Progress value={esgBreakdown.environment} className="h-3" />
                  <p className="text-sm text-muted-foreground">Carbon footprint reduced by 12% this year</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold">Social</span>
                    <span className="text-2xl font-bold ml-auto">{esgBreakdown.social}%</span>
                  </div>
                  <Progress value={esgBreakdown.social} className="h-3" />
                  <p className="text-sm text-muted-foreground">Strong employee wellbeing policies</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold">Governance</span>
                    <span className="text-2xl font-bold ml-auto">{esgBreakdown.governance}%</span>
                  </div>
                  <Progress value={esgBreakdown.governance} className="h-3" />
                  <p className="text-sm text-muted-foreground">Transparent leadership practices</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Risks and Opportunities */}
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Risks Identified
                </h2>
                <div className="space-y-3">
                  {data.risks.map((risk, index) => (
                    <div key={index} className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-sm font-medium text-destructive">⚠ {risk}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  Opportunities Identified
                </h2>
                <div className="space-y-3">
                  {data.opportunities.map((opportunity, index) => (
                    <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-700">✅ {opportunity}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section 3: Advanced Insights */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-6">Advanced Insights</h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-accent rounded-lg">
                  <Globe className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Carbon Footprint</p>
                  <p className="text-lg font-bold">{advancedInsights.carbonFootprint}</p>
                </div>
                
                <div className="text-center p-4 bg-accent rounded-lg">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-sm text-muted-foreground">Compliance</p>
                  <div className="flex gap-1 justify-center mt-1">
                    <Badge variant="secondary">GRI ✓</Badge>
                    <Badge variant="secondary">UN SDGs ✓</Badge>
                  </div>
                </div>
                
                <div className="text-center p-4 bg-accent rounded-lg">
                  <p className="text-sm text-muted-foreground">Industry Comparison</p>
                  <p className="text-lg font-bold">{data.overallScore.toFixed(1)} vs {advancedInsights.industryAverage}</p>
                  <p className="text-xs text-green-600">Above average</p>
                </div>
                
                <div className="text-center p-4 bg-accent rounded-lg">
                  <p className="text-sm text-muted-foreground">Sentiment</p>
                  <p className="text-lg font-bold">{advancedInsights.sentiment}%</p>
                  <p className="text-xs text-muted-foreground">Positive tone</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Recommendations */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-6">Recommendations</h2>
              <div className="space-y-3">
                {recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      {index + 1}
                    </div>
                    <p className="font-medium">{rec}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="bg-muted p-6 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="font-semibold">Generated by PrakritiLens</p>
              <p className="text-sm text-muted-foreground">Powered by AI-driven ESG Analysis</p>
            </div>
            
            <div className="flex gap-3">
              <Button onClick={handleDownloadPDF} className="gap-2">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              <Button variant="outline" onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" />
                Print Report
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}