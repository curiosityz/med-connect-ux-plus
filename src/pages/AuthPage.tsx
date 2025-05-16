
import React from 'react';
import { 
  SignIn, 
  SignUp, 
  useUser,
} from '@clerk/clerk-react';
import { Navigate, useLocation } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DirectionProvider } from '@radix-ui/react-direction';
import MainNavigation from '@/components/MainNavigation';
import Footer from '@/components/Footer';

export const AuthPage: React.FC = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const location = useLocation();
  const [activeTab, setActiveTab] = React.useState<'sign-in' | 'sign-up'>(
    location.hash === '#sign-up' ? 'sign-up' : 'sign-in'
  );

  // Show loading state while Clerk is loading
  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // If the user is already signed in, redirect to home or dashboard
  if (isSignedIn) {
    return <Navigate to="/" replace />;
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'sign-in' | 'sign-up');
    // Update the hash for better UX (back button behavior)
    window.location.hash = value === 'sign-up' ? '#sign-up' : '';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <MainNavigation />
      <div className="flex-grow flex justify-center items-center bg-gray-100 dark:bg-gray-900 p-4">
        <DirectionProvider dir="ltr">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome</CardTitle>
              <CardDescription>Sign in or create an account to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="sign-in">Sign In</TabsTrigger>
                  <TabsTrigger value="sign-up">Sign Up</TabsTrigger>
                </TabsList>
                <TabsContent value="sign-in">
                  <SignIn 
                    signUpUrl="/auth#sign-up"
                    redirectUrl="/"
                  />
                </TabsContent>
                <TabsContent value="sign-up">
                  <SignUp 
                    signInUrl="/auth"
                    redirectUrl="/"
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </DirectionProvider>
      </div>
      <Footer />
    </div>
  );
};

export default AuthPage;
