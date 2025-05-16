
import { useAuth, useSession } from '@clerk/clerk-react';

export const useClerkAuth = () => {
  const clerkAuth = useAuth();
  const { session } = useSession();
  
  return {
    isAuthenticated: clerkAuth.isLoaded && !!clerkAuth.userId,
    token: session?.getToken() || null,
    isLoading: !clerkAuth.isLoaded
  };
};
