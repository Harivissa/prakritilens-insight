import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Download, Printer, Share2, TrendingUp, TrendingDown, 
  AlertTriangle, CheckCircle2, Info, Target, Lightbulb,
  BarChart3, PieChart, Activity, Globe, Users, Shield,
  FileText, Calendar, Building
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ReportData {
  company: string;  
  score: number;
  risks: string[];
  opportunities: string[];
}

interface DetailedReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  reportData: ReportData;
}

export const DetailedReportModal = ({ isOpen, onClose, fileName, reportData }: DetailedReportModalProps) => {
  const handleDownloadPDF = async () => {
    // Import and use the PDF generator from utils
    const { downloadPDF } = await import('@/utils/pdfGenerator');
    
    const data = {
      companyName: reportData.company,
      score: reportData.score,
      breakdown: {
        environmental: environmentalScore,
        social: socialScore,
        governance: governanceScore,
      },
      analysis: [`Overall ESG Score: ${reportData.score}/100`],
      risks: reportData.risks,
      opportunities: reportData.opportunities,
      fileName: fileName,
      generatedAt: new Date().toISOString(),
    };

    await downloadPDF(data);
  };

  const handlePrint = () => {
    // Create a new window with the report content
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>ESG Analysis Report - ${reportData.company}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .score { font-size: 24px; font-weight: bold; color: #059669; }
              .section { margin: 20px 0; }
              .section h3 { color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
              .risk { color: #dc2626; margin: 5px 0; }
              .opportunity { color: #059669; margin: 5px 0; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>PrakritiLens ESG Analysis Report</h1>
              <h2>${reportData.company}</h2>
              <div class="score">Overall ESG Score: ${reportData.score}/100</div>
              <p>Generated: ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="section">
              <h3>ESG Breakdown</h3>
              <p>Environmental: ${environmentalScore.toFixed(1)}/100</p>
              <p>Social: ${socialScore.toFixed(1)}/100</p>
              <p>Governance: ${governanceScore.toFixed(1)}/100</p>
            </div>
            
            <div class="section">
              <h3>Key Risks</h3>
              ${reportData.risks.map(risk => `<div class="risk">• ${risk}</div>`).join('')}
            </div>
            
            <div class="section">
              <h3>Growth Opportunities</h3>
              ${reportData.opportunities.map(opp => `<div class="opportunity">• ${opp}</div>`).join('')}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-500 to-green-600';
    if (score >= 60) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  // Generate mock detailed data based on the score
  const environmentalScore = Math.max(10, reportData.score + (Math.random() - 0.5) * 20);
  const socialScore = Math.max(10, reportData.score + (Math.random() - 0.5) * 20);
  const governanceScore = Math.max(10, reportData.score + (Math.random() - 0.5) * 20);

  const advancedInsights = {
    carbonFootprint: `${(Math.random() * 500 + 100).toFixed(0)} tCO2e`,
    complianceStatus: environmentalScore > 70 ? 'Compliant' : 'Needs Improvement',
    industryRanking: `${Math.floor(Math.random() * 20) + 1}th percentile`,
    sentiment: socialScore > 70 ? 'Positive' : socialScore > 50 ? 'Neutral' : 'Negative'
  };

  const recommendations = [
    'Implement renewable energy initiatives to reduce carbon footprint',
    'Enhance diversity and inclusion programs within the organization',
    'Strengthen data governance and cybersecurity measures',
    'Develop supplier sustainability assessment protocols',
    'Increase stakeholder engagement and transparency reporting',
    'Establish measurable ESG targets with regular monitoring'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">
                Detailed ESG Analysis Report
              </DialogTitle>
              <DialogDescription className="text-base mt-2">
                Comprehensive insights for {reportData.company} • {fileName}
              </DialogDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-8">
            {/* Executive Summary */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="gradient-card border-0 shadow-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Building className="w-5 h-5 text-primary" />
                        <span>{reportData.company}</span>
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Overall ESG Performance Assessment
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className={`text-4xl font-bold ${getScoreColor(reportData.score)}`}>
                        {reportData.score.toFixed(1)}
                      </div>
                      <div className="text-sm text-muted-foreground">ESG Score</div>
                      <Badge variant={getScoreBadgeVariant(reportData.score)} className="mt-2">
                        {reportData.score >= 80 ? 'Excellent' : reportData.score >= 60 ? 'Good' : 'Needs Improvement'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date().toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      {fileName}
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 mb-2">
                    <div 
                      className={`h-3 rounded-full bg-gradient-to-r ${getScoreGradient(reportData.score)} transition-all duration-1000`}
                      style={{ width: `${reportData.score}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.section>

            {/* ESG Breakdown */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="gradient-card border-0 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <span>ESG Score Breakdown</span>
                  </CardTitle>
                  <CardDescription>
                    Detailed performance across Environmental, Social, and Governance factors
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Globe className="w-4 h-4 text-green-600" />
                          <span className="font-medium">Environmental</span>
                        </div>
                        <span className={`font-bold ${getScoreColor(environmentalScore)}`}>
                          {environmentalScore.toFixed(1)}
                        </span>
                      </div>
                      <Progress value={environmentalScore} className="h-2" />
                      <p className="text-sm text-muted-foreground">
                        Carbon emissions, waste management, resource efficiency
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">Social</span>
                        </div>
                        <span className={`font-bold ${getScoreColor(socialScore)}`}>
                          {socialScore.toFixed(1)}
                        </span>
                      </div>
                      <Progress value={socialScore} className="h-2" />
                      <p className="text-sm text-muted-foreground">
                        Employee welfare, community impact, diversity & inclusion
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-purple-600" />
                          <span className="font-medium">Governance</span>
                        </div>
                        <span className={`font-bold ${getScoreColor(governanceScore)}`}>
                          {governanceScore.toFixed(1)}
                        </span>
                      </div>
                      <Progress value={governanceScore} className="h-2" />
                      <p className="text-sm text-muted-foreground">
                        Board composition, ethics, risk management, transparency
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.section>

            {/* Risks and Opportunities */}
            <div className="grid md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="gradient-card border-0 shadow-card h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-red-600">
                      <AlertTriangle className="w-5 h-5" />
                      <span>Identified Risks</span>
                    </CardTitle>
                    <CardDescription>
                      Key ESG risks that require attention
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {reportData.risks.map((risk, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm">{risk}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="gradient-card border-0 shadow-card h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-green-600">
                      <Target className="w-5 h-5" />
                      <span>Growth Opportunities</span>
                    </CardTitle>
                    <CardDescription>
                      Strategic opportunities for ESG improvement
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {reportData.opportunities.map((opportunity, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm">{opportunity}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Advanced Insights */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="gradient-card border-0 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-primary" />
                    <span>Advanced Insights</span>
                  </CardTitle>
                  <CardDescription>
                    Deep-dive analytics and key performance indicators
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 dark:bg-green-950/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Globe className="w-8 h-8 text-green-600" />
                      </div>
                      <div className="font-bold text-lg">{advancedInsights.carbonFootprint}</div>
                      <div className="text-sm text-muted-foreground">Carbon Footprint</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-950/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CheckCircle2 className="w-8 h-8 text-blue-600" />
                      </div>
                      <div className="font-bold text-lg">{advancedInsights.complianceStatus}</div>
                      <div className="text-sm text-muted-foreground">Compliance Status</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-100 dark:bg-purple-950/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <TrendingUp className="w-8 h-8 text-purple-600" />
                      </div>
                      <div className="font-bold text-lg">{advancedInsights.industryRanking}</div>
                      <div className="text-sm text-muted-foreground">Industry Ranking</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-950/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <PieChart className="w-8 h-8 text-yellow-600" />
                      </div>
                      <div className="font-bold text-lg">{advancedInsights.sentiment}</div>
                      <div className="text-sm text-muted-foreground">Stakeholder Sentiment</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.section>

            {/* Recommendations */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card className="gradient-card border-0 shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Lightbulb className="w-5 h-5 text-primary" />
                    <span>Strategic Recommendations</span>
                  </CardTitle>
                  <CardDescription>
                    Actionable steps to enhance your ESG performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-primary">{index + 1}</span>
                        </div>
                        <p className="text-sm">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.section>

            {/* Footer */}
            <div className="text-center text-sm text-muted-foreground border-t border-border pt-6">
              <p>
                Report generated on {new Date().toLocaleDateString()} by ESG Analytics Pro
              </p>
              <p className="mt-2">
                This analysis is based on AI-powered assessment and should be reviewed alongside professional ESG expertise.
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};