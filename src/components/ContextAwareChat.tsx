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
import { useProfile } from '@/hooks/useProfile';
import { useReports } from '@/hooks/useReports';
import { toast } from '@/hooks/use-toast';

export const ContextAwareChat = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
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

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getUserName = () => {
    return profile?.full_name || user?.email?.split('@')[0] || 'there';
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    const userMessage = message.trim();
    
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
    // Professional confirmation dialog
    if (!window.confirm(
      '⚠️ Clear Chat History?\n\n' +
      'This will permanently delete all your conversation history with Prakriti AI assistant. ' +
      'This action cannot be undone.\n\n' +
      'Are you sure you want to continue?'
    )) {
      return;
    }

    try {
      await clearChats();
      toast({
        title: "✓ Chat History Cleared",
        description: "All conversation history has been permanently deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear chat history. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportChat = () => {
    const chatText = chats.map(chat => 
      `USER: ${chat.message}\n\nPRAKRITI: ${chat.response}\n\n---\n\n`
    ).join('');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prakriti-chat-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Chat Exported",
      description: "Your conversation has been downloaded.",
    });
  };

  const contextAwarePrompts = reports.length > 0 ? [
    "How can I improve our ESG performance?",
    "What are the key sustainability risks?",
    "Suggest environmental action items",
    "Compare with industry benchmarks"
  ] : [
    "What are ESG best practices?",
    "How to reduce carbon footprint?",
    "Explain sustainability metrics",
    "Latest ESG compliance trends"
  ];

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {chats.length === 0 && !loading ? (
        /* Clean Welcome View */
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-3xl mx-auto text-center space-y-8"
          >
            {/* Prakriti Avatar */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative inline-block"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg mx-auto">
                <Bot className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-background" />
            </motion.div>

            {/* Personalized Greeting */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-2"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                {getTimeBasedGreeting()}, {getUserName()}
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground">
                What's on <span className="text-purple-600 dark:text-purple-400">your mind</span>?
              </p>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex items-center justify-center gap-3"
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full px-6"
                      onClick={() => setMessage("Tell me about ESG best practices")}
                    >
                      <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
                      Ask Prakriti
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Start a conversation with Prakriti</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {reports.length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full px-6"
                        onClick={() => setMessage("Analyze my latest ESG report")}
                      >
                        <FileText className="w-4 h-4 mr-2 text-emerald-600" />
                        Analyze Reports
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Get insights from your uploaded reports</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </motion.div>

            {/* Suggested Prompts */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground uppercase tracking-wide font-medium">
                {reports.length > 0 ? "Get Started with Examples Below" : "Try Asking Prakriti"}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {contextAwarePrompts.map((prompt, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                    onClick={() => setMessage(prompt)}
                    className="group relative p-4 text-left bg-card hover:bg-muted/50 rounded-xl border border-border hover:border-purple-500/30 transition-all duration-300 hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/20 transition-colors">
                        <HelpCircle className="w-4 h-4 text-purple-600" />
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{prompt}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      ) : (
        /* Chat View */
        <div className="flex-1 flex flex-col space-y-4">
          {/* Compact Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="gradient-card border-0 shadow-card">
              <CardHeader className="pb-3 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center space-x-2">
                        <span>Prakriti</span>
                        <Badge variant="outline" className="text-xs px-2 py-0.5">Powered by OpenAI</Badge>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Your ESG Assistant {reports.length > 0 && `• ${reports.length} reports analyzed`}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {chats.length > 0 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={handleExportChat}>
                              <Download className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Export conversation</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <Button variant="ghost" size="sm" onClick={handleClearChat}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </motion.div>

          {/* Chat Messages Area */}
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

                          {/* Prakriti Response */}
                          <div className="flex justify-start">
                            <div className="flex items-start space-x-3 max-w-[80%]">
                              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center flex-shrink-0">
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
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                          <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
        </div>
      )}

      {/* Message Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-4"
      >
        <Card className="gradient-card border-0 shadow-card">
          <CardContent className="p-4">
            <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
              <div className="flex-1">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={chats.length === 0 
                    ? "What's on your mind? Ask Prakriti anything..."
                    : "Continue your conversation with Prakriti..."}
                  className="min-h-[60px] max-h-32 resize-none border-0 focus-visible:ring-1 focus-visible:ring-purple-500"
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
                className="bg-gradient-to-br from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white shadow-lg"
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
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>Prakriti is online • Powered by OpenAI</span>
              </div>
              <div>
                Shift+Enter for new line
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};