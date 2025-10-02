import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Play, Upload, MessageSquare, TrendingUp, Shield, Zap, Users, CheckCircle2, Star, Globe, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthModal } from './AuthModal';

interface ProfessionalLandingProps {
  onGetStarted?: () => void;
}

export const ProfessionalLanding = ({ onGetStarted }: ProfessionalLandingProps) => {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');

  const handleGetStarted = () => {
    setAuthMode('signup');
    setShowAuth(true);
    onGetStarted?.();
  };

  const handleSignIn = () => {
    setAuthMode('signin');
    setShowAuth(true);
  };

  const handleWatchDemo = () => {
    // Smooth scroll to features section
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const features = [
    {
      icon: Upload,
      title: "Smart Document Analysis",
      description: "Upload any document format and get instant AI-powered insights with advanced ESG scoring algorithms.",
      benefits: ["PDF, DOCX, CSV support", "Real-time processing", "99.9% accuracy rate", "Bulk upload capability"]
    },
    {
      icon: MessageSquare,
      title: "AI-Powered Chat Assistant",
      description: "Ask questions about your reports and get detailed explanations from our advanced AI assistant.",
      benefits: ["Natural language queries", "Context-aware responses", "Multi-language support", "24/7 availability"]
    },
    {
      icon: BarChart3,
      title: "Interactive Analytics",
      description: "Visualize your data with stunning charts, graphs, and interactive dashboards for better insights.",
      benefits: ["Real-time charts", "Custom dashboards", "Export capabilities", "Mobile responsive"]
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-grade security with end-to-end encryption to keep your sensitive data completely protected.",
      benefits: ["256-bit encryption", "SOC 2 compliant", "GDPR ready", "Regular audits"]
    }
  ];

  const stats = [
    { number: "AI-Powered", label: "Google Gemini Integration", icon: Zap },
    { number: "Real-Time", label: "ESG Analysis", icon: TrendingUp },
    { number: "100MB+", label: "File Support", icon: Upload },
    { number: "Enterprise", label: "Grade Security", icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-[#000000]">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-[#000000]/80 backdrop-blur-md border-b border-white/10 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <motion.div 
            className="flex items-center space-x-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              PrakritiLens
            </span>
          </motion.div>
          
          <motion.div 
            className="hidden md:flex items-center space-x-8"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-smooth">Features</a>
            <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-smooth">Reviews</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-smooth">Pricing</a>
            <Button variant="ghost" onClick={handleSignIn}>Sign In</Button>
            <Button onClick={handleGetStarted} className="shadow-elegant">
              Get Started <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section - Pure Black Background */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden bg-[#000000]">
        {/* Animated Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-emerald-400/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [1, 2, 1],
                opacity: [0.3, 0.8, 0.3],
                y: [-20, 20, -20],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
        
        {/* Glow Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-3xl" />
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <Badge variant="secondary" className="mb-4 text-sm px-4 py-2 bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
                🌍 Powered by OpenAI
              </Badge>
            </motion.div>
            
            <motion.h1 
              variants={fadeInUp}
              className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
            >
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400 bg-clip-text text-transparent animate-pulse">
                PrakritiLens
              </span>
              <br />
              <span className="text-white">AI-Powered ESG Analytics</span>
            </motion.h1>
            
            <motion.p 
              variants={fadeInUp}
              className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed"
            >
              Transform your ESG reporting with Google Gemini AI. Upload documents up to 100MB, 
              get instant insights, and make data-driven sustainability decisions.
            </motion.p>
            
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            >
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="text-lg px-8 py-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:shadow-[0_0_40px_rgba(16,185,129,0.7)] transition-all duration-300"
              >
                Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={handleWatchDemo}
                className="text-lg px-8 py-6 border-2 border-emerald-500/50 text-white bg-white/5 hover:bg-white/10 transition-smooth backdrop-blur-sm"
              >
                <Play className="w-5 h-5 mr-2" /> Watch Demo
              </Button>
            </motion.div>

            {/* Feature Highlights */}
            <motion.div 
              variants={fadeInUp}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
            >
              {stats.map((stat, index) => (
                <motion.div 
                  key={stat.label}
                  className="text-center backdrop-blur-sm bg-white/5 p-4 rounded-xl border border-emerald-500/20"
                  whileHover={{ scale: 1.05, borderColor: "rgba(16, 185, 129, 0.5)" }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex justify-center mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-lg flex items-center justify-center">
                      <stat.icon className="w-6 h-6 text-emerald-400" />
                    </div>
                  </div>
                  <div className="text-lg font-bold text-emerald-300 mb-1">{stat.number}</div>
                  <div className="text-xs text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-[#000000]">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="secondary" className="mb-4">✨ Powerful Features</Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Everything You Need for 
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> ESG Excellence</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive platform provides all the tools you need to excel in ESG reporting and analysis.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full gradient-card border-0 shadow-elegant hover:shadow-floating transition-all duration-300">
                  <CardHeader>
                    <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-center text-sm text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About / Founders Section */}
      <section id="about" className="py-20 px-4 bg-[#000000]">
        <div className="container mx-auto max-w-4xl">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="secondary" className="mb-4">👥 Meet the Founders</Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Built with Passion for <span className="text-emerald-600">Sustainability</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              PrakritiLens was created to democratize ESG analytics and make sustainability reporting 
              accessible to organizations of all sizes.
            </p>

            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="gradient-card border-0 shadow-card hover:shadow-elegant transition-smooth text-center p-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">HV</span>
                  </div>
                  <CardTitle className="text-2xl mb-2">Hari Vissa</CardTitle>
                  <CardDescription className="text-base mb-4">
                    Lead Developer & Founder
                  </CardDescription>
                  <p className="text-sm text-muted-foreground">
                    Architecting intelligent solutions for a sustainable future
                  </p>
                </Card>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="gradient-card border-0 shadow-card hover:shadow-elegant transition-smooth text-center p-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">M</span>
                  </div>
                  <CardTitle className="text-2xl mb-2">Michelle</CardTitle>
                  <CardDescription className="text-base mb-4">
                    Designer & Co-Creator
                  </CardDescription>
                  <p className="text-sm text-muted-foreground">
                    Crafting beautiful experiences that drive meaningful change
                  </p>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-[#000000] text-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-32 h-32 border border-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.1, 0.3],
              }}
              transition={{
                duration: 4 + Math.random() * 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
        
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Transform Your ESG Strategy?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Start analyzing your ESG performance today with Google Gemini AI. 
              No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                onClick={handleGetStarted}
                className="text-lg px-8 py-6 bg-white text-emerald-600 hover:bg-gray-100 shadow-floating hover:shadow-elegant transition-all duration-300"
              >
                Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={handleWatchDemo}
                className="text-lg px-8 py-6 border-2 border-white/50 text-white bg-white/10 hover:bg-white/20 transition-smooth backdrop-blur-sm"
              >
                <Play className="w-5 h-5 mr-2" /> Watch Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#000000] py-16 px-4 border-t border-white/10">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold">PrakritiLens</span>
              </div>
              <p className="text-muted-foreground mb-4">
                AI-powered ESG analytics platform built for transparency and sustainability.
              </p>
              <p className="text-sm text-emerald-600 font-medium">
                Powered by Google Gemini
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-smooth">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition-smooth">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-smooth">API</a></li>
                <li><a href="#" className="hover:text-foreground transition-smooth">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-smooth">About Us</a></li>
                <li><a href="#" className="hover:text-foreground transition-smooth">Careers</a></li>
                <li><a href="#" className="hover:text-foreground transition-smooth">Contact</a></li>
                <li><a href="#" className="hover:text-foreground transition-smooth">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-smooth">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-smooth">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition-smooth">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-smooth">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              <p className="text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} PrakritiLens. All rights reserved.
              </p>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Made with</span>
                <span className="text-red-500 text-lg">❤️</span>
                <span className="text-sm text-muted-foreground">by</span>
                <span className="text-sm font-semibold text-emerald-600">Hari Vissa & Michelle</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  );
};