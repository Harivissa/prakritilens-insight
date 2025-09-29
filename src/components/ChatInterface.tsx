import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Bot, 
  User, 
  Trash2, 
  MessageCircle, 
  Loader2,
  Sparkles,
  FileText,
  BarChart3,
  Shield
} from 'lucide-react';
import { useChats } from '@/hooks/useChats';
import { cn } from '@/lib/utils';

export const ChatInterface = () => {
  const { chats, loading, sending, sendMessage, clearChats } = useChats();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chats]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    const currentMessage = message;
    setMessage('');
    
    try {
      await sendMessage(currentMessage);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore message on error
      setMessage(currentMessage);
    }
  };

  const handleSampleQuestion = (question: string) => {
    setMessage(question);
  };

  const sampleQuestions = [
    "How can I improve my company's ESG score?",
    "What are the key environmental risks for my industry?",
    "Explain the social governance framework",
    "How do I calculate carbon footprint?",
    "What ESG metrics should I track?"
  ];

  const messageVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="h-[calc(100vh-2rem)] max-h-[800px] flex flex-col">
      {/* Header */}
      <Card className="flex-shrink-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-xl">ESG AI Assistant</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Get expert guidance on sustainability and ESG matters
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Powered
              </Badge>
              {chats.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearChats}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Chat Messages */}
      <Card className="flex-1 flex flex-col min-h-0 mt-4">
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4">
            {loading && chats.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading chat history...</span>
              </div>
            ) : chats.length === 0 ? (
              <div className="text-center py-8 space-y-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <MessageCircle className="w-8 h-8 text-primary" />
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Welcome to ESG AI Assistant</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    I'm here to help with ESG analysis, sustainability guidance, and answering your questions about environmental, social, and governance matters.
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium">Try asking me:</p>
                  <div className="grid gap-2 max-w-md mx-auto">
                    {sampleQuestions.map((question, index) => (
                      <motion.button
                        key={question}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="text-left p-3 rounded-lg bg-muted/50 hover:bg-muted text-sm transition-colors"
                        onClick={() => handleSampleQuestion(question)}
                      >
                        {question}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground pt-4">
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    <span>ESG Reports</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BarChart3 className="w-4 h-4" />
                    <span>Analytics</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="w-4 h-4" />
                    <span>Compliance</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {chats.map((chat) => (
                    <motion.div
                      key={chat.id}
                      variants={messageVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className="space-y-4"
                    >
                      {/* User Message */}
                      <div className="flex justify-end">
                        <div className="flex items-start gap-3 max-w-[80%]">
                          <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-md px-4 py-3">
                            <p className="text-sm">{chat.message}</p>
                          </div>
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                        </div>
                      </div>

                      {/* AI Response */}
                      <div className="flex justify-start">
                        <div className="flex items-start gap-3 max-w-[80%]">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4 text-primary-foreground" />
                          </div>
                          <div className="bg-muted rounded-2xl rounded-tl-md px-4 py-3">
                            <p className="text-sm whitespace-pre-wrap">{chat.response}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(chat.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Typing Indicator */}
                {sending && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <div className="bg-muted rounded-2xl rounded-tl-md px-4 py-3">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          <span className="text-xs text-muted-foreground ml-2">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 border-t bg-background">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask me anything about ESG, sustainability, or compliance..."
                className="flex-1"
                disabled={sending}
              />
              <Button 
                type="submit" 
                disabled={!message.trim() || sending}
                className={cn(
                  "gradient-primary",
                  sending && "opacity-50"
                )}
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
            
            <p className="text-xs text-muted-foreground mt-2 text-center">
              AI can make mistakes. Verify important information.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};