import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Download, Printer, Share2, TrendingUp, TrendingDown, 
  AlertTriangle, CheckCircle2, Info, Target, Lightbulb,
  BarChart3, PieChart, Activity, Globe, Users, Shield,
  FileText, Calendar, Building, ChevronDown, X
} from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { downloadPDF, downloadCSV, downloadPPTX } from '@/utils/pdfGenerator';
import { toast } from '@/hooks/use-toast';

interface ReportData {
  company: string;  
  score: number;
  risks: string[];
  opportunities: string[];
  breakdown?: {
    environmental: number;
    social: number;
    governance: number;
  };
  analysis?: string[];
}

interface EnhancedDetailedReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  reportData: ReportData;
}

export const EnhancedDetailedReportModal = ({ isOpen, onClose, fileName, reportData }: EnhancedDetailedReportModalProps) => {
  const [activeChartFilter, setActiveChartFilter] = React.useState<'all' | 'environmental' | 'social' | 'governance'>('all');
  const printRef = useRef<HTMLDivElement>(null);
  
  // Pillar scores come only from the stored analysis; an unscored pillar is shown as 0, never invented
  const environmentalScore = Number(reportData.breakdown?.environmental ?? 0);
  const socialScore = Number(reportData.breakdown?.social ?? 0);
  const governanceScore = Number(reportData.breakdown?.governance ?? 0);

  const allChartData = [
    { name: 'Environmental', value: environmentalScore, color: '#10b981' },
    { name: 'Social', value: socialScore, color: '#3b82f6' },
    { name: 'Governance', value: governanceScore, color: '#8b5cf6' }
  ];

  const filteredChartData = activeChartFilter === 'all' 
    ? allChartData 
    : allChartData.filter(item => item.name.toLowerCase() === activeChartFilter);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) {
      toast({
        title: "Print Failed",
        description: "Please allow pop-ups to print the report.",
        variant: "destructive",
      });
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>PrakritiLens - ESG Report</title>
          <style>
            @media print {
              @page { margin: 1cm; size: A4; }
              body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            }
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #10b981; padding-bottom: 20px; }
            .header h1 { color: #10b981; font-size: 28px; margin: 0; }
            .header p { color: #666; margin: 5px 0; }
            .section { margin: 20px 0; page-break-inside: avoid; }
            .section-title { color: #10b981; font-size: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 15px; }
            .score-card { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 15px 0; text-align: center; }
            .score { font-size: 48px; color: #10b981; font-weight: bold; }
            .breakdown { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
            .breakdown-item { background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center; }
            .breakdown-score { font-size: 24px; color: #10b981; font-weight: bold; }
            .list-item { margin: 10px 0; padding-left: 20px; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: 500; }
            .badge-success { background: #d1fae5; color: #065f46; }
            .badge-warning { background: #fef3c7; color: #92400e; }
            .badge-error { background: #fee2e2; color: #991b1b; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🌿 PrakritiLens - ESG Report</h1>
            <p><strong>Company:</strong> ${reportData.company || 'Not Specified'}</p>
            <p><strong>File:</strong> ${fileName}</p>
            <p><strong>Report Generated:</strong> ${new Date().toLocaleDateString()}</p>
            <p style="font-size: 12px; color: #999;">Professional ESG Analytics Platform</p>
          </div>

          <div class="section">
            <div class="score-card">
              <h2 style="margin: 0 0 10px 0; color: #666;">Overall ESG Score</h2>
              <div class="score">${reportData.score}/100</div>
              <p style="margin: 10px 0 0 0; color: #666;">${getScoreRating(reportData.score)}</p>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">ESG Breakdown</h2>
            <div class="breakdown">
              <div class="breakdown-item">
                <h3 style="margin: 0 0 10px 0; color: #666;">Environmental</h3>
                <div class="breakdown-score">${environmentalScore.toFixed(1)}</div>
              </div>
              <div class="breakdown-item">
                <h3 style="margin: 0 0 10px 0; color: #666;">Social</h3>
                <div class="breakdown-score">${socialScore.toFixed(1)}</div>
              </div>
              <div class="breakdown-item">
                <h3 style="margin: 0 0 10px 0; color: #666;">Governance</h3>
                <div class="breakdown-score">${governanceScore.toFixed(1)}</div>
              </div>
            </div>
          </div>

          ${reportData.risks && reportData.risks.length > 0 ? `
          <div class="section">
            <h2 class="section-title">⚠️ Key Risk Factors</h2>
            ${reportData.risks.map((risk: string) => `<div class="list-item">• ${risk}</div>`).join('')}
          </div>
          ` : ''}

          ${reportData.opportunities && reportData.opportunities.length > 0 ? `
          <div class="section">
            <h2 class="section-title">🎯 Opportunities</h2>
            ${reportData.opportunities.map((opp: string) => `<div class="list-item">• ${opp}</div>`).join('')}
          </div>
          ` : ''}

          ${reportData.analysis && reportData.analysis.length > 0 ? `
          <div class="section">
            <h2 class="section-title">📊 Detailed Analysis</h2>
            ${reportData.analysis.map((item: string) => `<div class="list-item">• ${item}</div>`).join('')}
          </div>
          ` : ''}

          <div class="footer">
            <p><strong>PrakritiLens</strong> - AI-Powered ESG Analytics Platform</p>
            <p>This report is generated using advanced AI analysis and should be used as a supplementary tool for ESG assessment.</p>
            <p style="margin-top: 10px;">Made with ❤️ by Hari Vissa & Michelle</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);

    toast({
      title: "Print Ready",
      description: "Your report is ready to print.",
    });
  };

  const getScoreRating = (score: number): string => {
    if (score >= 80) return "Excellent - Leading ESG Performance";
    if (score >= 60) return "Good - Strong ESG Performance";
    if (score >= 40) return "Fair - Room for Improvement";
    return "Needs Improvement - Significant Action Required";
  };

  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Activity className="h-6 w-6 text-primary" />
                Detailed ESG Report - Single Page View
              </DialogTitle>
              <DialogDescription className="mt-1">
                {reportData.company} • {fileName}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print Report
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => {}}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {}}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {}}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as PowerPoint
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-80px)]">
          <div ref={printRef} className="p-6 space-y-6">
            {/* Overall Score Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-center text-3xl">Overall ESG Score</CardTitle>
                </CardHeader>
                <CardContent className="text-center pb-6">
                  <div className={`text-7xl font-bold mb-2 ${getScoreColor(reportData.score)}`}>
                    {reportData.score}
                    <span className="text-3xl text-muted-foreground">/100</span>
                  </div>
                  <Badge variant="outline" className="text-lg px-4 py-1">
                    {getScoreBadge(reportData.score)}
                  </Badge>
                  <p className="text-muted-foreground mt-4">{getScoreRating(reportData.score)}</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* ESG Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Globe className="h-5 w-5 text-green-600" />
                      Environmental
                    </CardTitle>
                    <span className="text-2xl font-bold text-green-600">{environmentalScore.toFixed(1)}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <Progress value={environmentalScore} className="h-2" />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      Social
                    </CardTitle>
                    <span className="text-2xl font-bold text-blue-600">{socialScore.toFixed(1)}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <Progress value={socialScore} className="h-2" />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5 text-purple-600" />
                      Governance
                    </CardTitle>
                    <span className="text-2xl font-bold text-purple-600">{governanceScore.toFixed(1)}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <Progress value={governanceScore} className="h-2" />
                </CardContent>
              </Card>
            </div>

            {/* Interactive Charts Section - ALL ON ONE PAGE */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Interactive ESG Charts
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={activeChartFilter === 'all' ? 'default' : 'outline'}
                      onClick={() => setActiveChartFilter('all')}
                    >
                      All
                    </Button>
                    <Button
                      size="sm"
                      variant={activeChartFilter === 'environmental' ? 'default' : 'outline'}
                      onClick={() => setActiveChartFilter('environmental')}
                    >
                      Environmental
                    </Button>
                    <Button
                      size="sm"
                      variant={activeChartFilter === 'social' ? 'default' : 'outline'}
                      onClick={() => setActiveChartFilter('social')}
                    >
                      Social
                    </Button>
                    <Button
                      size="sm"
                      variant={activeChartFilter === 'governance' ? 'default' : 'outline'}
                      onClick={() => setActiveChartFilter('governance')}
                    >
                      Governance
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Bar Chart */}
                  <div className="h-64">
                    <h3 className="text-sm font-medium mb-2">ESG Scores by Category</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={filteredChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Pie Chart */}
                  <div className="h-64">
                    <h3 className="text-sm font-medium mb-2">ESG Distribution</h3>
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={filteredChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: ${entry.value.toFixed(1)}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {filteredChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Risk Factors */}
            {reportData.risks && reportData.risks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    Key Risk Factors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {reportData.risks.map((risk, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Opportunities */}
            {reportData.opportunities && reportData.opportunities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-600">
                    <Target className="h-5 w-5" />
                    Opportunities for Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {reportData.opportunities.map((opp, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>{opp}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Detailed Analysis */}
            {reportData.analysis && reportData.analysis.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Detailed Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {reportData.analysis.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
