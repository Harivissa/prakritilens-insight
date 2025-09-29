import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Leaf, 
  Users, 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Download,
  FileText,
  BarChart3,
  Clock
} from 'lucide-react';

interface ESGAnalysisResult {
  score: number;
  breakdown: {
    environmental: number;
    social: number;
    governance: number;
  };
  analysis: string[];
  risks: string[];
  opportunities: string[];
  companyName: string;
  fileName: string;
  generatedAt: string;
}

interface ESGReportCardProps {
  result: ESGAnalysisResult;
  onDownload: () => void;
}

export const ESGReportCard = ({ result, onDownload }: ESGReportCardProps) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await onDownload();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-elegant">
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Leaf className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold text-primary">PrakritiLens</span>
        </div>
        <CardTitle className="text-2xl">ESG Assessment Report</CardTitle>
        <CardDescription className="text-lg">
          {result.companyName} • {result.fileName}
        </CardDescription>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Generated on {new Date(result.generatedAt).toLocaleDateString()}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Score Section */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-4">
            <div className="text-center">
              <div className={`text-6xl font-bold ${getScoreColor(result.score)}`}>
                {result.score}
              </div>
              <Badge variant="secondary" className="mt-2">
                {getScoreLabel(result.score)}
              </Badge>
            </div>
            <div className="text-left space-y-2">
              <p className="text-sm text-muted-foreground">Overall ESG Score</p>
              <p className="text-2xl font-semibold">ESG Rating</p>
              <Button onClick={handleDownload} disabled={isDownloading} className="gradient-primary">
                <Download className="h-4 w-4 mr-2" />
                {isDownloading ? 'Generating...' : 'Download Report'}
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* ESG Breakdown */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            ESG Breakdown
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Environmental */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Leaf className="h-5 w-5 text-green-600" />
                <span className="font-medium">Environmental</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-green-600">
                    {result.breakdown.environmental}
                  </span>
                  <Badge variant="outline">
                    {getScoreLabel(result.breakdown.environmental)}
                  </Badge>
                </div>
                <Progress 
                  value={result.breakdown.environmental} 
                  className="h-2"
                />
              </div>
            </Card>

            {/* Social */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Social</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-blue-600">
                    {result.breakdown.social}
                  </span>
                  <Badge variant="outline">
                    {getScoreLabel(result.breakdown.social)}
                  </Badge>
                </div>
                <Progress 
                  value={result.breakdown.social} 
                  className="h-2"
                />
              </div>
            </Card>

            {/* Governance */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5 text-purple-600" />
                <span className="font-medium">Governance</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-purple-600">
                    {result.breakdown.governance}
                  </span>
                  <Badge variant="outline">
                    {getScoreLabel(result.breakdown.governance)}
                  </Badge>
                </div>
                <Progress 
                  value={result.breakdown.governance} 
                  className="h-2"
                />
              </div>
            </Card>
          </div>
        </div>

        <Separator />

        {/* Analysis, Risks, and Opportunities */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Key Analysis */}
          <Card className="p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Key Analysis
            </h4>
            <ScrollArea className="h-32">
              <ul className="space-y-2 text-sm">
                {result.analysis.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </Card>

          {/* Risks */}
          <Card className="p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Identified Risks
            </h4>
            <ScrollArea className="h-32">
              <ul className="space-y-2 text-sm">
                {result.risks.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </Card>

          {/* Opportunities */}
          <Card className="p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-600">
              <TrendingUp className="h-4 w-4" />
              Opportunities
            </h4>
            <ScrollArea className="h-32">
              <ul className="space-y-2 text-sm">
                {result.opportunities.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </Card>
        </div>

        <Separator />

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <Alert>
            <AlertDescription>
              This ESG assessment is generated using deterministic algorithms to ensure consistent and reliable scoring. 
              The same document will always produce the same score for reproducible results.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
};