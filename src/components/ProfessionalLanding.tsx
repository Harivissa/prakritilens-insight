import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, Play, Upload, MessageSquare, TrendingUp, Shield, Zap, Users, CheckCircle2, Star, Globe, BarChart3, Send, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthModal } from './AuthModal';
import { Footer } from './Footer';
import { toast } from 'sonner';
import { z } from 'zod';

interface ProfessionalLandingProps {
  onGetStarted?: () => void;
}

// Contact form validation schema
const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  message: z.string().trim().min(1, "Message is required").max(1000, "Message must be less than 1000 characters")
});

export const ProfessionalLanding = ({ onGetStarted }: ProfessionalLandingProps) => {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const result = contactSchema.safeParse(contactForm);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    
    // Simulate form submission (in production, send to backend/email service)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success("Thank you for your message! We'll get back to you soon.");
    setContactForm({ name: '', email: '', message: '' });
    setIsSubmitting(false);
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
    { number: "AI-Powered", label: "Advanced Analytics", icon: Zap },
    { number: "Real-Time", label: "ESG Analysis", icon: TrendingUp },
    { number: "100MB+", label: "File Support", icon: Upload },
    { number: "Enterprise", label: "Grade Security", icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-[#000000]">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-[#000000] border-b border-white/10 z-50">
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
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-smooth">About</a>
            <a href="#contact" className="text-muted-foreground hover:text-foreground transition-smooth">Contact</a>
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
                🌍 AI-Powered ESG Analytics
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
              Transform your ESG reporting with AI-powered analytics. Upload documents up to 100MB, 
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
              <span className="text-white">Everything You Need for </span>
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">ESG Excellence</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
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
              <span className="text-white">Built with Passion for </span>
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Sustainability</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
              PrakritiLens was created to democratize ESG analytics and make sustainability reporting 
              accessible to organizations of all sizes.
            </p>

            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="relative group"
              >
                {/* Flowing multi-color gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-orange-500 rounded-3xl opacity-60 blur-2xl group-hover:opacity-80 transition-opacity duration-500" />
                
                {/* Frosted glass card */}
                <div className="relative bg-gradient-to-br from-gray-900/80 via-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-10 text-center overflow-hidden">
                  {/* Inner gradient glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-orange-500/10 rounded-3xl" />
                  
                  <div className="relative z-10">
                    <h3 className="text-4xl font-bold text-white mb-3">Hari Vissa</h3>
                    <p className="text-lg text-gray-300">
                      Lead Developer & Founder
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="relative group"
              >
                {/* Flowing multi-color gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-3xl opacity-60 blur-2xl group-hover:opacity-80 transition-opacity duration-500" />
                
                {/* Frosted glass card */}
                <div className="relative bg-gradient-to-br from-gray-900/80 via-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-10 text-center overflow-hidden">
                  {/* Inner gradient glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 rounded-3xl" />
                  
                  <div className="relative z-10">
                    <h3 className="text-4xl font-bold text-white mb-3">Michelle</h3>
                    <p className="text-lg text-gray-300">
                      Designer & Co-Creator
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section id="contact" className="py-20 px-4 bg-[#000000]">
        <div className="container mx-auto max-w-4xl">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="secondary" className="mb-4">📬 Get in Touch</Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="text-white">Contact </span>
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Us</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Have questions about our ESG platform? We'd love to hear from you.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="max-w-xl mx-auto"
          >
            <Card className="bg-gradient-to-br from-gray-900/80 via-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-emerald-400" />
                  Send us a Message
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Fill out the form below and we'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-gray-300">
                      Name
                    </label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-emerald-500/50"
                      maxLength={100}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-gray-300">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={contactForm.email}
                      onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-emerald-500/50"
                      maxLength={255}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium text-gray-300">
                      Message
                    </label>
                    <Textarea
                      id="message"
                      placeholder="Your question or message..."
                      value={contactForm.message}
                      onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-emerald-500/50 min-h-[120px]"
                      maxLength={1000}
                    />
                    <p className="text-xs text-gray-500 text-right">
                      {contactForm.message.length}/1000
                    </p>
                  </div>

                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all duration-300"
                  >
                    {isSubmitting ? (
                      <>Sending...</>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
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
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-gray-100">
              Ready to Transform Your ESG Strategy?
            </h2>
            <p className="text-xl mb-8 text-gray-100 max-w-2xl mx-auto">
              Start analyzing your ESG performance today with advanced AI analytics. 
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

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />

      {/* Professional Footer */}
      <Footer />
    </div>
  );
};