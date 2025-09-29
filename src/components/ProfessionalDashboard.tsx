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
  ChevronRight, Activity, PieChart, MoreVertical, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useReports } from '@/hooks/useReports';
import { ProfessionalFileUpload } from './ProfessionalFileUpload';
import { ProfessionalChat } from './ProfessionalChat';
import { DetailedReportModal } from './DetailedReportModal';

export const ProfessionalDashboard = () => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { reports, loading } = useReports();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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

  const handleDownloadReport = (report: any) => {
    // Generate and download report
    const reportData = {
      company: report.company_name,
      score: report.score,
      analysis: report.analysis_data,
      date: new Date(report.created_at).toLocaleDateString()
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.company_name}_ESG_Report.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold">ESG Analytics Pro</h1>
            <Badge variant="secondary" className="hidden md:inline-flex">Dashboard</Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search reports..." 
                className="pl-10 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="ghost" size="sm">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Welcome Section */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Welcome back, {profile?.full_name || user?.email?.split('@')[0] || 'User'}
              </h2>
              <p className="text-muted-foreground">
                Here's your ESG analytics overview for today
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </Button>
              <Button variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                {new Date().toLocaleDateString()}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
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
                        Your latest document analysis results
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
                            <Badge variant={getScoreBadgeVariant(report.score || 0)}>
                              {report.score?.toFixed(1) || 'N/A'}
                            </Badge>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewReport(report)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDownloadReport(report)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
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
            <ProfessionalChat />
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
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDownloadReport(report)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
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
            <Card className="gradient-card border-0 shadow-card">
              <CardHeader>
                <CardTitle>Advanced Analytics</CardTitle>
                <CardDescription>
                  Deep insights into your ESG performance trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Score Distribution</h4>
                    <div className="h-48 bg-muted/30 rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">Interactive Chart Coming Soon</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-semibold">Trend Analysis</h4>
                    <div className="h-48 bg-muted/30 rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">Trend Visualization Coming Soon</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Detailed Report Modal */}
      {selectedReport && (
        <DetailedReportModal
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          fileName={selectedReport.file_name}
          reportData={{
            company: selectedReport.company_name,
            score: selectedReport.score,
            risks: selectedReport.analysis_data?.risks || [],
            opportunities: selectedReport.analysis_data?.opportunities || []
          }}
        />
      )}
    </div>
  );
};