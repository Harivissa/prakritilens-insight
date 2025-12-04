import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  MessageCircle, Send, Trash2, FileText, Loader2, Sparkles, 
  Copy, Check, Info, Leaf, User 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  evidence?: { page: number; snippet: string }[];
  confidence?: number;
  timestamp?: Date;
}

interface ESGChatbotProps {
  reportId: string;
  companyName?: string;
}

const SUGGESTED_QUESTIONS = [
  "What are the key ESG risks identified in this report?",
  "How does this company perform on carbon emissions?",
  "What diversity and inclusion initiatives are mentioned?",
  "Summarize the governance structure and board composition",
  "What are the company's net-zero or sustainability targets?",
  "Are there any controversies or compliance issues mentioned?",
  "What is the company's approach to supply chain sustainability?",
  "How does water usage and waste management compare to industry standards?"
];

const TONE_OPTIONS = [
  { value: 'formal', label: 'Formal', description: 'Professional, suitable for executives' },
  { value: 'technical', label: 'Technical', description: 'Detailed, framework-specific terminology' },
  { value: 'beginner', label: 'Beginner-Friendly', description: 'Simple explanations, no jargon' }
];

export function ESGChatbot({ reportId, companyName }: ESGChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [tone, setTone] = useState<'formal' | 'technical' | 'beginner'>('formal');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load existing conversation if any
  useEffect(() => {
    const loadConversation = async () => {
      if (!reportId) return;
      
      const { data: conversations } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('report_id', reportId)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (conversations && conversations.length > 0) {
        const convId = conversations[0].id;
        setConversationId(convId);

        // Load messages
        const { data: existingMessages } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('conversation_id', convId)
          .order('created_at', { ascending: true });

        if (existingMessages) {
          setMessages(existingMessages.map(m => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            evidence: m.evidence as any,
            confidence: m.confidence || undefined,
            timestamp: new Date(m.created_at || '')
          })));
        }
      }
    };

    loadConversation();
  }, [reportId]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('rag-chat', {
        body: {
          message: input,
          conversationId,
          reportId,
          tone
        }
      });

      if (error) throw error;

      // Store conversation ID for future messages
      if (!conversationId && data.conversationId) {
        setConversationId(data.conversationId);
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
        evidence: data.evidence || [],
        confidence: data.confidence,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      console.error('Chat error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to get response',
        variant: 'destructive'
      });

      // Remove user message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (!conversationId) return;

    try {
      const { error } = await supabase
        .from('chat_conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;

      setMessages([]);
      setConversationId(null);
      
      toast({
        title: 'Conversation cleared',
        description: 'Chat history has been deleted'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete conversation',
        variant: 'destructive'
      });
    }
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className="h-[650px] flex flex-col shadow-elegant">
      <CardHeader className="border-b pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Leaf className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Prakriti AI Assistant</CardTitle>
              <p className="text-xs text-muted-foreground">Powered by OpenAI</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={tone} onValueChange={(v: any) => setTone(v)}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {conversationId && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleDeleteConversation}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Clear conversation</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        {companyName && (
          <Badge variant="outline" className="w-fit mt-2">
            Analyzing: {companyName}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="text-center py-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-medium mb-2">Ask me about this ESG report</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                I can help you understand sustainability performance, identify risks, 
                and extract key metrics from the uploaded report.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl mx-auto">
                {SUGGESTED_QUESTIONS.slice(0, 6).map((q, i) => (
                  <motion.button
                    key={i}
                    onClick={() => setInput(q)}
                    className="text-left text-sm p-3 rounded-lg border border-border hover:bg-accent hover:border-primary/30 transition-all"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    {q}
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Leaf className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[80%] rounded-xl p-4 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      
                      {/* Evidence Section */}
                      {message.evidence && message.evidence.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-border/30 space-y-2">
                          <div className="flex items-center gap-1 text-xs font-medium opacity-80">
                            <FileText className="h-3 w-3" />
                            Evidence from report
                          </div>
                          {message.evidence.slice(0, 3).map((ev, i) => (
                            <div key={i} className="text-xs bg-background/50 rounded-lg p-2">
                              <Badge variant="outline" className="mb-1 text-[10px]">Page {ev.page}</Badge>
                              <p className="text-muted-foreground line-clamp-2">{ev.snippet}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Confidence & Actions */}
                      {message.role === 'assistant' && (
                        <div className="mt-3 flex items-center justify-between">
                          {message.confidence && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="outline" className="text-[10px]">
                                    {message.confidence}% confident
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Confidence based on evidence found in the report
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleCopy(message.content, message.id)}
                          >
                            {copiedId === message.id ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>

                    {message.role === 'user' && (
                      <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Leaf className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-muted rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Analyzing report...</span>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t p-4 bg-card">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about ESG metrics, risks, opportunities..."
              disabled={isLoading}
              className="min-h-[44px] max-h-32 resize-none"
              rows={1}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-11 w-11 shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            Prakriti uses AI to analyze ESG reports. Verify important findings with the source document.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}