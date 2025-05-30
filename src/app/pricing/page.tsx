
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  const jotformUrl = "https://form.jotform.com/251497126918062";

  return (
    <div className="container mx-auto py-12 md:py-20 px-4">
      <div className="text-center mb-12 md:mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          Get Full Access
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Unlock all features of RX Prescribers with a simple one-time payment.
        </p>
      </div>

      <div className="flex justify-center">
        <Card className="w-full max-w-md shadow-xl transform hover:scale-105 transition-transform duration-300 bg-card">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Zap className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-3xl font-semibold text-primary">Lifetime Access</CardTitle>
            <CardDescription className="text-muted-foreground text-lg pt-1">
              All current and future features.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <span className="text-5xl font-bold text-foreground">$50</span>
              <span className="text-muted-foreground"> / one-time</span>
            </div>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                Unlimited prescriber searches
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                Radius search up to 100 miles
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                Detailed prescriber information
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                Confidence score filtering
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                Future updates included
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Link href={jotformUrl} passHref legacyBehavior>
              <a target="_blank" rel="noopener noreferrer" className="w-full">
                <Button size="lg" className="w-full text-lg py-7">
                  Get Lifetime Access
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
            </Link>
          </CardFooter>
        </Card>
      </div>

      <p className="text-center text-muted-foreground mt-12 text-sm">
        Payment processing will be handled securely.
        <br />
        For any questions, please <Link href="/contact" className="text-primary hover:underline">contact us</Link>.
        {/* Note: You'll need to create a /contact page if you keep this link. */}
      </p>
    </div>
  );
}

