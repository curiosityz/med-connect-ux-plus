
"use client";

import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, UserPlus } from 'lucide-react';

export function HeroCtaButton() {
  const { isSignedIn } = useUser();

  if (isSignedIn) {
    return (
      <Link href="/finder" passHref>
        <Button size="lg" className="text-lg px-10 py-7 shadow-lg hover:shadow-xl transition-shadow">
          Go to Finder App
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </Link>
    );
  }

  return (
    <Link href="/sign-up" passHref>
      <Button size="lg" className="text-lg px-10 py-7 shadow-lg hover:shadow-xl transition-shadow">
        Get Started Free
        <UserPlus className="ml-2 h-5 w-5" />
      </Button>
    </Link>
  );
}
