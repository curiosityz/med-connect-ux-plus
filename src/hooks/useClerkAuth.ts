
import { useAuth as useClerkBaseAuth, useSession } from '@clerk/clerk-react';

export const useClerkAuth = () => {
  // Always destructure the values to avoid potential issues with conditional hook usage
  const { userId, isLoaded } = useClerkBaseAuth();
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
    isAuthenticated: isLoaded && !!userId,
    getToken,
    isLoading: !isLoaded
  };
};
