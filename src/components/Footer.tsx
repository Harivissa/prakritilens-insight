import { Globe, Sparkles, Leaf } from 'lucide-react';
import { motion } from 'framer-motion';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-auto border-t border-border bg-gradient-to-br from-background via-background to-muted/20">
      {/* Decorative gradient orbs */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand Section */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-elegant">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                PrakritiLens
              </h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI-Powered ESG Analytics Platform transforming sustainability reporting 
              with cutting-edge technology and professional insights.
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h4 className="font-semibold text-foreground flex items-center space-x-2">
              <Leaf className="w-4 h-4 text-primary" />
              <span>Platform</span>
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#features" className="hover:text-primary transition-smooth inline-flex items-center group">
                  <span className="border-b border-transparent group-hover:border-primary transition-smooth">Features</span>
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-primary transition-smooth inline-flex items-center group">
                  <span className="border-b border-transparent group-hover:border-primary transition-smooth">About Us</span>
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-primary transition-smooth inline-flex items-center group">
                  <span className="border-b border-transparent group-hover:border-primary transition-smooth">Pricing</span>
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-primary transition-smooth inline-flex items-center group">
                  <span className="border-b border-transparent group-hover:border-primary transition-smooth">Contact</span>
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Legal & Resources */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h4 className="font-semibold text-foreground">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary transition-smooth inline-flex items-center group">
                  <span className="border-b border-transparent group-hover:border-primary transition-smooth">Documentation</span>
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-smooth inline-flex items-center group">
                  <span className="border-b border-transparent group-hover:border-primary transition-smooth">Privacy Policy</span>
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-smooth inline-flex items-center group">
                  <span className="border-b border-transparent group-hover:border-primary transition-smooth">Terms of Service</span>
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-smooth inline-flex items-center group">
                  <span className="border-b border-transparent group-hover:border-primary transition-smooth">Support</span>
                </a>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div 
          className="pt-8 border-t border-border"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-muted-foreground flex items-center space-x-2">
              <span>© {currentYear} PrakritiLens. All rights reserved.</span>
            </div>
            
            {/* Credits Section */}
            <motion.div 
              className="flex items-center space-x-2 text-sm"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <span className="text-muted-foreground">Built by</span>
              <div className="flex items-center space-x-2">
                <a 
                  href="#" 
                  className="font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-orange-600 bg-clip-text text-transparent hover:from-blue-700 hover:via-purple-700 hover:to-orange-700 transition-smooth"
                >
                  Hari Vissa
                </a>
                <span className="text-muted-foreground">&</span>
                <a 
                  href="#" 
                  className="font-semibold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 transition-smooth"
                >
                  Michelle
                </a>
              </div>
            </motion.div>

            {/* Tech Badge */}
            <div className="flex items-center space-x-2 px-4 py-2 rounded-full bg-muted/50 border border-border">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-foreground">Enterprise Grade</span>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};