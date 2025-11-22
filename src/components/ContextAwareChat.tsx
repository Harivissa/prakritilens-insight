import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  const { chats, sending, sendMessage, clearChats } = useChats();
  const { reports } = useReports();
  const [message, setMessage] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats]);

  const getUserName = () => {
    return profile?.full_name || user?.email?.split('@')[0] || 'there';
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    const userMessage = message.trim();
    setMessage('');

    try {
      await sendMessage(userMessage);
    } catch (error) {
      console.error('Send error:', error);
    }
  };

  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Empty state */}
      {chats.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-2xl">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Hello, {getUserName()}!</h2>
            <p className="text-muted-foreground mb-6">How can I assist you with your ESG needs today?</p>
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              <button onClick={() => setMessage("What are ESG best practices?")} className="p-4 text-left bg-muted/30 hover:bg-muted/50 rounded-xl border border-border">
                <HelpCircle className="w-4 h-4 text-primary mb-2" />
                <p className="text-sm">ESG Best Practices</p>
              </button>
              <button onClick={() => setMessage("Analyze my reports")} className="p-4 text-left bg-muted/30 hover:bg-muted/50 rounded-xl border border-border">
                <FileText className="w-4 h-4 text-primary mb-2" />
                <p className="text-sm">Analyze Reports</p>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Chat messages */
        <>
          {/* Messages area - scrollable */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-6 space-y-6">
              {chats.map((chat, index) => (
                <div key={chat.id} className="space-y-4">
                  {/* User message */}
                  <div className="flex justify-end">
                    <div className="flex items-start space-x-3 max-w-[80%]">
                      <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3">
                        <p className="text-sm">{chat.message}</p>
                        <div className="flex items-center justify-end mt-2 text-xs opacity-70">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimestamp(chat.created_at)}
                        </div>
                      </div>
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                  </div>

                  {/* AI response */}
                  {chat.response && (
                    <div className="flex justify-start">
                      <div className="flex items-start space-x-3 max-w-[80%]">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{chat.response}</p>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatTimestamp(chat.created_at)}
                            </div>
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
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator */}
              {sending && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Header with actions - at top of messages */}
          {chats.length > 0 && (
            <div className="border-t border-border bg-background/95 backdrop-blur-sm px-6 py-2">
              <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs text-muted-foreground">Prakriti AI</span>
                </div>
                <Button variant="ghost" size="sm" onClick={clearChats}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Input area - fixed at bottom */}
      <div className="border-t border-border bg-background">
        <div className="max-w-4xl mx-auto p-4">
          <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message Prakriti AI..."
              className="min-h-[60px] max-h-32 resize-none bg-muted/30 border-border focus-visible:ring-1 focus-visible:ring-purple-500 rounded-2xl"
              disabled={sending}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <Button 
              type="submit" 
              disabled={!message.trim() || sending}
              size="icon"
              className="rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white shadow-lg h-[60px] w-[60px]"
            >
              {sending ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </form>
          
          <div className="flex items-center justify-center mt-2 text-xs text-muted-foreground">
            <Sparkles className="w-3 h-3 mr-1" />
            <span>AI can make mistakes. Check important info.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
