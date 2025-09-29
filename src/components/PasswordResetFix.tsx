import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { Eye, EyeOff, Key, Leaf, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const PasswordResetFix = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkResetSession = async () => {
      try {
        // Check if we have the necessary parameters for password reset
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const type = searchParams.get('type');

        if (type === 'recovery' && accessToken && refreshToken) {
          // Set the session with the tokens from the URL
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('Error setting session:', error);
            setError('This password reset link is invalid or has expired. Please request a new one.');
            setTimeout(() => navigate('/'), 5000);
          } else {
            setIsValidSession(true);
            toast({
              title: "Reset link verified",
              description: "You can now set your new password.",
            });
          }
        } else {
          setError('Invalid or missing reset parameters. Please request a new password reset.');
          setTimeout(() => navigate('/'), 5000);
        }
      } catch (error: any) {
        console.error('Session check error:', error);
        setError('There was an error verifying your reset link. Please try again.');
        setTimeout(() => navigate('/'), 5000);
      } finally {
        setCheckingSession(false);
      }
    };

    checkResetSession();
  }, [searchParams, navigate]);

  const validatePassword = (pass: string) => {
    if (pass.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    if (!/(?=.*[a-z])/.test(pass)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(pass)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(pass)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate passwords
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match. Please make sure both passwords are identical.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      toast({
        title: "Password updated successfully! 🎉",
        description: "Your password has been changed. You can now sign in with your new password.",
      });

      // Sign out the user and redirect to login after a short delay
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate('/', { replace: true });
      }, 2000);
      
    } catch (error: any) {
      console.error('Password update error:', error);
      setError(error.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/', { replace: true });
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
        <Card className="w-full max-w-md gradient-card border-0 shadow-floating">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="relative mb-4">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center animate-pulse">
                <Leaf className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle className="w-4 h-4 text-yellow-800" />
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Verifying Reset Link</h3>
            <p className="text-muted-foreground text-center">Please wait while we verify your password reset link...</p>
            <LoadingSpinner className="mt-4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValidSession || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-full max-w-md gradient-card border-0 shadow-floating">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-950/20 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-xl">Reset Link Issue</CardTitle>
              <CardDescription className="text-base">
                {error || 'This password reset link is invalid or has expired.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please request a new password reset link from the login page.
                </AlertDescription>
              </Alert>
              <Button onClick={handleBackToLogin} className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const passwordStrength = password.length > 0 ? (
    validatePassword(password) === null ? 'Strong' : 
    password.length >= 6 ? 'Medium' : 'Weak'
  ) : '';

  const getPasswordStrengthColor = (strength: string) => {
    switch (strength) {
      case 'Strong': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      case 'Weak': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="gradient-card border-0 shadow-floating">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-gradient-primary flex items-center justify-center">
                  <Leaf className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <Key className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
            <CardTitle className="text-2xl">Set New Password</CardTitle>
            <CardDescription className="text-base">
              Create a strong password for your PrakritiLens account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {password && (
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-muted-foreground">Strength:</span>
                    <span className={getPasswordStrengthColor(passwordStrength)}>
                      {passwordStrength}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-sm text-red-600">Passwords don't match</p>
                )}
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Password Requirements:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className={password.length >= 6 ? 'text-green-600' : ''}>• At least 6 characters</li>
                  <li className={/(?=.*[a-z])/.test(password) ? 'text-green-600' : ''}>• One lowercase letter</li>
                  <li className={/(?=.*[A-Z])/.test(password) ? 'text-green-600' : ''}>• One uppercase letter</li>
                  <li className={/(?=.*\d)/.test(password) ? 'text-green-600' : ''}>• One number</li>
                </ul>
              </div>

              <Button 
                type="submit" 
                className="w-full gradient-primary shadow-elegant" 
                disabled={loading || !password || !confirmPassword || password !== confirmPassword}
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Updating Password...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Update Password
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Button
                variant="link"
                onClick={handleBackToLogin}
                className="text-sm text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PasswordResetFix;