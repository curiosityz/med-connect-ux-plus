
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { CheckCircle, Package, Zap } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    id: 'cplan_2xMp2zNzsdJ1c5gvNer7Hvnt58L',
    name: 'Basic',
    price: '$5',
    priceFrequency: '/month',
    description: 'Essential features for finding prescribers.',
    features: [
      'Search by single medication',
      'Search by zipcode and radius',
      'View prescriber details (name, address, phone)',
      'Confidence score for prescribers',
    ],
    cta: 'Get Basic',
    icon: Package,
  },
  {
    id: 'cplan_2xMrVPdDfhK2P9t1crAaNEHwMmu',
    name: 'Plus',
    price: '$15',
    priceFrequency: '/month',
    description: 'Advanced features for comprehensive searches.',
    features: [
      'All Basic features',
      'Search for providers prescribing MULTIPLE drugs (coming soon!)',
      'Advanced filtering options (coming soon!)',
      'Priority support (coming soon!)',
    ],
    cta: 'Get Plus',
    highlight: true,
    icon: Zap,
  },
];

export default function PricingPage() {
  return (
    <div className="container mx-auto py-12 md:py-20 px-4">
      <div className="text-center mb-12 md:mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          Choose Your Plan
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Unlock the full potential of RX Prescribers with a plan that fits your needs.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`flex flex-col shadow-xl hover:shadow-2xl transition-shadow duration-300 ${
              plan.highlight ? 'border-primary border-2 ring-2 ring-primary/50' : 'border'
            } bg-card`}
          >
            <CardHeader className="text-center items-center">
              <div className={`p-3 rounded-full mb-4 ${plan.highlight ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                <plan.icon className="h-8 w-8" />
              </div>
              <CardTitle className="text-3xl font-semibold">{plan.name}</CardTitle>
              <CardDescription className="text-muted-foreground h-12 pt-1">
                {plan.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
              <div className="text-center mb-6">
                <span className="text-5xl font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground">{plan.priceFrequency}</span>
              </div>
              <ul className="space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground/90">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="mt-auto">
              {/* 
                TODO: Integrate with Clerk to initiate subscription for plan.id.
                This might involve redirecting to a Clerk-hosted checkout URL
                or using Clerk's client-side SDK to open a checkout modal.
                Example: onClick={() => redirectToClerkCheckout(plan.id)} 
              */}
              <Button
                size="lg"
                className={`w-full text-lg py-6 ${plan.highlight ? '' : 'bg-primary/80 hover:bg-primary/90'}`}
                variant={plan.highlight ? 'default' : 'secondary'}
                // onClick={() => handleSubscribe(plan.id)} // Replace with your Clerk integration
              >
                {plan.cta}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      <p className="text-center text-muted-foreground mt-12 text-sm">
        Prices are in USD. You can cancel or change your plan at any time.
        <br />
        For enterprise solutions, please <Link href="/contact" className="text-primary hover:underline">contact us</Link>.
      </p>
    </div>
  );
}

