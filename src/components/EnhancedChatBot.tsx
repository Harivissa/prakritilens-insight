import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, MessageSquare, Bot, User, Sparkles, RefreshCw, 
  Copy, ThumbsUp, ThumbsDown, MoreVertical, Zap,
  FileText, BarChart3, TrendingUp, HelpCircle, Clock,
  Lightbulb, Target, Globe, Leaf
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChats } from '@/hooks/useChats';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export const EnhancedChatBot = () => {
  const { user } = useAuth();
  const { chats, loading, sending, sendMessage, clearChats } = useChats();
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [chats]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    const userMessage = message.trim();
    setMessage('');
    setIsTyping(true);

    try {
      await sendMessage(userMessage);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleSampleQuestion = (question: string) => {
    setMessage(question);
  };

  const handleClearChat = async () => {
    try {
      await clearChats();
      toast({
        title: "Chat Cleared",
        description: "All chat messages have been cleared.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear chat. Please try again.",
        variant: "destructive",
      });
    }
  };

  const sampleQuestions = [
    "What are the top ESG trends for 2024 that companies should focus on?",
    "How can PrakritiLens help improve our environmental sustainability score?",
    "What are the key differences between ESG and CSR reporting?",
    "Which ESG metrics do institutional investors prioritize most?",
    "What are emerging ESG risks in the technology and AI sector?",
    "How can companies effectively communicate their ESG initiatives to stakeholders?"
  ];

  const quickActions = [
    { icon: BarChart3, label: "ESG Analysis", prompt: "Explain how PrakritiLens analyzes ESG performance" },
    { icon: TrendingUp, label: "Benchmarking", prompt: "How does industry benchmarking work in ESG?" },
    { icon: Globe, label: "Sustainability", prompt: "What are the latest global sustainability regulations?" },
    { icon: Target, label: "Goals", prompt: "Help me set science-based ESG targets for our company" },
    { icon: Lightbulb, label: "Innovation", prompt: "What are innovative ESG solutions for reducing carbon footprint?" },
    { icon: Leaf, label: "Climate", prompt: "Explain climate risk assessment and TCFD reporting" }
  ];

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col space-y-4">
      {/* Enhanced Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="gradient-card border-0 shadow-card">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                    <Bot className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                </div>
                <div>
                  <CardTitle className="flex items-center space-x-2 text-xl">
                    <span>PrakritiLens AI Assistant</span>
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      GPT-Powered
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-base">
                    Your intelligent ESG companion • Available 24/7 • Real-time insights
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={handleClearChat}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Clear Chat
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Chat Messages */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex-1"
      >
        <Card className="gradient-card border-0 shadow-card h-full">
          <CardContent className="p-0 h-full">
            <ScrollArea ref={scrollAreaRef} className="h-full p-6">
              <div className="space-y-6">
                {/* Enhanced Welcome Message */}
                {chats.length === 0 && !loading && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-center py-8"
                  >
                    <div className="relative mb-6">
                      <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto">
                        <Bot className="w-10 h-10 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                        <Sparkles className="w-4 h-4 text-yellow-800" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      Welcome to PrakritiLens AI
                    </h3>
                    <p className="text-muted-foreground mb-8 max-w-lg mx-auto text-lg leading-relaxed">
                      I'm your intelligent ESG assistant, powered by advanced AI. I specialize in sustainability, 
                      environmental impact, social responsibility, and governance best practices. Let's build a 
                      more sustainable future together! 🌱
                    </p>
                    
                    {/* Quick Actions */}
                    <div className="mb-8">
                      <h4 className="text-sm font-semibold text-muted-foreground mb-4">Quick Actions</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-2xl mx-auto">
                        {quickActions.map((action, index) => (
                          <motion.button
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            onClick={() => handleSampleQuestion(action.prompt)}
                            className="p-3 bg-gradient-to-br from-muted/50 to-muted rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all duration-200 group"
                          >
                            <action.icon className="w-6 h-6 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-medium">{action.label}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Sample Questions */}
                    <div className="grid gap-3 max-w-2xl mx-auto">
                      <h4 className="text-sm font-semibold text-muted-foreground mb-3">Sample Questions</h4>
                      <div className="grid gap-2">
                        {sampleQuestions.map((question, index) => (
                          <motion.button
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 + 0.6 }}
                            onClick={() => handleSampleQuestion(question)}
                            className="p-4 text-sm text-left bg-gradient-to-r from-muted/30 to-muted/50 hover:from-primary/10 hover:to-primary/20 rounded-lg transition-all duration-200 border border-border hover:border-primary/20 group"
                          >
                            <div className="flex items-start space-x-3">
                              <HelpCircle className="w-4 h-4 text-primary mt-0.5 group-hover:scale-110 transition-transform" />
                              <span className="leading-relaxed">{question}</span>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Loading State */}
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center space-x-3 text-muted-foreground">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span>Loading your conversation history...</span>
                    </div>
                  </div>
                )}

                {/* Chat Messages */}
                <AnimatePresence>
                  {chats.map((chat, index) => (
                    <motion.div
                      key={chat.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="space-y-4"
                    >
                      {/* User Message */}
                      <div className="flex justify-end">
                        <div className="flex items-start space-x-3 max-w-[80%]">
                          <div className="bg-gradient-primary text-white rounded-2xl rounded-tr-sm px-5 py-4 shadow-elegant">
                            <p className="text-sm leading-relaxed">{chat.message}</p>
                            <div className="flex items-center justify-end mt-3 text-xs opacity-80">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatTimestamp(chat.created_at)}
                            </div>
                          </div>
                          <div className="w-9 h-9 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      </div>

                      {/* AI Response */}
                      <div className="flex justify-start">
                        <div className="flex items-start space-x-3 max-w-[85%]">
                          <div className="w-9 h-9 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                            <Bot className="w-5 h-5 text-white" />
                          </div>
                          <div className="bg-muted/70 rounded-2xl rounded-tl-sm px-5 py-4 shadow-card border border-border/50">
                            <div className="prose prose-sm max-w-none">
                              <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground mb-0">{chat.response}</p>
                            </div>
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatTimestamp(chat.created_at)}
                              </div>
                              <div className="flex items-center space-x-1">
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-primary/10">
                                  <Copy className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-green-50 hover:text-green-600">
                                  <ThumbsUp className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600">
                                  <ThumbsDown className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Enhanced Typing Indicator */}
                {(sending || isTyping) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-9 h-9 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div className="bg-muted/70 rounded-2xl rounded-tl-sm px-5 py-4 border border-border/50">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">PrakritiLens AI is thinking</span>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>

      {/* Enhanced Message Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="gradient-card border-0 shadow-card">
          <CardContent className="p-4">
            <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
              <div className="flex-1">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask me anything about ESG, sustainability, climate action, regulations, or your reports..."
                  className="min-h-[70px] max-h-32 resize-none border-0 focus-visible:ring-2 focus-visible:ring-primary bg-muted/30"
                  disabled={sending}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
              </div>
              <Button 
                type="submit" 
                disabled={!message.trim() || sending}
                className="h-[70px] px-6 shadow-elegant hover:shadow-floating transition-all duration-200"
              >
                {sending ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <RefreshCw className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </form>
            
            <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Zap className="w-3 h-3 text-yellow-500" />
                  <span>Powered by PrakritiLens AI</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>Real-time insights</span>
                </div>
              </div>
              <div>
                Press Shift+Enter for new line
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};