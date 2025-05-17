
import React, { useState } from 'react';
import { useClerkAuth } from '@/hooks/useClerkAuth';
import { useClerkUserProfile } from '@/hooks/useClerkUserProfile';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const zipCodeSchema = z.object({
  zipCode: z.string()
    .min(5, "ZIP code must be at least 5 characters")
    .max(10, "ZIP code must not exceed 10 characters")
    .regex(/^\d{5}(-\d{4})?$/, "ZIP code must be in format 12345 or 12345-6789")
});

type ZipFormValues = z.infer<typeof zipCodeSchema>;

export function ProfileEdit() {
  const { user } = useClerkAuth();
  const { primaryZipCode, updatePrimaryZipCode, isLoading } = useClerkUserProfile();
  const [isUpdating, setIsUpdating] = useState(false);

  const form = useForm<ZipFormValues>({
    resolver: zodResolver(zipCodeSchema),
    defaultValues: {
      zipCode: primaryZipCode || ''
    },
  });

  // Update form when primaryZipCode is loaded
  React.useEffect(() => {
    if (primaryZipCode) {
      form.setValue('zipCode', primaryZipCode);
    }
  }, [primaryZipCode, form]);

  async function onSubmit(data: ZipFormValues) {
    setIsUpdating(true);
    
    try {
      const success = await updatePrimaryZipCode(data.zipCode);
      
      if (success) {
        toast.success("Primary location updated successfully!");
      } else {
        toast.error("Failed to update primary location.");
      }
    } catch (error) {
      console.error("Error updating ZIP code:", error);
      toast.error("An error occurred while updating your location.");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Location Settings</CardTitle>
        <CardDescription>
          Set your primary ZIP code for provider searches and notifications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="zipCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary ZIP Code</FormLabel>
                  <FormControl>
                    <Input placeholder="12345" {...field} />
                  </FormControl>
                  <FormDescription>
                    This will be used as your default location for provider searches.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" disabled={isUpdating || isLoading}>
              {isUpdating ? "Saving..." : "Save Location"}
            </Button>
          </form>
        </Form>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-muted-foreground">
            Need to manage multiple locations? <a href="/manage-locations" className="text-primary hover:underline">Manage Saved Locations</a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
