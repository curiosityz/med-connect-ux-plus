'use client';

import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function HandleAuthPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  // Explicitly track loading state for this page's logic
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    if (isLoaded) {
      if (user) {
        // Check for payment plan in publicMetadata
        // Ensure publicMetadata and paymentPlan are accessed safely
        const paymentPlan = user.publicMetadata?.paymentPlan as string | undefined;

        console.log('HandleAuthPage: User loaded, paymentPlan from metadata:', paymentPlan);

        if (paymentPlan && paymentPlan.trim() !== '') {
          // User has a payment plan, redirect to finder
          console.log('HandleAuthPage: Redirecting to /finder');
          router.replace('/finder');
        } else {
          // User does not have a payment plan, redirect to pricing/payment page
          // TODO: Replace '/pricing' with your actual payment initiation page if different
          console.log('HandleAuthPage: Redirecting to /pricing');
          router.replace('/pricing');
        }
      } else {
        // User is not signed in after Clerk's redirect, something is wrong.
        // This case should ideally not be reached if Clerk is configured correctly
        // and this page is protected. Redirect to sign-in as a fallback.
        console.warn('HandleAuthPage: User not found after Clerk redirect, redirecting to /sign-in');
        router.replace('/sign-in');
      }
    }
    // setIsProcessing(false) will be handled by the redirect or if !isLoaded initially
    // However, if !isLoaded, we want to keep showing loading.
    // If isLoaded and a redirect happens, the component unmounts.
    // If isLoaded and no user (fallback), it also redirects.
    // Essentially, if isLoaded is true, a decision is made.
    if(isLoaded) {
        setIsProcessing(false); // Only stop processing once Clerk is loaded and decision is made/redirect starts
    }

  }, [isLoaded, user, router]);

  if (!isLoaded || isProcessing) {
    // You can replace this with a more sophisticated loading spinner or component
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading your experience...</p>
      </div>
    );
  }

  // This content is unlikely to be seen as redirects should happen quickly
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Finalizing your session...</p>
    </div>
  );
} 