import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Send, Bot, User, Sparkles, RefreshCw, Copy, FileText,
  TrendingUp, HelpCircle, Clock, Download, Trash2, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChats } from '@/hooks/useChats';
import { useAuth } from '@/hooks/useAuth';
import { useReports } from '@/hooks/useReports';
import { toast } from '@/hooks/use-toast';

export const ContextAwareChat = () => {
  const { user } = useAuth();
  const { chats, loading, sending, sendMessage, clearChats } = useChats();
  const { reports } = useReports();
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
    
    // Add context from uploaded reports
    const contextMessage = reports.length > 0 
      ? `${userMessage}\n\n[Context: User has uploaded ${reports.length} ESG reports. Latest: ${reports[0]?.company_name || 'Unknown'} with score ${reports[0]?.score?.toFixed(1) || 'N/A'}]`
      : userMessage;

    setMessage('');
    setIsTyping(true);

    try {
      await sendMessage(contextMessage);
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

  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "Copied",
      description: "Message copied to clipboard",
    });
  };

  const handleClearChat = async () => {
    try {
      await clearChats();
      toast({
        title: "Chat Cleared",
        description: "All chat history has been deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear chat. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportChat = () => {
    const chatText = chats.map(chat => 
      `USER: ${chat.message}\n\nAI: ${chat.response}\n\n---\n\n`
    ).join('');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prakritilens-chat-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Chat Exported",
      description: "Your conversation has been downloaded.",
    });
  };

  const contextAwarePrompts = reports.length > 0 ? [
    `How can I improve the ESG score for ${reports[0]?.company_name || 'my company'}?`,
    "What are the key risks identified in my latest report?",
    "Suggest action items to improve our environmental score",
    "Compare my ESG performance with industry benchmarks",
    "What opportunities should we prioritize based on our data?",
    "Create a summary of all my uploaded reports"
  ] : [
    "What are the key ESG trends for 2024?",
    "How can PrakritiLens help improve sustainability reporting?",
    "Explain ESG scoring methodology",
    "What metrics matter most to ESG investors?",
    "How to prepare for ESG compliance requirements?",
    "Best practices for carbon footprint reduction"
  ];

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col space-y-4">
      {/* Header with Context Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="gradient-card border-0 shadow-card">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <span>PrakritiLens AI Assistant</span>
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Powered by Google Gemini
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {reports.length > 0 
                      ? `Context-aware • ${reports.length} reports uploaded • Latest: ${reports[0]?.company_name || 'N/A'}`
                      : "Ask me anything about ESG, sustainability, and climate action"}
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {chats.length > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={handleExportChat}>
                          <Download className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Export conversation</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <Button variant="outline" size="sm" onClick={handleClearChat}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear
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
                {/* Welcome Message */}
                {chats.length === 0 && !loading && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-center py-8"
                  >
                    <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bot className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Welcome to PrakritiLens AI</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      {reports.length > 0 
                        ? `I've analyzed your ${reports.length} uploaded reports and I'm ready to provide context-aware insights about your ESG performance.`
                        : "I'm your intelligent ESG assistant. Upload reports to get personalized insights, or ask me general questions about sustainability."}
                    </p>
                    
                    {/* Context-Aware Sample Questions */}
                    <div className="grid gap-2 max-w-2xl mx-auto">
                      <h4 className="text-sm font-medium text-muted-foreground mb-3">
                        {reports.length > 0 ? "Ask me about your reports:" : "Try asking:"}
                      </h4>
                      <div className="grid md:grid-cols-2 gap-2">
                        {contextAwarePrompts.map((question, index) => (
                          <motion.button
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            onClick={() => setMessage(question)}
                            className="p-3 text-sm text-left bg-muted/50 hover:bg-muted rounded-lg transition-smooth border border-border hover:border-primary/20"
                          >
                            <HelpCircle className="w-4 h-4 text-primary mr-2 inline" />
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
                          <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3">
                            <p className="text-sm">{chat.message.split('[Context:')[0].trim()}</p>
                            <div className="flex items-center justify-end mt-2 text-xs opacity-70">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatTimestamp(chat.created_at)}
                            </div>
                          </div>
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                        </div>
                      </div>

                      {/* AI Response */}
                      <div className="flex justify-start">
                        <div className="flex items-start space-x-3 max-w-[80%]">
                          <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                          <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{chat.response}</p>
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatTimestamp(chat.created_at)}
                              </div>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-6 w-6 p-0"
                                      onClick={() => handleCopyMessage(chat.response, chat.id)}
                                    >
                                      {copiedId === chat.id ? (
                                        <CheckCircle className="w-3 h-3 text-green-600" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {copiedId === chat.id ? 'Copied!' : 'Copy message'}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
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
                      <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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

      {/* Message Input */}
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
                  placeholder={reports.length > 0 
                    ? "Ask about your uploaded reports, request specific insights, or get improvement suggestions..."
                    : "Ask me anything about ESG, sustainability, climate action, or upload reports for personalized insights..."}
                  className="min-h-[60px] max-h-32 resize-none border-0 focus-visible:ring-1 focus-visible:ring-primary"
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
                className="shadow-elegant"
              >
                {sending ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
            
            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-3 h-3" />
                <span>Powered by Google Gemini • {reports.length > 0 ? 'Context-aware mode active' : 'Upload reports for personalized insights'}</span>
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