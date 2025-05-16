
import { useAuth as useClerkBaseAuth, useSession } from '@clerk/clerk-react';

export const useClerkAuth = () => {
  const clerkAuth = useClerkBaseAuth(); // Renamed from useAuth to avoid recursion
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
    isAuthenticated: clerkAuth.isLoaded && !!clerkAuth.userId,
    getToken,
    isLoading: !clerkAuth.isLoaded
  };
};
