
import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export interface MedicationCardProps {
  id: string;
  name: string;
  genericName: string;
  category: string;
  description: string;
  providerCount: number;
}

const MedicationCard: React.FC<MedicationCardProps> = ({
  id,
  name,
  genericName,
  category,
  description,
  providerCount
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm card-hover">
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-xl font-bold text-medblue-800">{name}</h3>
            <p className="text-sm text-gray-500">{genericName}</p>
          </div>
          <span className="px-3 py-1 bg-medblue-50 text-medblue-700 text-xs font-medium rounded-full">
            {category}
          </span>
        </div>
        
        <p className="text-gray-600 mb-4 line-clamp-2">{description}</p>
        
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">
            {providerCount} {providerCount === 1 ? 'provider' : 'providers'} available
          </span>
          <Button asChild size="sm" className="bg-medblue-600 hover:bg-medblue-700">
            <Link to={`/medications/${id}`}>Find Providers</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MedicationCard;
