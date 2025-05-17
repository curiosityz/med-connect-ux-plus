
import { useAuth as useClerkBaseAuth, useSession } from '@clerk/clerk-react';

export const useClerkAuth = () => {
  const { userId, isLoaded, isSignedIn } = useClerkBaseAuth();
  const { session } = useSession();
  
  const getToken = async () => {
    if (session) {
      try {
        const token = await session.getToken();
        return token;
      } catch (error) {
        console.error('Error getting session token:', error);
        return null;
      }
    }
    return null;
  };

  return {
    userId,
    isAuthenticated: isLoaded && !!userId && isSignedIn,
    getToken,
    isLoading: !isLoaded
  };
};
