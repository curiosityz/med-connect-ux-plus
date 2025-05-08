import React from 'react';
import { Provider } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // For image_url
import { Button } from '@/components/ui/button'; // For a "View Profile" button
import { Link } from 'react-router-dom'; // Assuming react-router-dom for navigation

interface ProviderCardProps {
  provider: Provider;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({ provider }) => {
  const displayName = provider.name || `${provider.first_name || ''} ${provider.last_name || ''}`.trim() || 'Unknown Provider';
  const displayLocation = provider.location || `${provider.city || 'Unknown City'}, ${provider.state || 'N/A'}`;
  const providerInitials = (provider.first_name?.[0] || '') + (provider.last_name?.[0] || '');

  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-start space-x-4 pb-2">
        {provider.image_url && (
          <Avatar className="h-12 w-12">
            <AvatarImage src={provider.image_url} alt={displayName} />
            <AvatarFallback>{providerInitials || 'P'}</AvatarFallback>
          </Avatar>
        )}
        <div className="flex-1">
          <CardTitle className="text-xl font-semibold">{displayName}</CardTitle>
          {provider.title && <CardDescription className="text-sm">{provider.title}</CardDescription>}
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-3 pt-2">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Location:</p>
          <p className="text-sm text-muted-foreground">{displayLocation}</p>
        </div>
        
        {provider.specialties && provider.specialties.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Specialties:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {provider.specialties.slice(0, 3).map((specialty, index) => (
                <Badge key={index} variant="outline" className="text-xs">{specialty}</Badge>
              ))}
              {provider.specialties.length > 3 && (
                <Badge variant="outline" className="text-xs">+{provider.specialties.length - 3} more</Badge>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-x-4 text-sm">
          <div>
            <p className="font-medium text-gray-700 dark:text-gray-300">NPI:</p>
            <p className="text-muted-foreground">{provider.npi || 'N/A'}</p>
          </div>
          {typeof provider.rating === 'number' && (
            <div>
              <p className="font-medium text-gray-700 dark:text-gray-300">Rating:</p>
              <p className="text-muted-foreground">
                {provider.rating.toFixed(1)}/5 ({provider.review_count || 0} reviews)
              </p>
            </div>
          )}
        </div>
        
        {provider.availability && (
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Availability:</p>
            <p className="text-sm text-muted-foreground">{provider.availability}</p>
          </div>
        )}

        {/* Consider adding a snippet of the bio if available and concise */}
        {/* {provider.bio && <p className="text-xs text-muted-foreground truncate">{provider.bio}</p>} */}

      </CardContent>
      <CardFooter className="pt-4">
        {/* Link to a detailed provider page, e.g., /providers/:npi or /providers/:id */}
        <Button asChild variant="default" className="w-full">
          <Link to={`/providers/${provider.npi || provider.id}`}>View Profile</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};
