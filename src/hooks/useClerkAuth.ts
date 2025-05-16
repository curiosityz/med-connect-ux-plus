
import { useAuth as useClerkBaseAuth, useSession } from '@clerk/clerk-react';

export const useClerkAuth = () => {
  // Use the renamed import to avoid recursion
  const clerkBaseAuth = useClerkBaseAuth();
  const { session } = useSession();
  
  const getToken = async () => {
    if (session) {
      try {
        return await session.getToken();
      } catch (error) {
        console.error('Error getting session token:', error);
        return null;
      }
    }
    return null;
  };

  return {
    isAuthenticated: clerkBaseAuth.isLoaded && !!clerkBaseAuth.userId,
    getToken,
    isLoading: !clerkBaseAuth.isLoaded
  };
};
