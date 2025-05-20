
"use client";

import { PricingTable } from '@clerk/nextjs';
import Link from 'next/link'; // Keep for potential "contact us" link if needed elsewhere

export default function PricingPage() {
  return (
    <div className="container mx-auto py-12 md:py-20 px-4">
      <div className="text-center mb-12 md:mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          Choose Your Plan
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Unlock the full potential of RX Prescribers with a plan that fits your needs.
          The table below shows the plans you've configured in your Clerk dashboard.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <PricingTable newSubscriptionRedirectUrl="/finder" />
      </div>

      <p className="text-center text-muted-foreground mt-12 text-sm">
        Prices are in USD. You can manage your subscription through your account settings.
        <br />
        For enterprise solutions or custom needs, please <Link href="/contact" className="text-primary hover:underline">contact us</Link>.
        {/* Note: You'll need to create a /contact page if you keep this link. */}
      </p>
    </div>
  );
}
