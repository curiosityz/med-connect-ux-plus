
import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export interface ProviderCardProps {
  id: string;
  name: string;
  title: string;
  specialties: string[];
  rating: number;
  reviewCount: number;
  location: string;
  availability: string;
  imageUrl?: string;
}

const ProviderCard: React.FC<ProviderCardProps> = ({
  id,
  name,
  title,
  specialties,
  rating,
  reviewCount,
  location,
  availability,
  imageUrl
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm card-hover">
      <div className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-medblue-100 overflow-hidden flex-shrink-0">
            {imageUrl ? (
              <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-medblue-600">
                {name.charAt(0)}
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-bold text-medblue-800">{name}</h3>
            <p className="text-sm text-gray-600">{title}</p>
            <div className="flex items-center mt-1">
              <span className="text-sm font-medium text-medteal-600">{rating.toFixed(1)} ★</span>
              <span className="text-xs text-gray-500 ml-1">({reviewCount} reviews)</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{location}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {specialties.map((specialty, idx) => (
            <span 
              key={idx}
              className="px-2 py-1 bg-medblue-50 text-medblue-700 text-xs font-medium rounded-full"
            >
              {specialty}
            </span>
          ))}
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-medteal-600 font-medium">{availability}</span>
          <Button asChild size="sm" className="bg-medblue-600 hover:bg-medblue-700">
            <Link to={`/providers/${id}`}>Book Appointment</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProviderCard;
