
import React, { useEffect, useState } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import MainNavigation from '@/components/MainNavigation';
import Footer from '@/components/Footer';
import { toast } from "sonner";

const VerifyEmailPage: React.FC = () => {
  const [verificationState, setVerificationState] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useUser();
  const clerk = useClerk();

  useEffect(() => {
    const verifyToken = async () => {
      try {
        // Get token from URL parameters
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        
        // Handle missing token case
        if (!token) {
          setErrorMessage('Verification token is missing.');
          setVerificationState('error');
          toast.error('Verification failed: Token is missing');
          return;
        }

        // Use clerk instance to verify the token
        if (clerk && isLoaded) {
          console.log('Attempting to verify email with token');
          
          // Use the correct Clerk API method for email verification
          await clerk.client.verifyEmailAddress({ token });
          
          setVerificationState('success');
          toast.success('Email successfully verified!');
          
          // Redirect to home page after successful verification after a delay
          setTimeout(() => {
            navigate('/');
          }, 3000);
        } else {
          throw new Error('Clerk client is not available');
        }
      } catch (error: any) {
        console.error('Email verification error:', error);
        setErrorMessage(error.message || 'Failed to verify email.');
        setVerificationState('error');
        toast.error(`Verification failed: ${error.message || 'Unknown error'}`);
      }
    };

    if (isLoaded) {
      verifyToken();
    }
  }, [isLoaded, location.search, navigate, clerk]);

  return (
    <div className="min-h-screen flex flex-col">
      <MainNavigation />
      
      <main className="flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Email Verification
            </CardTitle>
            <CardDescription className="text-center">
              {verificationState === 'loading' && 'Verifying your email address...'}
              {verificationState === 'success' && 'Your email has been verified!'}
              {verificationState === 'error' && 'Verification failed'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex flex-col items-center">
            {verificationState === 'loading' && (
              <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
            )}
            
            {verificationState === 'success' && (
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            )}
            
            {verificationState === 'error' && (
              <>
                <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
                <p className="text-red-500 text-center">{errorMessage}</p>
              </>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-center">
            {verificationState === 'success' && (
              <p className="text-center text-sm text-muted-foreground">
                Redirecting you to the home page...
              </p>
            )}
            
            {verificationState === 'error' && (
              <div className="flex flex-col items-center gap-2">
                <Button asChild>
                  <Link to="/auth">Return to Sign In</Link>
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Need help? <a href="mailto:support@example.com" className="text-primary hover:underline">Contact Support</a>
                </p>
              </div>
            )}
          </CardFooter>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
};

export default VerifyEmailPage;
