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
  FileText, BarChart3, TrendingUp, HelpCircle, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChats } from '@/hooks/useChats';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export const ProfessionalChat = () => {
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
    "What are the key ESG trends for 2024 and how can PrakritiLens help?",
    "How can I improve my company's environmental score using AI insights?",
    "Explain the difference between ESG and sustainability reporting",
    "What are the most important ESG metrics to track for investors?",
    "How do investors evaluate ESG performance in the current market?",
    "What are common ESG risks in the technology sector and mitigation strategies?"
  ];

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 rounded-t-xl flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-md">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Prakriti AI</h3>
            <p className="text-xs text-muted-foreground">Your ESG Assistant</p>
          </div>
        </div>
        {chats.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClearChat}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Clear Chat
          </Button>
        )}
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-hidden bg-background">

        {/* Welcome Message */}
        {chats.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-elegant">
              <Bot className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-3">
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.email?.split('@')[0] || 'User'}
            </h2>
            <p className="text-xl mb-2">
              What's on <span className="text-purple-500 font-semibold">your mind</span>?
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              AI is capable of make a mistake. Consider checking important information.
            </p>
            
            {/* Quick Action Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto mb-8">
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => handleSampleQuestion("Analyze my latest ESG report")}
                className="p-4 bg-card hover:bg-muted rounded-2xl transition-smooth border border-border text-left group"
              >
                <FileText className="w-5 h-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-medium">Analyze Report</div>
              </motion.button>
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                onClick={() => handleSampleQuestion("What are ESG best practices?")}
                className="p-4 bg-card hover:bg-muted rounded-2xl transition-smooth border border-border text-left group"
              >
                <BarChart3 className="w-5 h-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-medium">ESG Insights</div>
              </motion.button>
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                onClick={() => handleSampleQuestion("Show sustainability trends")}
                className="p-4 bg-card hover:bg-muted rounded-2xl transition-smooth border border-border text-left group"
              >
                <TrendingUp className="w-5 h-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-medium">Trends</div>
              </motion.button>
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                onClick={() => handleSampleQuestion("Help me improve my score")}
                className="p-4 bg-card hover:bg-muted rounded-2xl transition-smooth border border-border text-left group"
              >
                <HelpCircle className="w-5 h-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-medium">Get Help</div>
              </motion.button>
            </div>

            {/* Sample Questions */}
            <div className="max-w-2xl mx-auto">
              <h4 className="text-sm font-medium text-muted-foreground mb-3 text-center">Or try these questions:</h4>
              <div className="grid gap-2">
                {sampleQuestions.slice(0, 3).map((question, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                    onClick={() => handleSampleQuestion(question)}
                    className="p-3 text-sm text-left bg-muted/30 hover:bg-muted/50 rounded-xl transition-smooth border border-border/50"
                  >
                    {question}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Loading chat history...</span>
            </div>
          </div>
        )}

        <ScrollArea ref={scrollAreaRef} className="h-full">
          <div className="space-y-6 px-6 py-6">
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
                  <div className="flex justify-end group">
                    <div className="flex items-start space-x-3 max-w-[75%]">
                      <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-2xl rounded-tr-sm px-5 py-3 shadow-md relative">
                        <p className="text-sm leading-relaxed">{chat.message}</p>
                        <div className="flex items-center justify-end mt-2 text-xs opacity-80">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimestamp(chat.created_at)}
                        </div>
                      </div>
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className="flex justify-start">
                    <div className="flex items-start space-x-3 max-w-[75%]">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-5 py-3 shadow-sm">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{chat.response}</p>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatTimestamp(chat.created_at)}
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-muted">
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-muted">
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-muted">
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing Indicator */}
            {(sending || isTyping) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-5 py-3 shadow-sm">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Message Input - Fixed at bottom */}
      <div className="border-t border-border bg-card/50 px-6 py-4 rounded-b-xl flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
          <div className="flex-1 bg-background rounded-2xl border border-border/50 focus-within:border-primary/50 transition-colors">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message Prakriti AI..."
              className="min-h-[52px] max-h-32 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm px-4 py-3"
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
            size="sm"
            className="rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-md h-[52px] w-[52px] p-0 flex-shrink-0"
          >
            {sending ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>
        
        <div className="flex items-center justify-center mt-3 text-xs text-muted-foreground">
          <Sparkles className="w-3 h-3 mr-1" />
          <span>AI can make mistakes. Check important info.</span>
        </div>
      </div>
    </div>
  );
};