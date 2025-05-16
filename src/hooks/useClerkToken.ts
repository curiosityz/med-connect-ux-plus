
import { useSession } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';

export const useClerkToken = () => {
  const [token, setToken] = useState<string | null>(null);
  const { session, isLoaded } = useSession();

  useEffect(() => {
    const fetchToken = async () => {
      if (isLoaded && session) {
        try {
          const sessionToken = await session.getToken();
          setToken(sessionToken);
        } catch (error) {
          console.error('Error getting session token:', error);
          setToken(null);
        }
      } else {
        setToken(null);
      }
    };

    fetchToken();
  }, [session, isLoaded]);

  return { token, isLoaded, hasSession: !!session };
};
