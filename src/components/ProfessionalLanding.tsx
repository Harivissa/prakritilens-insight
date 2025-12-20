import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, Play, Upload, MessageSquare, TrendingUp, Shield, Zap, Users, CheckCircle2, Star, Globe, BarChart3, Send, Mail, Rocket, Sparkles, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthModal } from './AuthModal';
import { Footer } from './Footer';
import { toast } from 'sonner';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

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
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = contactSchema.safeParse(contactForm);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { error: dbError } = await supabase
        .from('contact_submissions')
        .insert({
          name: contactForm.name,
          email: contactForm.email,
          message: contactForm.message,
        });

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Failed to save your message');
      }

      const { error: emailError } = await supabase.functions.invoke('send-contact-notification', {
        body: {
          name: contactForm.name,
          email: contactForm.email,
          message: contactForm.message,
        },
      });

      if (emailError) {
        console.error('Email error:', emailError);
      }
      
      toast.success("Thank you for your message! We'll get back to you soon.");
      setContactForm({ name: '', email: '', message: '' });
    } catch (error: any) {
      console.error('Contact form error:', error);
      toast.error(error.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const navItems = [
    { label: '01', text: 'Features' },
    { label: '02', text: 'About' },
    { label: '03', text: 'Contact' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(260,70%,8%)] via-[hsl(280,60%,15%)] to-[hsl(320,50%,12%)] overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Large pink/purple gradient orb - top right */}
        <motion.div
          className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(320 100% 50% / 0.4) 0%, hsl(280 80% 50% / 0.2) 40%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.1, 1],
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Cyan/teal gradient orb - bottom left */}
        <motion.div
          className="absolute -bottom-48 -left-48 w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(174 100% 50% / 0.3) 0%, hsl(200 80% 50% / 0.15) 40%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.15, 1],
            x: [0, -20, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />

        {/* Purple orb - center */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(280 70% 40% / 0.2) 0%, transparent 60%)',
          }}
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Small floating orbs */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-4 h-4 rounded-full"
            style={{
              background: `hsl(${[174, 280, 320, 200, 260][i]} 80% 60%)`,
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`,
              boxShadow: `0 0 20px hsl(${[174, 280, 320, 200, 260][i]} 80% 60% / 0.8)`,
            }}
            animate={{
              y: [-20, 20, -20],
              x: [-10, 10, -10],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(174,100%,50%)] to-[hsl(280,80%,60%)] flex items-center justify-center shadow-neon-cyan">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">
              PrakritiLens<span className="text-[hsl(174,100%,50%)]">.</span>
            </span>
          </motion.div>
          
          <motion.div 
            className="hidden md:flex items-center gap-10"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {navItems.map((item, index) => (
              <a
                key={item.text}
                href={`#${item.text.toLowerCase()}`}
                className="flex items-center gap-2 text-white/70 hover:text-white transition-colors group"
              >
                <span className="text-xs font-mono text-[hsl(320,100%,60%)] group-hover:text-[hsl(174,100%,50%)] transition-colors">
                  {item.label}
                </span>
                <span className="text-sm">{item.text}</span>
              </a>
            ))}
          </motion.div>

          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Button 
              variant="ghost" 
              onClick={handleSignIn}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              Sign In
            </Button>
            <Button 
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-[hsl(174,100%,45%)] to-[hsl(174,100%,50%)] hover:from-[hsl(174,100%,50%)] hover:to-[hsl(174,100%,55%)] text-[hsl(260,70%,8%)] font-semibold px-6 shadow-neon-cyan hover:shadow-[0_0_60px_hsl(174,100%,50%/0.8)] transition-all duration-300"
            >
              Start
            </Button>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial="initial"
              animate="animate"
              variants={staggerContainer}
              className="relative z-10"
            >
              <motion.div variants={fadeInUp} className="mb-6">
                <Badge className="bg-white/10 text-white/90 border-white/20 backdrop-blur-sm px-4 py-2 text-sm">
                  <Sparkles className="w-4 h-4 mr-2 text-[hsl(174,100%,50%)]" />
                  Boost Your Sustainability Strategy
                </Badge>
              </motion.div>

              <motion.div variants={fadeInUp} className="mb-4">
                <span className="text-[hsl(320,100%,65%)] text-lg font-medium tracking-wide uppercase">
                  ESG Optimisation
                </span>
              </motion.div>
              
              <motion.h1 
                variants={fadeInUp}
                className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1]"
              >
                <span className="text-white">Maximise Your</span>
                <br />
                <span className="bg-gradient-to-r from-[hsl(174,100%,50%)] via-[hsl(200,100%,60%)] to-[hsl(280,80%,65%)] bg-clip-text text-transparent">
                  Sustainability
                </span>
                <br />
                <span className="text-white">Impact</span>
              </motion.h1>
              
              <motion.p 
                variants={fadeInUp}
                className="text-lg text-white/60 mb-8 max-w-lg leading-relaxed"
              >
                Transform your ESG reporting with AI-powered analytics. Upload documents, 
                get instant insights, and make data-driven sustainability decisions.
              </motion.p>
              
              <motion.div 
                variants={fadeInUp}
                className="flex flex-wrap gap-4"
              >
                <Button 
                  size="lg" 
                  onClick={handleGetStarted}
                  className="bg-gradient-to-r from-[hsl(174,100%,45%)] to-[hsl(174,100%,50%)] hover:from-[hsl(174,100%,50%)] hover:to-[hsl(174,100%,55%)] text-[hsl(260,70%,8%)] font-semibold px-8 py-6 text-lg shadow-neon-cyan hover:shadow-[0_0_60px_hsl(174,100%,50%/0.8)] transition-all duration-300 rounded-full"
                >
                  <Rocket className="w-5 h-5 mr-2" />
                  Start Free
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={handleWatchDemo}
                  className="border-2 border-white/20 text-white bg-white/5 hover:bg-white/10 hover:border-white/40 px-8 py-6 text-lg backdrop-blur-sm rounded-full transition-all duration-300"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo
                </Button>
              </motion.div>

              {/* Quick Stats */}
              <motion.div 
                variants={fadeInUp}
                className="mt-12 pt-8 border-t border-white/10"
              >
                <p className="text-white/40 text-sm mb-4 uppercase tracking-wider">Trusted by leading organizations</p>
                <div className="flex gap-8">
                  {[
                    { value: '500+', label: 'Reports Analyzed' },
                    { value: '99%', label: 'Accuracy Rate' },
                    { value: '24/7', label: 'AI Support' },
                  ].map((stat, i) => (
                    <div key={stat.label}>
                      <div className="text-2xl font-bold text-white">{stat.value}</div>
                      <div className="text-xs text-white/50">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* Right Content - 3D Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 100 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative hidden lg:block"
            >
              {/* Glowing backdrop */}
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(280,80%,50%/0.3)] via-[hsl(320,100%,50%/0.2)] to-[hsl(174,100%,50%/0.3)] rounded-3xl blur-3xl" />
              
              {/* Main visual container */}
              <div className="relative">
                {/* Laptop/Dashboard mockup */}
                <motion.div
                  className="relative bg-gradient-to-br from-[hsl(260,50%,20%)] to-[hsl(280,50%,15%)] rounded-2xl p-1 shadow-intense"
                  animate={{ y: [-10, 10, -10] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="bg-gradient-to-br from-[hsl(260,40%,12%)] to-[hsl(280,40%,8%)] rounded-xl p-6 min-h-[400px]">
                    {/* Dashboard header */}
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-3 h-3 rounded-full bg-[hsl(0,80%,60%)]" />
                      <div className="w-3 h-3 rounded-full bg-[hsl(45,100%,55%)]" />
                      <div className="w-3 h-3 rounded-full bg-[hsl(140,70%,50%)]" />
                    </div>
                    
                    {/* Mock dashboard content */}
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="flex-1 h-24 rounded-lg bg-gradient-to-br from-[hsl(174,100%,50%/0.2)] to-[hsl(174,100%,50%/0.05)] border border-[hsl(174,100%,50%/0.3)] flex items-center justify-center">
                          <BarChart3 className="w-10 h-10 text-[hsl(174,100%,50%)]" />
                        </div>
                        <div className="flex-1 h-24 rounded-lg bg-gradient-to-br from-[hsl(320,100%,60%/0.2)] to-[hsl(320,100%,60%/0.05)] border border-[hsl(320,100%,60%/0.3)] flex items-center justify-center">
                          <TrendingUp className="w-10 h-10 text-[hsl(320,100%,60%)]" />
                        </div>
                      </div>
                      
                      <div className="h-32 rounded-lg bg-gradient-to-r from-[hsl(280,80%,60%/0.2)] via-[hsl(320,100%,60%/0.15)] to-[hsl(174,100%,50%/0.2)] border border-white/10 p-4">
                        <div className="flex justify-between items-end h-full">
                          {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                            <motion.div
                              key={i}
                              className="w-4 rounded-t bg-gradient-to-t from-[hsl(280,80%,60%)] to-[hsl(174,100%,50%)]"
                              initial={{ height: 0 }}
                              animate={{ height: `${height}%` }}
                              transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Floating rocket icon */}
                <motion.div
                  className="absolute -top-8 -right-8 w-20 h-20 rounded-2xl bg-gradient-to-br from-[hsl(280,80%,60%)] to-[hsl(320,100%,60%)] flex items-center justify-center shadow-neon-pink"
                  animate={{ 
                    y: [-5, 5, -5],
                    rotate: [0, 5, 0, -5, 0],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Rocket className="w-10 h-10 text-white" />
                </motion.div>

                {/* Floating decorative spheres */}
                <motion.div
                  className="absolute -bottom-12 -left-12 w-24 h-24 rounded-full bg-gradient-to-br from-[hsl(174,100%,50%)] to-[hsl(200,100%,60%)] shadow-neon-cyan"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    y: [-5, 10, -5],
                  }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                />
                
                <motion.div
                  className="absolute top-1/2 -left-16 w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(45,100%,55%)] to-[hsl(30,100%,50%)]"
                  animate={{ 
                    y: [-10, 10, -10],
                    x: [-5, 5, -5],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  style={{ boxShadow: '0 0 20px hsl(45 100% 55% / 0.6)' }}
                />

                <motion.div
                  className="absolute bottom-20 -right-6 w-12 h-12 rounded-full bg-gradient-to-br from-[hsl(140,70%,50%)] to-[hsl(160,80%,45%)]"
                  animate={{ 
                    scale: [1, 1.15, 1],
                    rotate: [0, 180, 360],
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  style={{ boxShadow: '0 0 25px hsl(140 70% 50% / 0.6)' }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="bg-white/10 text-white/90 border-white/20 backdrop-blur-sm mb-4">
              <Sparkles className="w-4 h-4 mr-2 text-[hsl(320,100%,60%)]" />
              Powerful Features
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-white">Everything You Need for </span>
              <span className="bg-gradient-to-r from-[hsl(174,100%,50%)] to-[hsl(320,100%,60%)] bg-clip-text text-transparent">
                ESG Excellence
              </span>
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Our comprehensive platform provides all the tools you need to excel in ESG reporting and analysis.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full neon-glass border-white/10 hover:border-white/20 transition-all duration-300 group">
                  <CardHeader>
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[hsl(280,80%,60%)] to-[hsl(320,100%,60%)] flex items-center justify-center mb-4 shadow-neon-purple group-hover:shadow-[0_0_50px_hsl(280,80%,60%/0.6)] transition-all duration-300">
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-xl text-white">{feature.title}</CardTitle>
                    <CardDescription className="text-white/60">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-center text-sm text-white/70">
                          <CheckCircle2 className="w-4 h-4 text-[hsl(174,100%,50%)] mr-2 flex-shrink-0" />
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

      {/* About Section */}
      <section id="about" className="py-24 px-6 relative">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="bg-white/10 text-white/90 border-white/20 backdrop-blur-sm mb-4">
              <Users className="w-4 h-4 mr-2 text-[hsl(174,100%,50%)]" />
              Meet the Founders
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-white">Built with Passion for </span>
              <span className="bg-gradient-to-r from-[hsl(280,80%,60%)] to-[hsl(320,100%,60%)] bg-clip-text text-transparent">
                Sustainability
              </span>
            </h2>
            <p className="text-lg text-white/60 mb-12 max-w-2xl mx-auto">
              PrakritiLens was created to democratize ESG analytics and make sustainability reporting 
              accessible to organizations of all sizes.
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              <motion.div
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[hsl(174,100%,50%)] via-[hsl(280,80%,60%)] to-[hsl(320,100%,60%)] rounded-2xl opacity-40 blur-xl group-hover:opacity-60 transition-opacity duration-500" />
                <div className="relative neon-glass rounded-2xl p-10 text-center">
                  <h3 className="text-3xl font-bold text-white mb-2">Hari Vissa</h3>
                  <p className="text-[hsl(174,100%,50%)]">Lead Developer & Founder</p>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[hsl(320,100%,60%)] via-[hsl(280,80%,60%)] to-[hsl(174,100%,50%)] rounded-2xl opacity-40 blur-xl group-hover:opacity-60 transition-opacity duration-500" />
                <div className="relative neon-glass rounded-2xl p-10 text-center">
                  <h3 className="text-3xl font-bold text-white mb-2">Michelle</h3>
                  <p className="text-[hsl(320,100%,60%)]">Designer & Co-Creator</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 px-6 relative">
        <div className="max-w-xl mx-auto">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="bg-white/10 text-white/90 border-white/20 backdrop-blur-sm mb-4">
              <Mail className="w-4 h-4 mr-2 text-[hsl(280,80%,60%)]" />
              Get in Touch
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-white">Contact </span>
              <span className="bg-gradient-to-r from-[hsl(280,80%,60%)] to-[hsl(174,100%,50%)] bg-clip-text text-transparent">
                Us
              </span>
            </h2>
            <p className="text-lg text-white/60">
              Have questions about our ESG platform? We'd love to hear from you.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="neon-glass border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Send className="w-5 h-5 text-[hsl(174,100%,50%)]" />
                  Send us a Message
                </CardTitle>
                <CardDescription className="text-white/50">
                  Fill out the form below and we'll get back to you soon.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-white/80">
                      Name
                    </label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[hsl(174,100%,50%)/50] focus:ring-[hsl(174,100%,50%)/20]"
                      maxLength={100}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-white/80">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={contactForm.email}
                      onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[hsl(174,100%,50%)/50] focus:ring-[hsl(174,100%,50%)/20]"
                      maxLength={255}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium text-white/80">
                      Message
                    </label>
                    <Textarea
                      id="message"
                      placeholder="Your question or message..."
                      value={contactForm.message}
                      onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[hsl(174,100%,50%)/50] focus:ring-[hsl(174,100%,50%)/20] min-h-[120px]"
                      maxLength={1000}
                    />
                    <p className="text-xs text-white/40 text-right">
                      {contactForm.message.length}/1000
                    </p>
                  </div>

                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-[hsl(280,80%,60%)] to-[hsl(320,100%,60%)] hover:from-[hsl(280,80%,65%)] hover:to-[hsl(320,100%,65%)] text-white shadow-neon-purple hover:shadow-[0_0_40px_hsl(280,80%,60%/0.6)] transition-all duration-300"
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
      <section className="py-24 px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Ready to Transform Your ESG Strategy?
            </h2>
            <p className="text-lg text-white/60 mb-8 max-w-2xl mx-auto">
              Start analyzing your ESG performance today with advanced AI analytics. 
              No credit card required.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-[hsl(174,100%,45%)] to-[hsl(174,100%,50%)] hover:from-[hsl(174,100%,50%)] hover:to-[hsl(174,100%,55%)] text-[hsl(260,70%,8%)] font-semibold px-8 py-6 text-lg shadow-neon-cyan hover:shadow-[0_0_60px_hsl(174,100%,50%/0.8)] transition-all duration-300 rounded-full"
              >
                Get Started Free <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={handleWatchDemo}
                className="border-2 border-white/20 text-white bg-white/5 hover:bg-white/10 hover:border-white/40 px-8 py-6 text-lg backdrop-blur-sm rounded-full transition-all duration-300"
              >
                <Eye className="w-5 h-5 mr-2" /> Learn More
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

      {/* Footer */}
      <Footer />
    </div>
  );
};
