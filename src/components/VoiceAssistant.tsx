import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, Sparkles } from 'lucide-react';
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
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="fixed bottom-24 right-8 z-50"
    >
      <div className="relative">
        {/* Animated gradient glow background */}
        <motion.div
          animate={{
            scale: isActive ? [1, 1.1, 1] : 1,
            opacity: isActive ? [0.5, 0.8, 0.5] : 0.3,
          }}
          transition={{
            duration: 2,
            repeat: isActive ? Infinity : 0,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-full blur-2xl"
        />

        {/* Speaking pulse rings */}
        <AnimatePresence>
          {isSpeaking && (
            <>
              <motion.div
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 1.8, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 border-4 border-primary rounded-full"
              />
              <motion.div
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                className="absolute inset-0 border-4 border-purple-500 rounded-full"
              />
            </>
          )}
        </AnimatePresence>

        {/* Main gradient button */}
        <Button
          onClick={isActive ? stopVoiceChat : startVoiceChat}
          disabled={isConnecting}
          size="lg"
          className={`
            relative h-20 w-20 rounded-full shadow-2xl overflow-hidden
            transition-all duration-500 ease-out
            ${isActive 
              ? 'bg-gradient-to-br from-red-500 via-red-600 to-rose-700' 
              : 'bg-gradient-to-br from-primary via-purple-600 to-pink-600'
            }
            hover:scale-110 active:scale-95
            border-2 border-white/20
          `}
        >
          {/* Shimmer effect */}
          <motion.div
            animate={{
              x: ['-200%', '200%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          />

          {/* Icon */}
          <div className="relative z-10">
            {isConnecting ? (
              <Loader2 className="h-10 w-10 animate-spin text-white drop-shadow-lg" />
            ) : isActive ? (
              <motion.div
                animate={{ rotate: isSpeaking ? [0, -10, 10, -10, 0] : 0 }}
                transition={{ duration: 0.5, repeat: isSpeaking ? Infinity : 0 }}
              >
                <MicOff className="h-10 w-10 text-white drop-shadow-lg" />
              </motion.div>
            ) : (
              <Mic className="h-10 w-10 text-white drop-shadow-lg" />
            )}
          </div>

          {/* Sparkle particles */}
          {isActive && !isConnecting && (
            <>
              <motion.div
                animate={{
                  y: [-20, -40],
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: 0
                }}
                className="absolute top-2 right-2"
              >
                <Sparkles className="h-4 w-4 text-yellow-300" />
              </motion.div>
              <motion.div
                animate={{
                  y: [-20, -40],
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: 0.5
                }}
                className="absolute top-2 left-2"
              >
                <Sparkles className="h-3 w-3 text-blue-300" />
              </motion.div>
            </>
          )}
        </Button>

        {/* Status indicator with gradient */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap"
            >
              <div className="relative bg-gradient-to-r from-background/95 via-background/98 to-background/95 backdrop-blur-xl border border-primary/20 rounded-2xl px-5 py-2.5 shadow-2xl">
                {/* Glow effect on status */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 rounded-2xl" />
                
                <p className="relative text-sm font-semibold text-foreground flex items-center gap-2">
                  {isSpeaking ? (
                    <>
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="w-2.5 h-2.5 bg-gradient-to-r from-primary to-purple-500 rounded-full shadow-lg shadow-primary/50"
                      />
                      <span className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Prakriti is speaking...
                      </span>
                    </>
                  ) : (
                    <>
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-2.5 h-2.5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-lg shadow-green-500/50"
                      />
                      <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        Listening...
                      </span>
                    </>
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
