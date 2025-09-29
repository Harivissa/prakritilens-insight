import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChats } from '@/hooks/useChats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Bot, Send, Trash2, Lightbulb, MessageCircle, User } from 'lucide-react';
import { format } from 'date-fns';

const AIAssistant = () => {
  const { chats, loading, sending, sendMessage, clearChats } = useChats();
  const [message, setMessage] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sample questions to help users get started
  const sampleQuestions = [
    "What are the key components of ESG scoring?",
    "How can we reduce our carbon footprint?",
    "What are the latest sustainability reporting standards?",
    "How do I improve our governance practices?",
    "What social responsibility metrics should we track?"
  ];

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    const messageToSend = message.trim();
    setMessage('');
    
    try {
      await sendMessage(messageToSend);
      // Scroll to bottom after sending
      setTimeout(() => {
        if (scrollAreaRef.current) {
          const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
          }
        }
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSampleQuestion = (question: string) => {
    setMessage(question);
    inputRef.current?.focus();
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current && chats.length > 0) {
      setTimeout(() => {
        const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }, 100);
    }
  }, [chats]);

  const messageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">PrakritiLens AI Assistant</CardTitle>
                  <CardDescription>
                    Get expert guidance on ESG and sustainability practices
                  </CardDescription>
                </div>
              </div>
              {chats.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearChats}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear History
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Chat Area */}
      <motion.div
        className="flex-1 flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="flex-1 flex flex-col">
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner className="mr-2" />
                  <span>Loading chat history...</span>
                </div>
              ) : chats.length === 0 ? (
                <div className="text-center py-8 space-y-6">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <MessageCircle className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
                    <p className="text-muted-foreground mb-6">
                      Ask me anything about ESG, sustainability, or environmental compliance.
                    </p>
                  </div>
                  
                  {/* Sample Questions */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-sm font-medium text-muted-foreground">
                      <Lightbulb className="h-4 w-4" />
                      <span>Try asking:</span>
                    </div>
                    <div className="grid gap-2">
                      {sampleQuestions.map((question, index) => (
                        <motion.button
                          key={index}
                          className="text-left p-3 rounded-lg border border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                          onClick={() => handleSampleQuestion(question)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span className="text-sm text-muted-foreground">{question}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <AnimatePresence>
                    {chats.map((chat, index) => (
                      <motion.div
                        key={chat.id}
                        variants={messageVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="space-y-4"
                      >
                        {/* User Message */}
                        <div className="flex items-start space-x-3">
                          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <Badge variant="secondary" className="text-xs">You</Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(chat.created_at), 'MMM dd, HH:mm')}
                              </span>
                            </div>
                            <div className="bg-secondary/50 rounded-lg p-3">
                              <p className="text-sm">{chat.message}</p>
                            </div>
                          </div>
                        </div>

                        {/* AI Response */}
                        <div className="flex items-start space-x-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <Badge variant="default" className="text-xs">PrakritiLens AI</Badge>
                            </div>
                            <div className="bg-muted rounded-lg p-3">
                              <p className="text-sm whitespace-pre-wrap">{chat.response}</p>
                            </div>
                          </div>
                        </div>
                        
                        {index < chats.length - 1 && <Separator />}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Typing indicator when sending */}
                  {sending && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start space-x-3"
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant="default" className="text-xs">PrakritiLens AI</Badge>
                        </div>
                        <div className="bg-muted rounded-lg p-3">
                          <div className="flex items-center space-x-1">
                            <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            <span className="text-xs text-muted-foreground ml-2">Thinking...</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input Form */}
            <div className="border-t p-6">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <Input
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask about ESG practices, sustainability metrics, compliance..."
                  disabled={sending}
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  disabled={!message.trim() || sending}
                  size="icon"
                >
                  {sending ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AIAssistant;