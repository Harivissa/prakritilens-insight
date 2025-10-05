import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, MessageSquare, BarChart3, Settings, Search, Bell, 
  User, LogOut, TrendingUp, TrendingDown, FileText, Eye, 
  Download, Filter, Calendar, Globe, Zap, Shield, Users,
  ChevronRight, Activity, PieChart, MoreVertical, RefreshCw,
  Trash2, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useReports } from '@/hooks/useReports';
import { ProfessionalFileUpload } from './ProfessionalFileUpload';
import { ContextAwareChat } from './ContextAwareChat';
import { ESGNewsFeed } from './ESGNewsFeed';
import { EnhancedDetailedReportModal } from './EnhancedDetailedReportModal';
import { InteractiveCharts } from './InteractiveCharts';
import { ESGWeightsCustomizer } from './ESGWeightsCustomizer';
import { UserRoleManager } from './UserRoleManager';
import { DarkModeToggle } from './DarkModeToggle';
import { TrendAnalytics } from './TrendAnalytics';
import { VerificationBanner } from './VerificationBanner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { downloadPDF, downloadCSV, downloadPPTX } from '@/utils/pdfGenerator';
import { supabase } from '@/integrations/supabase/client';

export const ProfessionalDashboard = () => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { reports, loading } = useReports();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [esgWeights, setESGWeights] = useState({ environmental: 40, social: 35, governance: 25 });
  const [isEmailVerified, setIsEmailVerified] = useState(true);

  // Check email verification status
  useEffect(() => {
    const checkVerification = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsEmailVerified(user.email_confirmed_at !== null);
      }
    };
    checkVerification();
  }, []);

  // Calculate key metrics
  const totalReports = reports.length;
  const avgScore = reports.length > 0 ? reports.reduce((sum, r) => sum + (r.score || 0), 0) / reports.length : 0;
  const lastReport = reports.length > 0 ? reports[0] : null;
  const completedReports = reports.filter(r => r.score !== null).length;

  // Filter reports based on search
  const filteredReports = reports.filter(report => 
    report.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.file_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get score color and trend
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const handleViewReport = (report: any) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await reports.find(r => r.id === reportId) && await useReports().deleteReport(reportId);
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const handleDownloadReport = async (report: any) => {
    const data = {
      companyName: report.company_name || 'Unknown Company',
      score: Number(report.score) || 0,
      breakdown: report.analysis_data?.breakdown || {
        environmental: 0,
        social: 0,
        governance: 0,
      },
      analysis: report.analysis_data?.analysis || [],
      risks: report.analysis_data?.risks || [],
      opportunities: report.analysis_data?.opportunities || [],
      fileName: report.file_name || 'report',
      generatedAt: report.created_at || new Date().toISOString(),
    };

    await downloadPDF(data);
  };

  const kpiCards = [
    {
      title: "Total Reports",
      value: totalReports.toString(),
      change: "+12%",
      trend: "up",
      icon: FileText,
      color: "text-blue-600"
    },
    {
      title: "Average Score",
      value: avgScore.toFixed(1),
      change: "+8.2%",
      trend: "up", 
      icon: TrendingUp,
      color: getScoreColor(avgScore)
    },
    {
      title: "Latest Score",
      value: lastReport?.score?.toFixed(1) || "N/A",
      change: lastReport ? "+5.1%" : "0%",
      trend: lastReport ? "up" : "neutral",
      icon: Activity,
      color: lastReport ? getScoreColor(lastReport.score) : "text-muted-foreground"
    },
    {
      title: "Completion Rate",
      value: totalReports > 0 ? `${Math.round((completedReports / totalReports) * 100)}%` : "0%",
      change: "+15%",
      trend: "up",
      icon: PieChart,
      color: "text-green-600"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground">PrakritiLens</h1>
            <Badge variant="secondary" className="hidden md:inline-flex">Dashboard</Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search reports..." 
                className="pl-10 w-64 bg-background text-foreground"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="ghost" size="sm" className="text-foreground hover:bg-muted">
              <Bell className="w-4 h-4" />
            </Button>
            <DarkModeToggle />
            <Button variant="ghost" size="sm" className="text-foreground hover:bg-muted">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-foreground hover:bg-muted">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Verification Banner */}
        {!isEmailVerified && <VerificationBanner />}
        
        {/* Hero Intro Section */}
        <motion.div
          className="mb-8 relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 p-8 md:p-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Content */}
          <div className="relative z-10 max-w-2xl">
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              PrakritiLens ESG Platform
            </motion.h1>
            <motion.p 
              className="text-lg md:text-xl text-muted-foreground mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              Invest in companies rated for their impact on environment, social, and governance issues.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex items-center space-x-4"
            >
              <Button 
                size="lg" 
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-6 text-lg rounded-full shadow-lg"
                onClick={() => setActiveTab('upload')}
              >
                Get Started
              </Button>
              <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </motion.div>
          </div>

          {/* Decorative gradient orbs */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-400/30 rounded-full blur-3xl" />
          <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-teal-400/30 rounded-full blur-3xl" />
          <div className="absolute right-1/3 bottom-0 w-56 h-56 bg-green-400/20 rounded-full blur-3xl" />
        </motion.div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7 mb-8">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center space-x-2">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">AI Chat</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Admin</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* KPI Cards */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {kpiCards.map((kpi, index) => (
                <motion.div
                  key={kpi.title}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className="gradient-card border-0 shadow-card hover:shadow-elegant transition-smooth">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {kpi.title}
                      </CardTitle>
                      <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-foreground mb-1">
                        {kpi.value}
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        {kpi.trend === 'up' ? (
                          <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                        ) : kpi.trend === 'down' ? (
                          <TrendingDown className="w-3 h-3 text-red-600 mr-1" />
                        ) : null}
                        <span className={kpi.trend === 'up' ? 'text-green-600' : kpi.trend === 'down' ? 'text-red-600' : ''}>
                          {kpi.change}
                        </span>
                        <span className="ml-1">from last month</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

          {/* Recent Reports */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="gradient-card border-0 shadow-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent ESG Reports</CardTitle>
                      <CardDescription>
                        Your latest document analysis results from PrakritiLens AI
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {filteredReports.slice(0, 8).map((report, index) => (
                        <motion.div
                          key={report.id}
                          className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-smooth"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-semibold text-foreground">
                                {report.company_name || 'Unknown Company'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {report.file_name} • {new Date(report.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge variant={getScoreBadgeVariant(report.score || 0)} className="text-sm px-3 py-1">
                              Score: {report.score?.toFixed(1) || 'N/A'}
                            </Badge>
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => handleViewReport(report)}
                              className="gradient-primary"
                            >
                              View Detailed Report
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" title="More actions">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleDownloadReport(report)}>
                                  <Download className="w-4 h-4 mr-2" />
                                  Download PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={async () => {
                                  const data = {
                                    companyName: report.company_name || 'Unknown Company',
                                    score: Number(report.score) || 0,
                                    breakdown: report.analysis_data?.breakdown || { environmental: 0, social: 0, governance: 0 },
                                    analysis: report.analysis_data?.analysis || [],
                                    risks: report.analysis_data?.risks || [],
                                    opportunities: report.analysis_data?.opportunities || [],
                                    fileName: report.file_name || 'report',
                                    generatedAt: report.created_at || new Date().toISOString(),
                                  };
                                  await downloadCSV(data);
                                }}>
                                  <FileText className="w-4 h-4 mr-2" />
                                  Export CSV
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={async () => {
                                  const data = {
                                    companyName: report.company_name || 'Unknown Company',
                                    score: Number(report.score) || 0,
                                    breakdown: report.analysis_data?.breakdown || { environmental: 0, social: 0, governance: 0 },
                                    analysis: report.analysis_data?.analysis || [],
                                    risks: report.analysis_data?.risks || [],
                                    opportunities: report.analysis_data?.opportunities || [],
                                    fileName: report.file_name || 'report',
                                    generatedAt: report.created_at || new Date().toISOString(),
                                  };
                                  await downloadPPTX(data);
                                }}>
                                  <PieChart className="w-4 h-4 mr-2" />
                                  Generate PPTX
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteReport(report.id)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Report
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload">
            <ProfessionalFileUpload />
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat">
            <ContextAwareChat />
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card className="gradient-card border-0 shadow-card">
              <CardHeader>
                <CardTitle>All Reports</CardTitle>
                <CardDescription>
                  Manage and analyze all your ESG reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {filteredReports.map((report, index) => (
                    <motion.div
                      key={report.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-smooth"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">
                            {report.company_name || 'Unknown Company'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {report.file_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Created: {new Date(report.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className={`font-bold ${getScoreColor(report.score || 0)}`}>
                            {report.score?.toFixed(1) || 'N/A'}
                          </div>
                          <div className="text-xs text-muted-foreground">ESG Score</div>
                        </div>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewReport(report)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Download className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => handleDownloadReport(report)}>
                                Download PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={async () => {
                                const data = {
                                  companyName: report.company_name || 'Unknown Company',
                                  score: Number(report.score) || 0,
                                  breakdown: report.analysis_data?.breakdown || { environmental: 0, social: 0, governance: 0 },
                                  analysis: report.analysis_data?.analysis || [],
                                  risks: report.analysis_data?.risks || [],
                                  opportunities: report.analysis_data?.opportunities || [],
                                  fileName: report.file_name || 'report',
                                  generatedAt: report.created_at || new Date().toISOString(),
                                };
                                await downloadCSV(data);
                              }}>
                                Download CSV
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={async () => {
                                const data = {
                                  companyName: report.company_name || 'Unknown Company',
                                  score: Number(report.score) || 0,
                                  breakdown: report.analysis_data?.breakdown || { environmental: 0, social: 0, governance: 0 },
                                  analysis: report.analysis_data?.analysis || [],
                                  risks: report.analysis_data?.risks || [],
                                  opportunities: report.analysis_data?.opportunities || [],
                                  fileName: report.file_name || 'report',
                                  generatedAt: report.created_at || new Date().toISOString(),
                                };
                                await downloadPPTX(data);
                              }}>
                                Download PPTX
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <InteractiveCharts 
              companyName={reports.length > 0 ? reports[0].company_name : "Your Company"}
              score={avgScore}
            />
            
            {/* ESG News Feed */}
            <div className="mt-8">
              <ESGNewsFeed />
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <ESGWeightsCustomizer 
              weights={esgWeights}
              onWeightsChange={setESGWeights}
            />
          </TabsContent>

          {/* Admin Tab */}
          <TabsContent value="admin" className="space-y-6">
            <UserRoleManager />
          </TabsContent>
        </Tabs>
      </div>

      {/* Enhanced Detailed Report Modal */}
      {selectedReport && (
        <EnhancedDetailedReportModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          fileName={selectedReport.file_name}
          reportData={{
            company: selectedReport.company_name,
            score: selectedReport.score,
            risks: selectedReport.analysis_data?.risks || [],
            opportunities: selectedReport.analysis_data?.opportunities || [],
            breakdown: selectedReport.analysis_data?.breakdown,
            analysis: selectedReport.analysis_data?.analysis
          }}
        />
      )}
    </div>
  );
};