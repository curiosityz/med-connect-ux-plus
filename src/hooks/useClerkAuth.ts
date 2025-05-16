
import { useAuth as useClerkAuth, useSession } from '@clerk/clerk-react';

export const useClerkAuth = () => {
  const { isLoaded, userId } = useClerkAuth();
  const { session } = useSession();
  
  return {
    isAuthenticated: isLoaded && !!userId,
    token: session?.getToken() || null,
    isLoading: !isLoaded
  };
};
