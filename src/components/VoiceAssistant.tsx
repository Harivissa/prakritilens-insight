import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { supabase } from '@/integrations/supabase/client';

export const VoiceAssistant = () => {
  const { toast } = useToast();
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const chatRef = useRef<RealtimeChat | null>(null);

  const handleMessage = (event: any) => {
    console.log('Voice event:', event);
    
    if (event.type === 'response.audio.delta') {
      setIsSpeaking(true);
    } else if (event.type === 'response.audio.done') {
      setIsSpeaking(false);
    } else if (event.type === 'error') {
      toast({
        title: "Voice Error",
        description: event.error?.message || 'An error occurred',
        variant: "destructive",
      });
    }
  };

  const getEphemeralToken = async (): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('realtime-session');
    
    if (error) throw error;
    if (!data?.client_secret?.value) {
      throw new Error('Failed to get ephemeral token');
    }
    
    return data.client_secret.value;
  };

  const startVoiceChat = async () => {
    try {
      setIsConnecting(true);
      
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      chatRef.current = new RealtimeChat(handleMessage, getEphemeralToken);
      await chatRef.current.init();
      
      setIsActive(true);
      setIsConnecting(false);
      
      toast({
        title: "Voice Assistant Active",
        description: "Start speaking to interact with Prakriti",
      });
    } catch (error) {
      console.error('Error starting voice chat:', error);
      setIsConnecting(false);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : 'Failed to start voice assistant',
        variant: "destructive",
      });
    }
  };

  const stopVoiceChat = () => {
    chatRef.current?.disconnect();
    chatRef.current = null;
    setIsActive(false);
    setIsSpeaking(false);
    
    toast({
      title: "Voice Assistant Stopped",
      description: "Session ended",
    });
  };

  useEffect(() => {
    return () => {
      chatRef.current?.disconnect();
    };
  }, []);

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="fixed bottom-24 right-8 z-50"
    >
      <div className="relative">
        {/* Pulse animation when speaking */}
        <AnimatePresence>
          {isSpeaking && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.2, 1] }}
              exit={{ opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute inset-0 bg-primary rounded-full blur-xl"
            />
          )}
        </AnimatePresence>

        {/* Main button */}
        <Button
          onClick={isActive ? stopVoiceChat : startVoiceChat}
          disabled={isConnecting}
          size="lg"
          className={`
            relative h-16 w-16 rounded-full shadow-elegant
            ${isActive 
              ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' 
              : 'bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70'
            }
            transition-all duration-300
          `}
        >
          {isConnecting ? (
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          ) : isActive ? (
            <MicOff className="h-8 w-8 text-white" />
          ) : (
            <Mic className="h-8 w-8 text-white" />
          )}
        </Button>

        {/* Status indicator */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap"
            >
              <div className="bg-background/95 backdrop-blur-sm border border-border rounded-full px-4 py-2 shadow-lg">
                <p className="text-xs font-medium text-foreground">
                  {isSpeaking ? (
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      Prakriti is speaking...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Listening...
                    </span>
                  )}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
