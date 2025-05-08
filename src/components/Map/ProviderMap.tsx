import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS

import { Provider } from '@/lib/supabase'; // Assuming Provider type might include lat/lng later

// Fix leaflet's default icon path issue with bundlers like Vite/Webpack
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Define an extended Provider type for the map, assuming lat/lng will be added
interface ProviderWithLocation extends Provider {
    latitude?: number | null;
    longitude?: number | null;
    // Add address fields if they are expected directly on the provider object for the popup
    address_line_1?: string;
    address_line_2?: string;
    // city, state, zip are already optional in base Provider type
}

interface ProviderMapProps {
  providers: ProviderWithLocation[]; // Use extended type
  isLoading?: boolean;
  // Default map center (e.g., center of US)
  defaultCenter?: [number, number];
  defaultZoom?: number;
}

// Component to automatically adjust map bounds
const MapBoundsUpdater: React.FC<{ providers: ProviderWithLocation[] }> = ({ providers }) => {
  const map = useMap();
  
  React.useEffect(() => {
    const validLocations = providers
      .map(p => (p.latitude && p.longitude ? L.latLng(p.latitude, p.longitude) : null))
      .filter((loc): loc is L.LatLng => loc !== null);

    if (validLocations.length > 0) {
      const bounds = L.latLngBounds(validLocations);
      map.fitBounds(bounds, { padding: [50, 50] }); // Add padding
    } else {
       // Optionally reset view if no locations
       // map.setView([39.8283, -98.5795], 4); // Center of US
    }
  }, [providers, map]);

  return null;
};


export const ProviderMap: React.FC<ProviderMapProps> = ({ 
    providers, 
    isLoading, 
    defaultCenter = [39.8283, -98.5795], // Default to center of US
    defaultZoom = 4 
}) => {

  // Filter providers with valid coordinates for markers
  const providersWithCoords = useMemo(() => {
    return providers.filter(p => typeof p.latitude === 'number' && typeof p.longitude === 'number');
  }, [providers]);

  if (isLoading) {
    return (
      <div className="w-full h-96 bg-muted rounded-lg animate-pulse flex items-center justify-center">
        <p className="text-muted-foreground">Loading Map...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-96 border rounded-lg overflow-hidden shadow-md">
       {/* Ensure Leaflet CSS is loaded */}
       <style>{`
        .leaflet-container { height: 100%; width: 100%; }
       `}</style>
      <MapContainer 
        center={defaultCenter} 
        zoom={defaultZoom} 
        scrollWheelZoom={true} // Enable scroll wheel zoom
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {providersWithCoords.map((provider) => (
          // Type assertion needed if latitude/longitude are optional
          <Marker 
             key={provider.npi || provider.id} 
             position={[provider.latitude!, provider.longitude!]}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{provider.name || `${provider.first_name || ''} ${provider.last_name || ''}`.trim()}</p>
                <p>{provider.title || 'Provider'}</p>
                <p>{provider.address_line_1 || provider.location || `${provider.city || ''}, ${provider.state || ''}`}</p>
                {/* Add more details like phone number if available */}
                <a 
                  href={`/providers/${provider.npi || provider.id}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline mt-1 block"
                >
                  View Profile
                </a>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Add component to update bounds when providers change */}
        <MapBoundsUpdater providers={providersWithCoords} />

      </MapContainer>
       {providersWithCoords.length === 0 && providers.length > 0 && (
         <div className="absolute inset-0 flex items-center justify-center bg-gray-400 bg-opacity-50 z-10">
            <p className="text-white bg-black bg-opacity-70 p-2 rounded">No location data available for current results.</p>
         </div>
       )}
    </div>
  );
};

export default ProviderMap;