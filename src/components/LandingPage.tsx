import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Leaf, BarChart3, Shield, Globe, ArrowRight, Star } from 'lucide-react';
import { AuthPage } from './AuthPage';

interface LandingPageProps {
  onGetStarted?: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps = {}) {
  const [showAuth, setShowAuth] = useState(false);

  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted();
    } else {
      setShowAuth(true);
    }
  };

  if (showAuth) {
    return <AuthPage onBack={() => setShowAuth(false)} />;
  }
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <IntroAnimation />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-5"></div>
        <FloatingParticles />
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-8xl font-bold mb-6 gradient-hero bg-clip-text text-transparent">
              PrakritiLens
            </h1>
            <p className="text-2xl md:text-3xl text-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed">
              Illuminating Sustainable Futures with ESG & Beyond
            </p>
            <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
              Professional ESG analysis platform with AI-powered insights, sustainability scoring, 
              and comprehensive reporting for modern businesses.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                variant="default" 
                size="lg" 
                onClick={handleGetStarted}
                className="animate-pulse-glow gradient-primary"
              >
                Get Started Free
                <ArrowRight className="ml-2" />
              </Button>
              <Button variant="outline" size="xl">
                Watch Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="mt-16 flex flex-wrap justify-center items-center gap-8 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-warning fill-current" />
                <span>Trusted by 500+ companies</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-success" />
                <span>SOC 2 Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-accent" />
                <span>Global Standards</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Comprehensive ESG Intelligence</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Advanced AI analysis providing deep insights into Environmental, Social, and Governance metrics
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="gradient-card rounded-xl p-8 shadow-card hover:shadow-elegant transition-smooth"
              >
                <div className="bg-primary/10 rounded-lg p-3 w-fit mb-6">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold mb-6">Ready to Transform Your ESG Strategy?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join leading companies using PrakritiLens for comprehensive sustainability insights
            </p>
            <Button variant="default" size="lg" onClick={handleGetStarted} className="gradient-primary">
              Start Your Analysis
              <ArrowRight className="ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function IntroAnimation() {
  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero relative overflow-hidden">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="text-center relative z-10"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="mb-8"
        >
          <Leaf className="h-24 w-24 text-white mx-auto" />
        </motion.div>
        <motion.h1
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="text-6xl md:text-8xl font-bold text-white mb-4"
        >
          PrakritiLens
        </motion.h1>
        <motion.p
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="text-xl text-white/90"
        >
          Illuminating Sustainable Futures
        </motion.p>
      </motion.div>
      <FloatingParticles />
    </div>
  );
}

function FloatingParticles() {
  return (
    <div className="absolute inset-0">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-white/20 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [-20, 20, -20],
            opacity: [0.2, 0.8, 0.2],
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
  );
}

const features = [
  {
    title: "AI-Powered Analysis",
    description: "Advanced machine learning algorithms analyze ESG reports and extract meaningful insights automatically.",
    icon: BarChart3,
  },
  {
    title: "Comprehensive Scoring",
    description: "Get detailed Environmental, Social, and Governance scores with industry benchmarking and trend analysis.",
    icon: Star,
  },
  {
    title: "Risk Assessment",
    description: "Identify potential risks and opportunities with our comprehensive compliance checking system.",
    icon: Shield,
  },
];