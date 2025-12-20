import { Globe, Sparkles, Leaf, Linkedin, Twitter, Github, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="relative mt-auto border-t border-white/10 bg-gradient-to-br from-[hsl(260,70%,6%)] via-[hsl(280,50%,10%)] to-[hsl(260,60%,8%)]">
      {/* Decorative gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -bottom-32 w-80 h-80 bg-[hsl(174,100%,50%/0.15)] rounded-full blur-3xl" />
        <div className="absolute -right-32 -top-32 w-80 h-80 bg-[hsl(320,100%,60%/0.15)] rounded-full blur-3xl" />
        <div className="absolute left-1/2 top-0 w-64 h-64 bg-[hsl(280,80%,60%/0.1)] rounded-full blur-3xl -translate-x-1/2" />
      </div>

      <div className="container mx-auto px-6 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand Section */}
          <motion.div 
            className="space-y-5"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[hsl(174,100%,50%)] to-[hsl(280,80%,60%)] flex items-center justify-center shadow-neon-cyan">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">
                PrakritiLens<span className="text-[hsl(174,100%,50%)]">.</span>
              </h3>
            </div>
            <p className="text-sm text-white/50 leading-relaxed">
              AI-Powered ESG Analytics Platform transforming sustainability reporting 
              with cutting-edge technology and professional insights.
            </p>
            
            {/* Social Media Links */}
            <div className="flex items-center gap-3 pt-2">
              <motion.a
                href="https://www.linkedin.com/in/harivissa"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-[hsl(174,100%,50%)] hover:bg-[hsl(174,100%,50%/0.1)] hover:border-[hsl(174,100%,50%/0.3)] hover:shadow-[0_0_20px_hsl(174,100%,50%/0.3)] transition-all duration-300"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Linkedin className="w-4 h-4" />
              </motion.a>
              <motion.a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-[hsl(320,100%,60%)] hover:bg-[hsl(320,100%,60%/0.1)] hover:border-[hsl(320,100%,60%/0.3)] hover:shadow-[0_0_20px_hsl(320,100%,60%/0.3)] transition-all duration-300"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Twitter className="w-4 h-4" />
              </motion.a>
              <motion.a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-[hsl(280,80%,60%)] hover:bg-[hsl(280,80%,60%/0.1)] hover:border-[hsl(280,80%,60%/0.3)] hover:shadow-[0_0_20px_hsl(280,80%,60%/0.3)] transition-all duration-300"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Github className="w-4 h-4" />
              </motion.a>
              <motion.a
                href="#contact"
                onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-[hsl(174,100%,50%)] hover:bg-[hsl(174,100%,50%/0.1)] hover:border-[hsl(174,100%,50%/0.3)] hover:shadow-[0_0_20px_hsl(174,100%,50%/0.3)] transition-all duration-300"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Mail className="w-4 h-4" />
              </motion.a>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            className="space-y-5"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h4 className="font-semibold text-white flex items-center gap-2">
              <Leaf className="w-4 h-4 text-[hsl(174,100%,50%)]" />
              <span>Platform</span>
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <button 
                  onClick={() => scrollToSection('features')} 
                  className="text-white/50 hover:text-[hsl(174,100%,50%)] transition-colors duration-300 inline-flex items-center group"
                >
                  <span className="border-b border-transparent group-hover:border-[hsl(174,100%,50%)] transition-colors">Features</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection('about')} 
                  className="text-white/50 hover:text-[hsl(174,100%,50%)] transition-colors duration-300 inline-flex items-center group"
                >
                  <span className="border-b border-transparent group-hover:border-[hsl(174,100%,50%)] transition-colors">About Us</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection('pricing')} 
                  className="text-white/50 hover:text-[hsl(174,100%,50%)] transition-colors duration-300 inline-flex items-center group"
                >
                  <span className="border-b border-transparent group-hover:border-[hsl(174,100%,50%)] transition-colors">Pricing</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection('contact')} 
                  className="text-white/50 hover:text-[hsl(174,100%,50%)] transition-colors duration-300 inline-flex items-center group"
                >
                  <span className="border-b border-transparent group-hover:border-[hsl(174,100%,50%)] transition-colors">Contact</span>
                </button>
              </li>
            </ul>
          </motion.div>

          {/* Legal & Resources */}
          <motion.div
            className="space-y-5"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h4 className="font-semibold text-white">Resources</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a 
                  href="https://docs.lovable.dev" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/50 hover:text-[hsl(320,100%,60%)] transition-colors duration-300 inline-flex items-center group"
                >
                  <span className="border-b border-transparent group-hover:border-[hsl(320,100%,60%)] transition-colors">Documentation</span>
                </a>
              </li>
              <li>
                <a href="#" className="text-white/50 hover:text-[hsl(320,100%,60%)] transition-colors duration-300 inline-flex items-center group">
                  <span className="border-b border-transparent group-hover:border-[hsl(320,100%,60%)] transition-colors">Privacy Policy</span>
                </a>
              </li>
              <li>
                <a href="#" className="text-white/50 hover:text-[hsl(320,100%,60%)] transition-colors duration-300 inline-flex items-center group">
                  <span className="border-b border-transparent group-hover:border-[hsl(320,100%,60%)] transition-colors">Terms of Service</span>
                </a>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection('contact')} 
                  className="text-white/50 hover:text-[hsl(320,100%,60%)] transition-colors duration-300 inline-flex items-center group"
                >
                  <span className="border-b border-transparent group-hover:border-[hsl(320,100%,60%)] transition-colors">Support</span>
                </button>
              </li>
            </ul>
          </motion.div>

          {/* Connect */}
          <motion.div
            className="space-y-5"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h4 className="font-semibold text-white">Connect</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a 
                  href="https://www.linkedin.com/in/harivissa" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/50 hover:text-[hsl(280,80%,60%)] transition-colors duration-300 inline-flex items-center group"
                >
                  <Linkedin className="w-4 h-4 mr-2 text-[hsl(280,80%,60%/0.7)] group-hover:text-[hsl(280,80%,60%)]" />
                  <span className="border-b border-transparent group-hover:border-[hsl(280,80%,60%)] transition-colors">LinkedIn</span>
                </a>
              </li>
              <li>
                <a 
                  href="https://twitter.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/50 hover:text-[hsl(280,80%,60%)] transition-colors duration-300 inline-flex items-center group"
                >
                  <Twitter className="w-4 h-4 mr-2 text-[hsl(280,80%,60%/0.7)] group-hover:text-[hsl(280,80%,60%)]" />
                  <span className="border-b border-transparent group-hover:border-[hsl(280,80%,60%)] transition-colors">Twitter</span>
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-white/50 hover:text-[hsl(280,80%,60%)] transition-colors duration-300 inline-flex items-center group"
                >
                  <Github className="w-4 h-4 mr-2 text-[hsl(280,80%,60%/0.7)] group-hover:text-[hsl(280,80%,60%)]" />
                  <span className="border-b border-transparent group-hover:border-[hsl(280,80%,60%)] transition-colors">GitHub</span>
                </a>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection('contact')}
                  className="text-white/50 hover:text-[hsl(280,80%,60%)] transition-colors duration-300 inline-flex items-center group"
                >
                  <Mail className="w-4 h-4 mr-2 text-[hsl(280,80%,60%/0.7)] group-hover:text-[hsl(280,80%,60%)]" />
                  <span className="border-b border-transparent group-hover:border-[hsl(280,80%,60%)] transition-colors">Contact Us</span>
                </button>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div 
          className="pt-8 border-t border-white/10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-white/40">
              © {currentYear} PrakritiLens. All rights reserved.
            </div>
            
            {/* Credits Section */}
            <motion.div 
              className="flex items-center gap-2 text-sm"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <span className="text-white/40">Built by</span>
              <div className="flex items-center gap-2">
                <a 
                  href="https://www.linkedin.com/in/harivissa" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold bg-gradient-to-r from-[hsl(174,100%,50%)] via-[hsl(280,80%,60%)] to-[hsl(320,100%,60%)] bg-clip-text text-transparent hover:opacity-80 transition-opacity"
                >
                  Hari Vissa
                </a>
                <span className="text-white/40">&</span>
                <span className="font-semibold bg-gradient-to-r from-[hsl(320,100%,60%)] via-[hsl(280,80%,60%)] to-[hsl(174,100%,50%)] bg-clip-text text-transparent">
                  Michelle
                </span>
              </div>
            </motion.div>

            {/* Tech Badge */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-[hsl(174,100%,50%)]" />
              <span className="text-xs font-medium text-white/70">Enterprise Grade</span>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};
