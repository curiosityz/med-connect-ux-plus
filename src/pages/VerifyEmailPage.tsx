
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useClerk } from '@clerk/clerk-react';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import MainNavigation from '@/components/MainNavigation';
import Footer from '@/components/Footer';
import { useToast } from '@/components/ui/use-toast';

const VerifyEmailPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { client } = useClerk();
  const [searchParams] = useSearchParams();
  const [verificationStatus, setVerificationStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const token = searchParams.get('token');

  React.useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        toast({
          title: "Missing verification token",
          description: "No verification token found in the URL.",
          variant: "destructive"
        });
        setVerificationStatus('error');
        return;
      }

      try {
        setVerificationStatus('loading');
        
        // Use the verification API with the correct structure
        await client.verifyToken(token);
        
        setVerificationStatus('success');
        toast({
          title: "Email verified",
          description: "Your email has been successfully verified.",
        });
        // Redirect after a short delay to show success state
        setTimeout(() => navigate('/auth'), 2000);
      } catch (error) {
        console.error("Email verification error:", error);
        setVerificationStatus('error');
        toast({
          title: "Verification failed",
          description: "Could not verify your email address. The link may have expired.",
          variant: "destructive"
        });
      }
    };

    verifyEmail();
  }, [token, client, navigate, toast]);

  return (
    <div className="min-h-screen flex flex-col">
      <MainNavigation />
      <div className="flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Email Verification</CardTitle>
            <CardDescription>
              {verificationStatus === 'idle' && "We're verifying your email address"}
              {verificationStatus === 'loading' && "Verifying your email address..."}
              {verificationStatus === 'success' && "Email verified successfully!"}
              {verificationStatus === 'error' && "There was a problem verifying your email"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-6">
            <div className="h-20 w-20 flex items-center justify-center rounded-full bg-primary/10">
              {verificationStatus === 'idle' || verificationStatus === 'loading' ? (
                <Mail className="h-10 w-10 text-primary animate-pulse" />
              ) : verificationStatus === 'success' ? (
                <CheckCircle className="h-10 w-10 text-green-500" />
              ) : (
                <AlertCircle className="h-10 w-10 text-red-500" />
              )}
            </div>

            {verificationStatus === 'idle' && (
              <p className="text-center text-muted-foreground">
                Please wait while we verify your email address.
              </p>
            )}
            
            {verificationStatus === 'loading' && (
              <p className="text-center text-muted-foreground">
                This should only take a moment...
              </p>
            )}
            
            {verificationStatus === 'success' && (
              <p className="text-center text-muted-foreground">
                Your email has been verified. You will be redirected to the login page shortly.
              </p>
            )}
            
            {verificationStatus === 'error' && (
              <div className="space-y-4 w-full">
                <p className="text-center text-muted-foreground">
                  The verification link may have expired or is invalid.
                </p>
                <p className="text-center text-muted-foreground text-sm">
                  To continue, open the verification link on the device and browser from which you initiated the sign-in.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => navigate('/auth')}
                >
                  Return to Sign In
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default VerifyEmailPage;
