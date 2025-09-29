import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  FileText, 
  Upload, 
  Bot, 
  Settings, 
  LogOut, 
  Leaf,
  Menu,
  X
} from 'lucide-react';
import Dashboard from './Dashboard';
import { FileUpload } from './FileUpload';
import AIAssistant from './AIAssistant';
import SettingsComponent from './Settings';
import { cn } from '@/lib/utils';

const ProfessionalESGPlatform = () => {
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview & Analytics'
    },
    {
      id: 'upload',
      label: 'Upload & Analyze',
      icon: Upload,
      description: 'ESG Assessment'
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      description: 'View Reports'
    },
    {
      id: 'assistant',
      label: 'AI Assistant',
      icon: Bot,
      description: 'Chat with AI'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      description: 'Account Settings'
    }
  ];

  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 40
      }
    },
    closed: {
      x: "-100%",
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 40
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-background"
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <motion.aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-card border-r transform lg:translate-x-0 lg:static lg:inset-0",
          "lg:flex lg:flex-col"
        )}
        variants={sidebarVariants}
        initial="closed"
        animate={sidebarOpen ? "open" : "closed"}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center space-x-3 px-6 py-6">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">PrakritiLens</h1>
              <p className="text-xs text-muted-foreground">ESG Risk Assessment</p>
            </div>
          </div>

          <Separator />

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6">
            <div className="space-y-2">
              {navItems.map((item) => (
                <motion.button
                  key={item.id}
                  className={cn(
                    "w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                    activeTab === item.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  )}
                  onClick={() => {
                    setActiveTab(item.id);
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
                </motion.button>
              ))}
            </div>
          </nav>

          <Separator />

          {/* User Info & Sign Out */}
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
            
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </motion.aside>

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
      <main className="lg:ml-64 flex-1">
        <div className="p-6 lg:p-8">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'upload' && <FileUpload />}
            {activeTab === 'reports' && (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Reports Coming Soon</h3>
                    <p className="text-muted-foreground">
                      Advanced report management and analytics will be available here.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            {activeTab === 'assistant' && <AIAssistant />}
            {activeTab === 'settings' && <SettingsComponent />}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ProfessionalESGPlatform;