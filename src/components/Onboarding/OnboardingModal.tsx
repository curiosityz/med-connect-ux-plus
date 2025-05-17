
import React, { useState } from 'react';
import { useClerkUserProfile } from '@/hooks/useClerkUserProfile';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from 'sonner';
import { Check, MapPin } from 'lucide-react';

const zipCodeSchema = z.object({
  zipCode: z.string()
    .min(5, "ZIP code must be at least 5 characters")
    .max(10, "ZIP code must not exceed 10 characters")
    .regex(/^\d{5}(-\d{4})?$/, "ZIP code must be in format 12345 or 12345-6789")
});

type ZipFormValues = z.infer<typeof zipCodeSchema>;

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const { updatePrimaryZipCode, syncUserProfile } = useClerkUserProfile();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ZipFormValues>({
    resolver: zodResolver(zipCodeSchema),
    defaultValues: {
      zipCode: ''
    },
  });

  const handleNext = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handleSkip = () => {
    handleNext();
  };

  async function handleSubmitZipCode(data: ZipFormValues) {
    setIsSubmitting(true);
    try {
      await updatePrimaryZipCode(data.zipCode);
      await syncUserProfile();
      toast.success("Location set successfully!");
      handleNext();
    } catch (error) {
      console.error("Error setting ZIP code:", error);
      toast.error("Failed to set your location. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleComplete = () => {
    onComplete();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        {/* Step 1: Welcome */}
        {currentStep === 1 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Welcome to MedConnect!</DialogTitle>
              <DialogDescription>
                Let's set up a few things to get you started.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-6">
              <p className="mb-4">
                MedConnect helps you find healthcare providers and medications in your area.
              </p>
              <p>
                To get the most out of MedConnect, we'll need to know a few things.
              </p>
            </div>

            <DialogFooter>
              <Button onClick={handleNext}>Let's Get Started</Button>
            </DialogFooter>
          </>
        )}

        {/* Step 2: Set Location */}
        {currentStep === 2 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center">
                <MapPin className="mr-2 h-6 w-6" /> Set Your Location
              </DialogTitle>
              <DialogDescription>
                This helps us show you relevant providers in your area.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmitZipCode)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your ZIP Code</FormLabel>
                      <FormControl>
                        <Input placeholder="12345" {...field} />
                      </FormControl>
                      <FormDescription>
                        We'll use this to find providers near you.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={handleSkip} type="button">
                    Skip for Now
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "Save Location"}
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}

        {/* Step 3: Completion */}
        {currentStep === 3 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">All Set!</DialogTitle>
              <DialogDescription>
                Your profile is ready to go.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-8 text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
                <Check className="h-10 w-10 text-green-600" />
              </div>
              <p className="text-lg">
                You're all set up and ready to use MedConnect.
              </p>
            </div>

            <DialogFooter>
              <Button onClick={handleComplete}>Get Started</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
