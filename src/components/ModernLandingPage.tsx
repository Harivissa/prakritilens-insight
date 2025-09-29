import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  ArrowRight, 
  Shield, 
  BarChart3, 
  Globe, 
  Zap,
  CheckCircle,
  Star,
  Users,
  TrendingUp
} from 'lucide-react';
import { AuthModal } from './AuthModal';

interface ModernLandingPageProps {
  onGetStarted?: () => void;
}

export const ModernLandingPage = ({ onGetStarted }: ModernLandingPageProps) => {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');

  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted();
    } else {
      setAuthMode('signup');
      setShowAuth(true);
    }
  };

  const handleWatchDemo = () => {
    // TODO: Add demo video modal or redirect
    console.log('Watch demo clicked');
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-xl">PrakritiLens</span>
              </div>
              
              <div className="hidden md:flex items-center gap-8">
                <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
                <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
                <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">About</a>
              </div>

              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setAuthMode('signin');
                    setShowAuth(true);
                  }}
                >
                  Sign In
                </Button>
                <Button onClick={handleGetStarted} className="gradient-primary">
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-24 pb-12 md:pt-32 md:pb-20">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-6">
                  <Zap className="w-4 h-4" />
                  AI-Powered ESG Analysis
                </div>
                
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                  Transform Your{' '}
                  <span className="gradient-hero bg-clip-text text-transparent">
                    ESG Strategy
                  </span>
                </h1>
                
                <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
                  Professional ESG risk assessment platform with AI-powered insights, 
                  comprehensive scoring, and automated reporting for modern enterprises.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                  <Button 
                    size="lg" 
                    onClick={handleGetStarted}
                    className="gradient-primary text-lg px-8 py-3 h-auto"
                  >
                    Start Free Analysis
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={handleWatchDemo}
                    className="text-lg px-8 py-3 h-auto"
                  >
                    <Play className="mr-2 w-5 h-5" />
                    Watch Demo
                  </Button>
                </div>

                {/* Social Proof */}
                <div className="flex flex-wrap justify-center items-center gap-8 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    <span>500+ Companies</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    <span>SOC 2 Certified</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    <span>Global Standards</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-muted/30">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Everything you need for ESG excellence
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Comprehensive tools and AI-powered insights to streamline your sustainability reporting
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-background rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  <div className="mt-4">
                    {feature.benefits.map((benefit, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        {benefit}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Ready to accelerate your ESG journey?
                </h2>
                <p className="text-xl text-muted-foreground mb-8">
                  Join industry leaders using PrakritiLens for comprehensive sustainability insights and reporting.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    onClick={handleGetStarted}
                    className="gradient-primary text-lg px-8 py-3 h-auto"
                  >
                    Start Your Free Trial
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
                
                <div className="mt-8 flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current text-yellow-500" />
                  ))}
                  <span className="ml-2">4.9/5 from 200+ reviews</span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t py-12 bg-muted/30">
          <div className="container mx-auto px-6">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-lg">PrakritiLens</span>
                </div>
                <p className="text-muted-foreground">
                  Professional ESG risk assessment platform for modern enterprises.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Product</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">API</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Resources</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t mt-12 pt-8 text-center text-muted-foreground">
              <p>&copy; 2024 PrakritiLens. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </>
  );
};

const features = [
  {
    title: "AI-Powered Analysis",
    description: "Advanced machine learning algorithms analyze your ESG documents and extract actionable insights automatically.",
    icon: Zap,
    benefits: [
      "Automated document processing",
      "Smart data extraction",
      "Real-time insights"
    ]
  },
  {
    title: "Comprehensive Scoring",
    description: "Get detailed Environmental, Social, and Governance scores with industry benchmarking and trend analysis.",
    icon: TrendingUp,
    benefits: [
      "Industry benchmarks",
      "Historical tracking",
      "Performance metrics"
    ]
  },
  {
    title: "Risk Assessment",
    description: "Identify potential ESG risks and opportunities with our comprehensive compliance checking system.",
    icon: Shield,
    benefits: [
      "Risk identification",
      "Compliance checking",
      "Opportunity mapping"
    ]
  },
  {
    title: "Interactive Dashboard",
    description: "Professional dashboard with real-time analytics, customizable reports, and intuitive data visualization.",
    icon: BarChart3,
    benefits: [
      "Real-time analytics",
      "Custom reports",
      "Data visualization"
    ]
  },
  {
    title: "AI Chat Assistant",
    description: "Get instant answers to ESG questions, guidance on best practices, and personalized recommendations.",
    icon: Globe,
    benefits: [
      "24/7 availability",
      "Expert guidance",
      "Personalized tips"
    ]
  },
  {
    title: "Secure & Compliant",
    description: "Enterprise-grade security with SOC 2 compliance, ensuring your sensitive ESG data is protected.",
    icon: Users,
    benefits: [
      "SOC 2 certified",
      "End-to-end encryption",
      "Regular audits"
    ]
  }
];