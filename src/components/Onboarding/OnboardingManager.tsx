
import React, { useState, useEffect } from 'react';
import { OnboardingModal } from './OnboardingModal';
import { useClerkAuth } from '@/hooks/useClerkAuth';

export function OnboardingManager() {
  const { isAuthenticated, user } = useClerkAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  useEffect(() => {
    if (isAuthenticated && user) {
      // Check if user is newly created (within the last minute)
      // or if onboarding hasn't been completed (you could use localStorage or metadata for this)
      const isNewUser = user.createdAt && 
        (Date.now() - new Date(user.createdAt).getTime()) < 60000;
      
      const hasCompletedOnboarding = localStorage.getItem(`onboarding-complete-${user.id}`);
      
      if (isNewUser && !hasCompletedOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [isAuthenticated, user]);
  
  const handleOnboardingComplete = () => {
    if (user) {
      localStorage.setItem(`onboarding-complete-${user.id}`, 'true');
    }
    setShowOnboarding(false);
  };
  
  return (
    <>
      <OnboardingModal 
        isOpen={showOnboarding} 
        onComplete={handleOnboardingComplete} 
      />
    </>
  );
}
