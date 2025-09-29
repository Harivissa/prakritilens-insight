import React from 'react';
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
  // Generate mock detailed data based on the score
  const environmentalScore = reportData.breakdown?.environmental || Math.max(10, reportData.score + (Math.random() - 0.5) * 20);
  const socialScore = reportData.breakdown?.social || Math.max(10, reportData.score + (Math.random() - 0.5) * 20);
  const governanceScore = reportData.breakdown?.governance || Math.max(10, reportData.score + (Math.random() - 0.5) * 20);

  const chartData = [
    { name: 'Environmental', score: environmentalScore, benchmark: 65, target: 80 },
    { name: 'Social', score: socialScore, benchmark: 68, target: 85 },
    { name: 'Governance', score: governanceScore, benchmark: 72, target: 90 }
  ];

  const pieData = [
    { name: 'Environmental', value: environmentalScore, color: '#22c55e' },
    { name: 'Social', value: socialScore, color: '#3b82f6' },
    { name: 'Governance', value: governanceScore, color: '#8b5cf6' }
  ];

  const trendData = [
    { month: 'Jan', score: reportData.score - 15 },
    { month: 'Feb', score: reportData.score - 12 },
    { month: 'Mar', score: reportData.score - 8 },
    { month: 'Apr', score: reportData.score - 5 },
    { month: 'May', score: reportData.score - 2 },
    { month: 'Jun', score: reportData.score }
  ];

  const COLORS = ['#22c55e', '#3b82f6', '#8b5cf6'];

  const handleDownloadPDF = async () => {
    try {
      const data = {
        companyName: reportData.company,
        score: reportData.score,
        breakdown: {
          environmental: environmentalScore,
          social: socialScore,
          governance: governanceScore,
        },
        analysis: reportData.analysis || [`Overall ESG Score: ${reportData.score}/100`],
        risks: reportData.risks,
        opportunities: reportData.opportunities,
        fileName: fileName,
        generatedAt: new Date().toISOString(),
      };
      await downloadPDF(data);
      toast({
        title: "PDF Downloaded",
        description: "Your detailed ESG report has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadCSV = async () => {
    try {
      const data = {
        companyName: reportData.company,
        score: reportData.score,
        breakdown: {
          environmental: environmentalScore,
          social: socialScore,
          governance: governanceScore,
        },
        analysis: reportData.analysis || [`Overall ESG Score: ${reportData.score}/100`],
        risks: reportData.risks,
        opportunities: reportData.opportunities,
        fileName: fileName,
        generatedAt: new Date().toISOString(),
      };
      await downloadCSV(data);
      toast({
        title: "CSV Downloaded",
        description: "Your ESG data has been exported to CSV.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export CSV. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPPTX = async () => {
    try {
      const data = {
        companyName: reportData.company,
        score: reportData.score,
        breakdown: {
          environmental: environmentalScore,
          social: socialScore,
          governance: governanceScore,
        },
        analysis: reportData.analysis || [`Overall ESG Score: ${reportData.score}/100`],
        risks: reportData.risks,
        opportunities: reportData.opportunities,
        fileName: fileName,
        generatedAt: new Date().toISOString(),
      };
      await downloadPPTX(data);
      toast({
        title: "PowerPoint Downloaded",
        description: "Your ESG presentation has been generated.",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate PowerPoint. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>PrakritiLens ESG Analysis Report - ${reportData.company}</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; color: #333; }
              .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #059669; padding-bottom: 20px; }
              .logo { font-size: 28px; font-weight: bold; color: #059669; margin-bottom: 10px; }
              .score { font-size: 32px; font-weight: bold; color: #059669; margin: 20px 0; }
              .section { margin: 30px 0; page-break-inside: avoid; }
              .section h3 { color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; font-size: 18px; }
              .breakdown { display: flex; justify-content: space-between; margin: 20px 0; }
              .breakdown-item { text-align: center; padding: 15px; background: #f8fafc; border-radius: 8px; }
              .risk { color: #dc2626; margin: 8px 0; padding: 8px; background: #fef2f2; border-left: 4px solid #dc2626; }
              .opportunity { color: #059669; margin: 8px 0; padding: 8px; background: #f0fdf4; border-left: 4px solid #059669; }
              .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; }
              @media print { .no-print { display: none; } }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">🌱 PrakritiLens</div>
              <h1>ESG Analysis Report</h1>
              <h2>${reportData.company}</h2>
              <div class="score">Overall ESG Score: ${reportData.score}/100</div>
              <p>Report Generated: ${new Date().toLocaleDateString()} | File: ${fileName}</p>
            </div>
            
            <div class="section">
              <h3>📊 ESG Performance Breakdown</h3>
              <div class="breakdown">
                <div class="breakdown-item">
                  <h4>🌍 Environmental</h4>
                  <div style="font-size: 24px; font-weight: bold; color: #059669;">${environmentalScore.toFixed(1)}</div>
                </div>
                <div class="breakdown-item">
                  <h4>👥 Social</h4>
                  <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${socialScore.toFixed(1)}</div>
                </div>
                <div class="breakdown-item">
                  <h4>🛡️ Governance</h4>
                  <div style="font-size: 24px; font-weight: bold; color: #8b5cf6;">${governanceScore.toFixed(1)}</div>
                </div>
              </div>
            </div>
            
            <div class="section">
              <h3>⚠️ Key Risk Areas</h3>
              ${reportData.risks.map(risk => `<div class="risk">• ${risk}</div>`).join('')}
            </div>
            
            <div class="section">
              <h3>🎯 Growth Opportunities</h3>
              ${reportData.opportunities.map(opp => `<div class="opportunity">• ${opp}</div>`).join('')}
            </div>
            
            <div class="footer">
              <p>Generated by PrakritiLens AI • Made by Hari Vissa and Michelle</p>
              <p>This report provides AI-powered insights for ESG performance improvement</p>
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">
                  PrakritiLens ESG Analysis Report
                </DialogTitle>
                <DialogDescription className="text-base mt-1">
                  Comprehensive insights for {reportData.company} • {fileName}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={handleDownloadPDF}>
                    <FileText className="w-4 h-4 mr-2" />
                    Download PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadCSV}>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Export CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadPPTX}>
                    <PieChart className="w-4 h-4 mr-2" />
                    Generate PPTX
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="p-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="charts">Interactive Charts</TabsTrigger>
                <TabsTrigger value="analysis">Deep Analysis</TabsTrigger>
                <TabsTrigger value="recommendations">Action Plan</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Executive Summary */}
                <motion.div
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
                      <div className="w-full bg-muted rounded-full h-4 mb-2">
                        <div 
                          className={`h-4 rounded-full bg-gradient-to-r ${getScoreGradient(reportData.score)} transition-all duration-1000`}
                          style={{ width: `${reportData.score}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* ESG Breakdown */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <Card className="gradient-card border-0 shadow-card">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        <span>ESG Performance Breakdown</span>
                      </CardTitle>
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
                          <Progress value={environmentalScore} className="h-3" />
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
                          <Progress value={socialScore} className="h-3" />
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
                          <Progress value={governanceScore} className="h-3" />
                          <p className="text-sm text-muted-foreground">
                            Board composition, ethics, risk management, transparency
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

              {/* Interactive Charts Tab */}
              <TabsContent value="charts" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Bar Chart */}
                  <Card className="gradient-card border-0 shadow-card">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        <span>Performance vs Benchmarks</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis dataKey="name" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                              }}
                            />
                            <Bar dataKey="score" fill="hsl(var(--primary))" name="Your Score" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="benchmark" fill="hsl(var(--muted-foreground))" name="Industry Avg" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="target" fill="hsl(var(--accent))" name="Target" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Pie Chart */}
                  <Card className="gradient-card border-0 shadow-card">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <PieChart className="w-5 h-5 text-primary" />
                        <span>ESG Score Distribution</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              dataKey="value"
                              label={({ name, value }) => `${name}: ${value.toFixed(1)}`}
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Trend Chart */}
                <Card className="gradient-card border-0 shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="w-5 h-5 text-primary" />
                      <span>Performance Trend Analysis</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="month" />
                          <YAxis domain={[reportData.score - 20, reportData.score + 5]} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="score" 
                            stroke="hsl(var(--primary))" 
                            fill="hsl(var(--primary))"
                            fillOpacity={0.3}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Deep Analysis Tab */}
              <TabsContent value="analysis" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Risks */}
                  <Card className="gradient-card border-0 shadow-card">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-red-600">
                        <AlertTriangle className="w-5 h-5" />
                        <span>Key Risk Areas</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {reportData.risks.map((risk, index) => (
                          <div key={index} className="flex items-start space-x-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/20">
                            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-red-900 dark:text-red-100">{risk}</p>
                              <p className="text-sm text-red-700 dark:text-red-200 mt-1">Requires immediate attention</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Opportunities */}
                  <Card className="gradient-card border-0 shadow-card">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-green-600">
                        <Target className="w-5 h-5" />
                        <span>Growth Opportunities</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {reportData.opportunities.map((opportunity, index) => (
                          <div key={index} className="flex items-start space-x-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900/20">
                            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-green-900 dark:text-green-100">{opportunity}</p>
                              <p className="text-sm text-green-700 dark:text-green-200 mt-1">Strategic improvement area</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Recommendations Tab */}
              <TabsContent value="recommendations" className="space-y-6">
                <Card className="gradient-card border-0 shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Lightbulb className="w-5 h-5 text-primary" />
                      <span>AI-Generated Action Plan</span>
                    </CardTitle>
                    <CardDescription>
                      Personalized recommendations to enhance your ESG performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {[
                        "Implement renewable energy initiatives to reduce carbon footprint by 25%",
                        "Enhance diversity and inclusion programs with measurable targets",
                        "Strengthen cybersecurity and data governance frameworks",
                        "Develop comprehensive supplier sustainability assessment protocols",
                        "Increase stakeholder engagement through regular ESG reporting",
                        "Establish science-based targets aligned with 1.5°C pathway"
                      ].map((recommendation, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="flex items-start space-x-3 p-4 bg-primary/5 rounded-lg border border-primary/20"
                        >
                          <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-primary">{index + 1}</span>
                          </div>
                          <p className="text-sm font-medium">{recommendation}</p>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};