import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Mail } from 'lucide-react';

interface SignUpSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

export const SignUpSuccessModal = ({ isOpen, onClose, email }: SignUpSuccessModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <DialogTitle className="text-2xl">Account Created Successfully!</DialogTitle>
          <DialogDescription className="text-base pt-4">
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-left">
                <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground mb-1">
                    Check your email
                  </p>
                  <p className="text-sm text-muted-foreground">
                    We've sent a verification link to <span className="font-medium text-foreground">{email}</span>
                  </p>
                </div>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg text-left">
                <p className="text-sm text-foreground">
                  <strong>Next steps:</strong>
                </p>
                <ol className="text-sm text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
                  <li>Check your inbox (and spam folder)</li>
                  <li>Click the verification link in the email</li>
                  <li>Sign in to activate your account</li>
                </ol>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center mt-4">
          <Button onClick={onClose} className="w-full gradient-primary">
            Got it, thanks!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
