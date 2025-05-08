import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
// You might want to add icons for Google and Facebook
// import { GoogleIcon, FacebookIcon } from '@/components/ui/icons'; // Placeholder

export const OAuthButtonGroup: React.FC = () => {
  const { signInWithOAuth, loading } = useAuth();

  const handleOAuthSignIn = async (provider: 'google' | 'facebook') => {
    await signInWithOAuth(provider);
    // Supabase handles the redirect and the useAuth hook will update the state
    // upon successful authentication and return to the app.
  };

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        onClick={() => handleOAuthSignIn('google')}
        disabled={loading}
        className="w-full"
      >
        {/* <GoogleIcon className="mr-2 h-4 w-4" /> */}
        Sign in with Google
      </Button>
      <Button
        variant="outline"
        onClick={() => handleOAuthSignIn('facebook')}
        disabled={loading}
        className="w-full"
      >
        {/* <FacebookIcon className="mr-2 h-4 w-4" /> */}
        Sign in with Facebook
      </Button>
    </div>
  );
};