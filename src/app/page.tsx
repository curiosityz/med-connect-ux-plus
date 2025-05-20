
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BriefcaseMedical, MapPinned, ShieldCheck, Zap, Target, Lightbulb, UserCheck, Search, FileText, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { HeroCtaButton } from '@/components/landing/hero-cta-button';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-primary/10 via-background to-secondary/20">
        <div className="container mx-auto px-4 text-center">
          <BriefcaseMedical className="h-16 w-16 text-primary mx-auto mb-6" />
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
            RX Prescribers: Find Care, <span className="text-primary">Effortlessly</span>.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
            Quickly locate medical prescribers by medication and zip code within your desired radius. Get the information you need, when you need it, with our powerful and intuitive search tool.
          </p>
          <HeroCtaButton />
          <div className="mt-16 md:mt-20">
            <Image
              src="https://placehold.co/1200x600.png"
              alt="RX Prescribers Application Screenshot"
              width={1200}
              height={600}
              className="rounded-xl shadow-2xl mx-auto border-2 border-primary/20"
              data-ai-hint="healthcare app interface"
              priority
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-foreground">Why Choose RX Prescribers?</h2>
          <p className="text-center text-muted-foreground mb-12 md:mb-16 max-w-xl mx-auto">
            Our platform provides powerful, easy-to-use tools to connect you with the right healthcare providers quickly and efficiently.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card transform hover:-translate-y-1">
              <CardHeader className="items-center text-center">
                <div className="p-4 bg-primary/10 rounded-full mb-4 inline-block">
                  <Target className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold">Precision Search</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                Easily search prescribers by specific medication names (brand or generic).
              </CardContent>
            </Card>
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card transform hover:-translate-y-1">
              <CardHeader className="items-center text-center">
                <div className="p-4 bg-primary/10 rounded-full mb-4 inline-block">
                  <MapPinned className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold">Radius-Based Location</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                Define your search area with customizable radius options around any US zipcode.
              </CardContent>
            </Card>
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card transform hover:-translate-y-1">
              <CardHeader className="items-center text-center">
                <div className="p-4 bg-primary/10 rounded-full mb-4 inline-block">
                  <FileText className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold">Detailed Info</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                Access prescriber names, addresses, and matched medications at a glance.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 md:mb-16 text-foreground">
            Simple Steps to Find Prescribers
          </h2>
          <div className="grid md:grid-cols-3 gap-10 items-start">
            <div className="flex flex-col items-center text-center p-6 rounded-lg transition-all">
              <div className="p-5 bg-primary text-primary-foreground rounded-full mb-5 shadow-lg">
                <Lightbulb className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-semibold mb-2 text-foreground">1. Enter Details</h3>
              <p className="text-muted-foreground">Input the medication name, your central zipcode, and preferred search radius.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-lg transition-all md:mt-[-20px] md:mb-[20px] relative">
              <div className="absolute top-1/2 left-0 w-full border-t-2 border-dashed border-primary/30 hidden md:block md:transform md:-translate-y-1/2 md:left-[-50%] md:w-[calc(100%+100%)] -z-10"></div>
              <div className="p-5 bg-primary text-primary-foreground rounded-full mb-5 shadow-lg">
                <Search className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-semibold mb-2 text-foreground">2. Initiate Search</h3>
              <p className="text-muted-foreground">Click the search button to instantly query our comprehensive database.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-lg transition-all">
              <div className="p-5 bg-primary text-primary-foreground rounded-full mb-5 shadow-lg">
                <Users className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-semibold mb-2 text-foreground">3. View Results</h3>
              <p className="text-muted-foreground">Browse a list of matching prescribers, complete with details and distance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 md:py-28 bg-gradient-to-tr from-primary/10 via-background to-secondary/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
            Ready to Use RX Prescribers?
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Sign up for free and start simplifying your healthcare provider search today.
          </p>
          <HeroCtaButton />
        </div>
      </section>
    </div>
  );
}
