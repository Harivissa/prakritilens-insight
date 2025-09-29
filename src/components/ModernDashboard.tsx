import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MessageCircle, 
  Upload, 
  BarChart3, 
  FileText, 
  Settings, 
  LogOut,
  Menu,
  X,
  Bell,
  User,
  Search,
  Calendar,
  Download,
  Eye,
  TrendingUp,
  Shield,
  Leaf
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useReports } from '@/hooks/useReports';
import { ChatInterface } from './ChatInterface';
import { FileUploadInterface } from './FileUploadInterface';
import { cn } from '@/lib/utils';

interface ModernDashboardProps {}

export const ModernDashboard = ({}: ModernDashboardProps) => {
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const { reports, loading: reportsLoading } = useReports();
  
  const [activeView, setActiveView] = useState<'dashboard' | 'upload' | 'chat' | 'reports' | 'settings'>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Calculate metrics
  const totalReports = reports.length;
  const avgScore = reports.length > 0 
    ? Math.round((reports.reduce((sum, report) => sum + (report.score || 0), 0) / reports.length) * 10) / 10
    : 0;
  const lastReport = reports.length > 0 ? reports[0] : null;
  const recentReports = reports.slice(0, 5);

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 8) return 'default';
    if (score >= 6) return 'secondary';
    return 'destructive';
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      description: 'Overview & Analytics'
    },
    {
      id: 'upload',
      label: 'Upload & Analyze',
      icon: Upload,
      description: 'ESG Assessment'
    },
    {
      id: 'chat',
      label: 'AI Assistant',
      icon: MessageCircle,
      description: 'Chat with AI',
      highlight: true
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      description: 'View Reports'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Leaf className="h-6 w-6 text-primary" />
              <span className="font-semibold">PrakritiLens</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r transform transition-transform duration-300",
        "lg:translate-x-0 lg:static",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-bold">PrakritiLens</h1>
                <p className="text-xs text-muted-foreground">ESG Platform</p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <Separator />

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => (
              <motion.button
                key={item.id}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors relative",
                  activeView === item.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
                onClick={() => {
                  setActiveView(item.id as typeof activeView);
                  setSidebarOpen(false);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{item.label}</div>
                  <div className="text-xs opacity-75 truncate">{item.description}</div>
                </div>
                {item.highlight && (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                )}
              </motion.button>
            ))}
          </nav>

          <Separator />

          {/* User Section */}
          <div className="p-4 space-y-4">
            {profile && (
              <div className="px-3 py-2 rounded-lg bg-muted">
                <div className="font-medium text-sm truncate">
                  {profile.full_name || 'User'}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {profile.company || 'No company set'}
                </div>
                {profile.role && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    {profile.role}
                  </Badge>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => setActiveView('settings')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="p-4 lg:p-8">
          {/* Dashboard View */}
          {activeView === 'dashboard' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">
                    Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}!
                  </h1>
                  <p className="text-muted-foreground">
                    Here's your ESG performance overview
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    This Month
                  </Button>
                  <Button size="sm" className="gradient-primary">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Report
                  </Button>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalReports}</div>
                    <p className="text-xs text-muted-foreground">
                      +2 from last month
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${getScoreColor(avgScore)}`}>
                      {avgScore}/10
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Across all reports
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Latest Score</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${lastReport ? getScoreColor(lastReport.score || 0) : 'text-muted-foreground'}`}>
                      {lastReport ? `${lastReport.score}/10` : 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Most recent
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Compliance</CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">94%</div>
                    <p className="text-xs text-muted-foreground">
                      Risk coverage
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Reports */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Recent ESG Reports</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Your latest sustainability assessments
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {recentReports.length > 0 ? (
                    <div className="space-y-4">
                      {recentReports.map((report) => (
                        <div
                          key={report.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {report.company_name || report.file_name || 'Unnamed Report'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(report.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getScoreBadgeVariant(report.score || 0)}>
                              {report.score}/10
                            </Badge>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No reports yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Upload your first sustainability document to get started.
                      </p>
                      <Button onClick={() => setActiveView('upload')}>
                        Upload Report
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Upload View */}
          {activeView === 'upload' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <FileUploadInterface />
            </motion.div>
          )}

          {/* Chat View */}
          {activeView === 'chat' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ChatInterface />
            </motion.div>
          )}

          {/* Reports View */}
          {activeView === 'reports' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Advanced Reports</h3>
                    <p className="text-muted-foreground">
                      Comprehensive report management and analytics coming soon.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Settings View */}
          {activeView === 'settings' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Settings</h3>
                    <p className="text-muted-foreground">
                      Account settings and preferences will be available here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};