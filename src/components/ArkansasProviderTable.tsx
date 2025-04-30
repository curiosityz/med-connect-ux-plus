
import React from "react";
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from "@/components/ui/table";
import { ArkansasProvider } from "@/lib/supabase";
import { Link } from "react-router-dom";

interface ArkansasProviderTableProps {
  providers: ArkansasProvider[];
  isLoading?: boolean;
}

const ArkansasProviderTable: React.FC<ArkansasProviderTableProps> = ({ 
  providers, 
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-medblue-700"></div>
      </div>
    );
  }

  if (!providers || providers.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No providers found</h3>
        <p className="text-gray-600">Try adjusting your search criteria</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Provider Name</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Medication</TableHead>
            <TableHead className="text-right">Total Claims</TableHead>
            <TableHead className="text-right">Beneficiaries</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {providers.map((provider) => (
            <TableRow key={`${provider.prscrbr_npi}-${provider.brnd_name}`}>
              <TableCell className="font-medium">
                <Link 
                  to={`/arkansas-providers/${provider.prscrbr_npi}`}
                  className="text-medblue-600 hover:underline"
                >
                  {provider.prscrbr_last_org_name}, {provider.prscrbr_first_name}
                </Link>
              </TableCell>
              <TableCell>{provider.prscrbr_city}</TableCell>
              <TableCell>{provider.prscrbr_type}</TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{provider.brnd_name}</div>
                  <div className="text-sm text-gray-500">{provider.gnrc_name}</div>
                </div>
              </TableCell>
              <TableCell className="text-right">{provider.tot_clms.toLocaleString()}</TableCell>
              <TableCell className="text-right">{provider.tot_benes.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ArkansasProviderTable;
