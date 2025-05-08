import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthTabs } from '@/components/Auth/AuthTabs';
import { Navigate } from 'react-router-dom'; // Assuming react-router-dom is used for navigation

export const AuthPage: React.FC = () => {
  const { user, loading, membershipTier } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading...</p> {/* Replace with a proper spinner/skeleton loader */}
      </div>
    );
  }

  if (user) {
    // User is logged in, redirect to a dashboard or home page
    // Replace '/dashboard' with your desired authenticated route
    // Or display a welcome message if direct redirect isn't desired here.
    // For now, let's show a welcome message and their tier.
    // return <Navigate to="/dashboard" replace />;
     return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <h1 className="text-2xl font-semibold mb-4">Welcome back, {user.email}!</h1>
        <p className="mb-2">You are logged in.</p>
        {membershipTier && <p>Your membership tier is: <span className="font-semibold">{membershipTier}</span></p>}
        {/* Add a sign out button or link to profile */}
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <AuthTabs />
    </div>
  );
};