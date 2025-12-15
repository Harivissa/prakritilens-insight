import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, RefreshCw, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface EmailVerificationPendingProps {
  email: string;
  onBack: () => void;
}

export const EmailVerificationPending = ({ email, onBack }: EmailVerificationPendingProps) => {
  const [isResending, setIsResending] = useState(false);
  const [lastResent, setLastResent] = useState<Date | null>(null);

  const canResend = !lastResent || (Date.now() - lastResent.getTime()) > 60000; // 1 minute cooldown

  const handleResendVerification = async () => {
    if (!canResend) {
      const secondsLeft = Math.ceil((60000 - (Date.now() - (lastResent?.getTime() || 0))) / 1000);
      toast({
        title: "Please wait",
        description: `You can resend in ${secondsLeft} seconds.`,
        variant: "destructive",
      });
      return;
    }

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setLastResent(new Date());
        toast({
          title: "Email Sent",
          description: "A new verification email has been sent to your inbox.",
        });
      }
    } catch (error) {
      console.error('Resend error:', error);
      toast({
        title: "Error",
        description: "Failed to resend verification email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const remainingSeconds = lastResent 
    ? Math.max(0, Math.ceil((60000 - (Date.now() - lastResent.getTime())) / 1000))
    : 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md border-border/50 bg-card/95 backdrop-blur-sm shadow-xl">
          <CardHeader className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center"
            >
              <Mail className="w-10 h-10 text-primary" />
            </motion.div>
            <CardTitle className="text-2xl font-bold">Verification Email Sent</CardTitle>
            <CardDescription className="text-base">
              We've sent a verification link to:
            </CardDescription>
            <p className="font-semibold text-foreground bg-muted px-4 py-2 rounded-lg">
              {email}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-sm">What to do next:</h4>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Check your email inbox</li>
                <li>Click the verification link in the email</li>
                <li>Return here to log in</li>
              </ol>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                <strong>Can't find the email?</strong> Check your Spam or Promotions folder.
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleResendVerification} 
                disabled={isResending || !canResend}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isResending ? 'animate-spin' : ''}`} />
                {isResending 
                  ? "Sending..." 
                  : !canResend 
                    ? `Resend in ${remainingSeconds}s` 
                    : "Resend Verification Email"
                }
              </Button>

              <Button onClick={onBack} variant="ghost" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </Button>
            </div>

            <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border">
              Need help? Contact{' '}
              <a href="mailto:support@prakritilens.com" className="text-primary hover:underline">
                support@prakritilens.com
              </a>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
