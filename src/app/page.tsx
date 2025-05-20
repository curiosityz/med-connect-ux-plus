
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BriefcaseMedical, MapPinned, ShieldCheck, Zap, Target, Lightbulb, UserCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { HeroCtaButton } from '@/components/landing/hero-cta-button';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto px-4 text-center">
          <BriefcaseMedical className="h-16 w-16 text-primary mx-auto mb-6" />
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
            RX Prescribers: Find Care, <span className="text-primary">Effortlessly</span>.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Quickly locate medical prescribers by medication and zip code within your desired radius. Get the information you need, when you need it.
          </p>
          <HeroCtaButton />
          <div className="mt-16">
            <Image
              src="https://placehold.co/1200x600.png"
              alt="RX Prescribers Application Screenshot"
              width={1200}
              height={600}
              className="rounded-lg shadow-2xl mx-auto border"
              data-ai-hint="app screenshot healthcare"
              priority
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-foreground">Why Choose RX Prescribers?</h2>
          <p className="text-center text-muted-foreground mb-12 md:mb-16 max-w-xl mx-auto">
            Our platform provides powerful tools to connect you with the right healthcare providers.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="items-center text-center">
                <div className="p-3 bg-primary/10 rounded-full mb-4">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Precision Medication Search</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                Easily search for prescribers by specific medication names or generic equivalents.
              </CardContent>
            </Card>
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="items-center text-center">
                <div className="p-3 bg-primary/10 rounded-full mb-4">
                  <MapPinned className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Radius-Based Location</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                Define your search area with customizable radius options around any US zipcode.
              </CardContent>
            </Card>
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="items-center text-center">
                <div className="p-3 bg-primary/10 rounded-full mb-4">
                  <UserCheck className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Detailed Prescriber Info</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                Access prescriber names, addresses, and matched medications at a glance.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 md:mb-16 text-foreground">
            Simple Steps with RX Prescribers
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="p-4 bg-primary text-primary-foreground rounded-full mb-4">
                <Lightbulb className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">1. Enter Details</h3>
              <p className="text-muted-foreground">Input the medication name and your central zipcode.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-4 bg-primary text-primary-foreground rounded-full mb-4">
                <Zap className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">2. Set Radius & Search</h3>
              <p className="text-muted-foreground">Choose your desired search radius and hit search.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-4 bg-primary text-primary-foreground rounded-full mb-4">
                <ShieldCheck className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">3. Get Results</h3>
              <p className="text-muted-foreground">Instantly view a list of matching prescribers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 md:py-28 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            Ready to Use RX Prescribers?
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Join thousands of users simplifying their healthcare provider search.
          </p>
          <HeroCtaButton />
        </div>
      </section>
    </div>
  );
}
