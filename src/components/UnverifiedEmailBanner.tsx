import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Mail, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UnverifiedEmailBannerProps {
  email: string;
}

export const UnverifiedEmailBanner = ({ email }: UnverifiedEmailBannerProps) => {
  const [isResending, setIsResending] = useState(false);
  const [lastResent, setLastResent] = useState<Date | null>(null);

  const canResend = !lastResent || (Date.now() - lastResent.getTime()) > 60000;

  const handleResendVerification = async () => {
    if (!canResend) {
      const secondsLeft = Math.ceil((60000 - (Date.now() - (lastResent?.getTime() || 0))) / 1000);
      toast({
        title: "Please wait",
        description: `You can resend in ${secondsLeft} seconds.`,
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
          title: "Verification Email Sent",
          description: "Please check your inbox for the verification link.",
        });
      }
    } catch (error) {
      console.error('Resend error:', error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Alert className="bg-yellow-500/10 border-yellow-500/30 mb-4">
      <AlertTriangle className="h-4 w-4 text-yellow-500" />
      <AlertDescription className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
          <Mail className="h-4 w-4 hidden sm:block" />
          <span className="text-sm">
            Your email is not verified. Please verify to access all features.
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResendVerification}
          disabled={isResending || !canResend}
          className="border-yellow-500/30 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/10"
        >
          <RefreshCw className={`w-3 h-3 mr-1 ${isResending ? 'animate-spin' : ''}`} />
          {isResending ? "Sending..." : "Resend Email"}
        </Button>
      </AlertDescription>
    </Alert>
  );
};
