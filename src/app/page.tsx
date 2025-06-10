import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BriefcaseMedical, MapPinned, ShieldCheck, Zap, Target, Lightbulb, UserCheck, Search, FileText, Users, TrendingUp, Clock, CheckCircle, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { HeroCtaButton } from '@/components/landing/hero-cta-button';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 bg-gradient-to-br from-primary/10 via-background to-secondary/20 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="animate-bounce">
            <BriefcaseMedical className="h-16 w-16 text-primary mx-auto mb-6" />
          </div>
          <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
            🚀 Trusted by Healthcare Professionals
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            RX Prescribers: Find Care, <span className="text-primary">Effortlessly</span>.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            Quickly locate medical prescribers by medication and zip code within your desired radius. Get the information you need, when you need it, with our powerful and intuitive search tool.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <HeroCtaButton />
            <Button variant="outline" size="lg" className="group">
              <Search className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
              Watch Demo
            </Button>
          </div>
          <div className="mt-16 md:mt-20">
            <Image
              src="/graphics/Screenshot_2025-06-09_11-25-27.png"
              alt="RX Prescribers Application Main Interface"
              width={1200}
              height={600}
              className="rounded-xl shadow-2xl mx-auto border-2 border-primary/20 hover:scale-105 transition-transform duration-500"
              priority
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold">10K+</div>
              <div className="text-primary-foreground/80">Prescribers Found</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold">50K+</div>
              <div className="text-primary-foreground/80">Searches Completed</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold">99.9%</div>
              <div className="text-primary-foreground/80">Uptime</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl md:text-4xl font-bold">&lt;2s</div>
              <div className="text-primary-foreground/80">Average Response</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Why Choose RX Prescribers?</h2>
            <p className="text-muted-foreground mb-12 md:mb-16 max-w-xl mx-auto">
              Our platform provides powerful, easy-to-use tools to connect you with the right healthcare providers quickly and efficiently.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="group shadow-lg hover:shadow-2xl transition-all duration-300 bg-card transform hover:-translate-y-2 border-0 bg-gradient-to-br from-card to-card/50">
              <CardHeader className="items-center text-center">
                <div className="p-4 bg-primary/10 rounded-full mb-4 inline-block group-hover:scale-110 transition-transform duration-300">
                  <Target className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold">Precision Search</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                Easily search prescribers by specific medication names (brand or generic) with our intelligent matching algorithm.
              </CardContent>
            </Card>
            <Card className="group shadow-lg hover:shadow-2xl transition-all duration-300 bg-card transform hover:-translate-y-2 border-0 bg-gradient-to-br from-card to-card/50">
              <CardHeader className="items-center text-center">
                <div className="p-4 bg-primary/10 rounded-full mb-4 inline-block group-hover:scale-110 transition-transform duration-300">
                  <MapPinned className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold">Smart Location</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                Define your search area with customizable radius options around any US zipcode for optimal convenience.
              </CardContent>
            </Card>
            <Card className="group shadow-lg hover:shadow-2xl transition-all duration-300 bg-card transform hover:-translate-y-2 border-0 bg-gradient-to-br from-card to-card/50">
              <CardHeader className="items-center text-center">
                <div className="p-4 bg-primary/10 rounded-full mb-4 inline-block group-hover:scale-110 transition-transform duration-300">
                  <Zap className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-xl font-semibold">Lightning Fast</CardTitle>
              </CardHeader>
              <CardContent className="text-center text-muted-foreground">
                Get instant results with our optimized search engine that processes millions of records in seconds.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-foreground">Our Impact at a Glance</h2>
          <p className="text-center text-muted-foreground mb-12 md:mb-16 max-w-xl mx-auto">
            RX Prescribers has transformed the way patients and providers connect. Here are some key highlights.
          </p>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="flex flex-col items-center">
              <TrendingUp className="h-10 w-10 text-primary mb-2" />
              <h3 className="text-2xl font-bold mb-1 text-foreground">10,000+</h3>
              <p className="text-muted-foreground">Successful Connections</p>
            </div>
            <div className="flex flex-col items-center">
              <Clock className="h-10 w-10 text-primary mb-2" />
              <h3 className="text-2xl font-bold mb-1 text-foreground">2 Min</h3>
              <p className="text-muted-foreground">Average Search Time</p>
            </div>
            <div className="flex flex-col items-center">
              <CheckCircle className="h-10 w-10 text-primary mb-2" />
              <h3 className="text-2xl font-bold mb-1 text-foreground">99%</h3>
              <p className="text-muted-foreground">Satisfaction Rate</p>
            </div>
            <div className="flex flex-col items-center">
              <Star className="h-10 w-10 text-primary mb-2" />
              <h3 className="text-2xl font-bold mb-1 text-foreground">5/5</h3>
              <p className="text-muted-foreground">Average Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* Screenshots Gallery Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-foreground">See RX Prescribers in Action</h2>
          <p className="text-center text-muted-foreground mb-12 md:mb-16 max-w-2xl mx-auto">
            Explore our intuitive interface designed to make finding healthcare providers simple and efficient.
          </p>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-semibold mb-3 text-foreground">Advanced Search Interface</h3>
                <p className="text-muted-foreground mb-4">
                  Our clean, user-friendly search interface makes it easy to input medication names, zip codes, and radius preferences for precise results.
                </p>
                <Image
                  src="/graphics/Screenshot_2025-06-09_11-27-57.png"
                  alt="RX Prescribers Search Interface"
                  width={600}
                  height={400}
                  className="rounded-lg shadow-lg border border-primary/20"
                />
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-semibold mb-3 text-foreground">Comprehensive Results</h3>
                <p className="text-muted-foreground mb-4">
                  View detailed prescriber information including names, addresses, and medication matches in an organized, easy-to-read format.
                </p>
                <Image
                  src="/graphics/Screenshot_2025-06-09_11-29-18.png"
                  alt="RX Prescribers Results View"
                  width={600}
                  height={400}
                  className="rounded-lg shadow-lg border border-primary/20"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 to-secondary/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Testimonials</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">What Healthcare Professionals Say</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join thousands of healthcare professionals who trust RX Prescribers for their daily practice needs.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-card/50 backdrop-blur border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4 italic">
                  "RX Prescribers has revolutionized how I find specialists for my patients. The search is incredibly fast and accurate."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                    <UserCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Dr. Sarah Johnson</div>
                    <div className="text-xs text-muted-foreground">Family Medicine Physician</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4 italic">
                  "The radius search feature is a game-changer. I can quickly find prescribers near my patients' locations."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                    <UserCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Dr. Michael Chen</div>
                    <div className="text-xs text-muted-foreground">Internal Medicine</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4 italic">
                  "Simple, efficient, and reliable. This tool saves me hours every week when coordinating patient care."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                    <UserCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Dr. Emily Rodriguez</div>
                    <div className="text-xs text-muted-foreground">Pediatric Specialist</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Simple Steps to Find Prescribers
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our streamlined process gets you connected with the right healthcare providers in just three easy steps.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-10 items-start">
            <div className="group flex flex-col items-center text-center p-6 rounded-lg transition-all hover:bg-secondary/20">
              <div className="relative">
                <div className="p-5 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Lightbulb className="h-10 w-10" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-foreground">Enter Details</h3>
              <p className="text-muted-foreground">Input the medication name, your central zipcode, and preferred search radius with our intelligent autocomplete.</p>
            </div>
            <div className="group flex flex-col items-center text-center p-6 rounded-lg transition-all hover:bg-secondary/20 md:mt-8">
              <div className="relative">
                <div className="p-5 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Search className="h-10 w-10" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-foreground">Initiate Search</h3>
              <p className="text-muted-foreground">Click the search button to instantly query our comprehensive database of verified healthcare providers.</p>
            </div>
            <div className="group flex flex-col items-center text-center p-6 rounded-lg transition-all hover:bg-secondary/20 md:mt-16">
              <div className="relative">
                <div className="p-5 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-full mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="h-10 w-10" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-foreground">Get Results</h3>
              <p className="text-muted-foreground">Browse a curated list of matching prescribers, complete with detailed information and distance calculations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-secondary/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">FAQ</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Frequently Asked Questions</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get answers to common questions about using RX Prescribers.
            </p>
          </div>
          <div className="max-w-3xl mx-auto space-y-6">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-left">How accurate is the prescriber data?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Our database is updated regularly and sourced from verified healthcare directories and licensing boards to ensure maximum accuracy and reliability.</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-left">What medications can I search for?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">You can search for both brand name and generic medications. Our system recognizes thousands of medications and their various formulations.</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-left">Is there a limit to how many searches I can perform?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Free users get 10 searches per month. Premium subscribers enjoy unlimited searches plus advanced filtering options and priority support.</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-left">How current is the prescriber information?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">We update our database monthly with the latest prescriber information, including new practices, address changes, and specialty certifications.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 md:py-28 bg-gradient-to-tr from-primary/20 via-background to-secondary/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <Badge variant="secondary" className="mb-6 px-4 py-2">
              🎉 Join 10,000+ Healthcare Professionals
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-foreground">
              Ready to Transform Your <span className="text-primary">Healthcare Practice?</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Join thousands of healthcare professionals who have streamlined their prescriber search process. Start your free trial today and experience the difference.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <HeroCtaButton />
              <Button variant="outline" size="lg" className="group">
                <Clock className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                Book a Demo
              </Button>
            </div>
            <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                No Credit Card Required
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                30-Day Free Trial
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Cancel Anytime
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
