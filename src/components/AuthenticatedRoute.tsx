
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useClerkAuth } from '@/hooks/useClerkAuth';
import { Loader2 } from 'lucide-react';

interface AuthenticatedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

const AuthenticatedRoute: React.FC<AuthenticatedRouteProps> = ({
  children,
  requireAuth = true,
  redirectTo = '/auth'
}) => {
  const { isAuthenticated, isLoading } = useClerkAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary mb-4" />
          <p className="text-gray-500">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // If auth is required but user is not authenticated, redirect to login
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // If auth is not required but user is authenticated, proceed
  return <>{children}</>;
};

export default AuthenticatedRoute;
