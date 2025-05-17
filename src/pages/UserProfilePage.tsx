
import React from 'react';
import { useClerkAuth } from '@/hooks/useClerkAuth';
import MainNavigation from '@/components/MainNavigation';
import Footer from '@/components/Footer';
import { ProfileEdit } from '@/components/UserProfile/ProfileEdit';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const UserProfilePage: React.FC = () => {
  const { user, isLoading } = useClerkAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <MainNavigation />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading profile...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <MainNavigation />
      <main className="flex-grow container mx-auto px-4 py-8">
        <SignedIn>
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Your Profile</h1>
            
            <Tabs defaultValue="profile" className="mb-8">
              <TabsList className="mb-4">
                <TabsTrigger value="profile">Profile Info</TabsTrigger>
                <TabsTrigger value="locations">Locations</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
                  <div className="bg-card p-6 rounded-lg border">
                    {user && (
                      <div className="space-y-4">
                        <p><strong>Name:</strong> {user.fullName || 'Not set'}</p>
                        <p><strong>Email:</strong> {user.primaryEmailAddress?.emailAddress}</p>
                        <div className="pt-4">
                          <Button 
                            onClick={() => window.open('https://accounts.medconnect.app/user', '_blank')}
                            variant="outline"
                          >
                            Edit Profile in Clerk
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="locations">
                <div className="space-y-6">
                  <ProfileEdit />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </SignedIn>
        <SignedOut>
          <RedirectToSignIn />
        </SignedOut>
      </main>
      <Footer />
    </div>
  );
};

export default UserProfilePage;
