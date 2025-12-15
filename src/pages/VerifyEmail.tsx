import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { CheckCircle2, XCircle, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

type VerificationStatus = 'verifying' | 'success' | 'error' | 'expired';

const VerifyEmail = () => {
  const [status, setStatus] = useState<VerificationStatus>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Supabase handles the token verification automatically when the page loads
        // Check if there's an error in the URL params
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (error) {
          if (errorDescription?.includes('expired')) {
            setStatus('expired');
            setErrorMessage('Your verification link has expired. Please request a new one.');
          } else {
            setStatus('error');
            setErrorMessage(errorDescription || 'Verification failed. Please try again.');
          }
          return;
        }

        // Check if we have a valid session after verification
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          setStatus('error');
          setErrorMessage(sessionError.message);
          return;
        }

        if (session?.user?.email_confirmed_at) {
          setStatus('success');
        } else {
          // Give Supabase a moment to process the verification
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          const { data: { session: refreshedSession } } = await supabase.auth.getSession();
          
          if (refreshedSession?.user?.email_confirmed_at) {
            setStatus('success');
          } else {
            setStatus('error');
            setErrorMessage('Unable to verify email. The link may be invalid or expired.');
          }
        }
      } catch (err) {
        console.error('Verification error:', err);
        setStatus('error');
        setErrorMessage('An unexpected error occurred during verification.');
      }
    };

    verifyEmail();
  }, [searchParams]);

  const handleGoToLogin = () => {
    navigate('/?auth=login');
  };

  const handleRequestNewLink = () => {
    navigate('/?auth=signup');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md border-border/50 bg-card/95 backdrop-blur-sm shadow-xl">
          <CardHeader className="text-center space-y-4">
            {status === 'verifying' && (
              <>
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <LoadingSpinner size="lg" />
                </div>
                <CardTitle className="text-2xl font-bold">Verifying Your Email</CardTitle>
                <CardDescription>Please wait while we verify your email address...</CardDescription>
              </>
            )}

            {status === 'success' && (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center"
                >
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </motion.div>
                <CardTitle className="text-2xl font-bold text-green-500">Email Verified Successfully!</CardTitle>
                <CardDescription>
                  Your email has been verified. You can now log in to your PrakritiLens account.
                </CardDescription>
              </>
            )}

            {status === 'error' && (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="mx-auto w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center"
                >
                  <XCircle className="w-10 h-10 text-destructive" />
                </motion.div>
                <CardTitle className="text-2xl font-bold text-destructive">Verification Failed</CardTitle>
                <CardDescription>{errorMessage}</CardDescription>
              </>
            )}

            {status === 'expired' && (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="mx-auto w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center"
                >
                  <Mail className="w-10 h-10 text-yellow-500" />
                </motion.div>
                <CardTitle className="text-2xl font-bold text-yellow-500">Link Expired</CardTitle>
                <CardDescription>{errorMessage}</CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {status === 'success' && (
              <Button onClick={handleGoToLogin} className="w-full" size="lg">
                Continue to Login
              </Button>
            )}

            {(status === 'error' || status === 'expired') && (
              <div className="space-y-3">
                <Button onClick={handleRequestNewLink} className="w-full" size="lg">
                  Request New Verification Link
                </Button>
                <Button onClick={handleGoToLogin} variant="outline" className="w-full">
                  Back to Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
