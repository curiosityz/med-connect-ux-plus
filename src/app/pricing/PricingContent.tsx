"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";

// Define createOrder function with enhanced error handling
const createOrder = (amount: string, description: string, planType: string) => async () => {
  console.log('Attempting to create PayPal order with amount:', amount, 'description:', description, 'planType:', planType);
  try {
    const response = await fetch('/api/paypal/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        description,
        planType,
      }),
    });

    console.log('Create order API response status:', response.status);
    const responseBody = await response.json();
    console.log('Create order API response body:', responseBody);

    if (!response.ok) {
      const errorMsg = responseBody.error || `API Error: ${response.status}`;
      console.error('Failed to create order (API error):', errorMsg, responseBody);
      toast.error(`Could not initiate PayPal payment: ${errorMsg}`);
      throw new Error(errorMsg); // This will be caught by PayPal SDK and can be handled in onError
    }

    if (!responseBody.id) {
      console.error('Failed to create order: No order ID received from API.', responseBody);
      toast.error('Could not initiate PayPal payment: Invalid order data received.');
      throw new Error('Invalid order data received from API.');
    }

    console.log('PayPal Order ID created successfully:', responseBody.id);
    return responseBody.id;
  } catch (error) {
    console.error('Error in createOrder function:', error);
    // If toast was already shown for API error, this might be redundant but good for other errors
    if (!(error instanceof Error && error.message.startsWith('API Error:')) && 
        !(error instanceof Error && error.message.startsWith('Invalid order data'))) {
      toast.error('An unexpected error occurred while setting up PayPal.');
    }
    throw error; // Re-throw to be caught by PayPal SDK if needed
  }
};

export default function PricingContent() {
  const { isSignedIn, user } = useUser();
  const [isProcessing, setIsProcessing] = useState(false);

  const initialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
    currency: "USD",
    // Enable logging for the PayPal SDK for more detailed client-side logs from PayPal
    // "data-sdk-integration-source": "developer-studio", // Optional: for PayPal analytics
    // "enable-funding": "venmo,card" // Example: to enable Venmo and card payments
    // "disable-funding": "credit,card" // Example: to disable credit and card payments
    // For more advanced options, refer to PayPal JS SDK documentation
  };

  const handleApprove = async (data: any, actions: any, plan: string) => {
    try {
      setIsProcessing(true);
      console.log('Payment approved by PayPal. Data:', data);
      const details = await actions.order.capture();
      console.log('Payment captured. Details:', details);

      const response = await fetch('/api/paypal/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderID: details.id,
          planType: plan,
        }),
      });
      const result = await response.json();
      if (response.ok) {
        toast.success(`Thank you for purchasing the ${plan} plan!`);
        // Potentially redirect or update UI state here
      } else {
        throw new Error(result.error || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Error in handleApprove:', error);
      toast.error(error instanceof Error ? error.message : "Failed to process payment after approval.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleError = (err: any) => {
    console.error('PayPal Button SDK Error:', err);
    toast.error('PayPal encountered an error. Please try again or contact support.');
    // Potentially reset some state or log more detailed error info
    setIsProcessing(false); // Ensure processing state is reset
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      <div className="container mx-auto py-12 md:py-20 px-4">
        <div className="text-center mb-12 md:mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Get Full Access
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Unlock all features of RX Prescribers with a simple one-time payment.
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-8 justify-center">
          {/* Basic Plan */}
          <Card className="w-full max-w-md shadow-xl transform hover:scale-105 transition-transform duration-300 bg-card">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-semibold text-primary">Basic</CardTitle>
              <CardDescription className="text-muted-foreground text-lg pt-1">
                Essential features for individuals.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <span className="text-4xl font-bold text-foreground">$19.95</span>
                <span className="text-muted-foreground"> / one-time</span>
              </div>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" /> Unlimited prescriber searches</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" /> Radius search up to 25 miles</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" /> Basic prescriber information</li>
              </ul>
            </CardContent>
            <CardFooter>
              {isSignedIn ? (
                <PayPalButtons
                  style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay" }}
                  createOrder={createOrder("19.95", "Basic Plan", "Basic")}
                  onApprove={(data, actions) => handleApprove(data, actions, "Basic")}
                  onError={handleError}
                  disabled={isProcessing}
                />
              ) : (
                <Button size="lg" className="w-full text-lg py-7" disabled>
                  Sign in to purchase
                </Button>
              )}
            </CardFooter>
          </Card>

          {/* Complete Access Plan */}
          <Card className="w-full max-w-md shadow-xl transform hover:scale-105 transition-transform duration-300 bg-card border-primary">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <CardTitle className="text-2xl font-semibold text-primary">Complete Access</CardTitle>
              </div>
              <CardDescription className="text-muted-foreground text-lg pt-1">
                Full features for professionals.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <span className="text-4xl font-bold text-foreground">$49.99</span>
                <span className="text-muted-foreground"> / one-time</span>
              </div>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" /> Everything in Basic</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" /> Advanced search filters</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" /> Detailed prescriber profiles</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" /> Export data to CSV</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" /> Priority support</li>
              </ul>
            </CardContent>
            <CardFooter>
              {isSignedIn ? (
                <PayPalButtons
                  style={{ layout: "vertical", color: "gold", shape: "rect", label: "pay" }}
                  createOrder={createOrder("49.99", "Complete Access Plan", "Complete Access")}
                  onApprove={(data, actions) => handleApprove(data, actions, "Complete Access")}
                  onError={handleError}
                  disabled={isProcessing}
                />
              ) : (
                <Button size="lg" className="w-full text-lg py-7" disabled>
                  Sign in to purchase
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
        <p className="text-center text-muted-foreground mt-12 text-sm">
          Payment processing is handled securely via PayPal.<br />
          For any questions, please <Link href="/contact" className="text-primary hover:underline">contact us</Link>.
        </p>
      </div>
    </PayPalScriptProvider>
  );
} 