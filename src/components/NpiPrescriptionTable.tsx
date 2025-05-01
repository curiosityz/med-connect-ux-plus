
import React from "react";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import { NpiPrescription } from "@/lib/supabase";
import { Link } from "react-router-dom";

interface NpiPrescriptionTableProps {
  prescriptions: NpiPrescription[];
  isLoading?: boolean;
  showProviderLink?: boolean;
}

const NpiPrescriptionTable: React.FC<NpiPrescriptionTableProps> = ({ 
  prescriptions, 
  isLoading = false,
  showProviderLink = false
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medblue-700"></div>
      </div>
    );
  }

  if (!prescriptions || prescriptions.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No prescription data found</h3>
        <p className="text-gray-600">No prescriptions are available for this provider</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {showProviderLink && <TableHead>Provider NPI</TableHead>}
            <TableHead>Drug Name</TableHead>
            <TableHead>Generic Name</TableHead>
            <TableHead className="text-right">Total Claims</TableHead>
            {prescriptions[0]?.state && <TableHead>State</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {prescriptions.map((prescription, index) => (
            <TableRow key={`${prescription.npi}-${prescription.drug_name}-${index}`}>
              {showProviderLink && (
                <TableCell>
                  <Link 
                    to={`/npi-providers/${prescription.npi}`}
                    className="text-medblue-600 hover:underline"
                  >
                    {prescription.npi}
                  </Link>
                </TableCell>
              )}
              <TableCell className="font-medium">{prescription.drug_name}</TableCell>
              <TableCell>{prescription.generic_name}</TableCell>
              <TableCell className="text-right">{prescription.total_claim_count.toLocaleString()}</TableCell>
              {prescription.state && <TableCell>{prescription.state}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default NpiPrescriptionTable;
