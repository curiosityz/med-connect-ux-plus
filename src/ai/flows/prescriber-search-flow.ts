
'use server';
/**
 * @fileOverview A Genkit flow to search for prescribers based on medication, zipcode, and search radius.
 *
 * - findPrescribers - The main async function to call the flow.
 * - PrescriberSearchInput - Input type for the flow.
 * - PrescriberSearchOutput - Output type for the flow.
 */

import {ai} from '@/ai/genkit';
import { findPrescribersInDB, type PrescriberRecord } from '@/services/databaseService';
import { z } from 'genkit'; 

const PrescriberSearchInputSchema = z.object({
  medicationName: z.string().describe('The name of the medication to search for.'),
  zipcode: z.string().length(5).describe('The 5-digit ZIP code to search within.'),
  searchRadius: z.number().positive().describe("The search radius in miles from the center of the zipcode."),
});
export type PrescriberSearchInput = z.infer<typeof PrescriberSearchInputSchema>;

const PrescriberSchema = z.object({
  prescriberName: z.string().describe("The name of the prescriber."),
  credentials: z.string().optional().describe("The prescriber's credentials (e.g., MD, DDS)."),
  specialization: z.string().optional().describe("The prescriber's specialization."),
  taxonomyClass: z.string().optional().describe("The prescriber's taxonomy classification."),
  address: z.string().describe("The full address of the prescriber."),
  zipcode: z.string().describe("The prescriber's zipcode."),
  phoneNumber: z.string().optional().describe("The prescriber's phone number."),
  medicationMatch: z.string().describe("The name of the medication that matched the search."),
  confidenceScore: z.number().min(0).max(100).describe("A confidence score based on claim count (0-100)."),
  distance: z.number().optional().describe("Approximate distance in miles from the searched zipcode center."),
});
export type PrescriberSearchOutput = z.infer<typeof PrescriberSearchOutputSchema>;


const normalizeCredentials = (credentials?: string | null): string | undefined => {
  if (!credentials) return undefined;
  return credentials
    .replace(/\./g, '') 
    .replace(/\s+/g, '') 
    .toUpperCase();     
};

const searchPrescribersFlow = ai.defineFlow(
  {
    name: 'searchPrescribersFlow',
    inputSchema: PrescriberSearchInputSchema,
    outputSchema: z.object({ // Inline schema definition for flow output
        results: z.array(PrescriberSchema),
        message: z.string().optional(),
    }),
  },
  async (input: PrescriberSearchInput): Promise<{ results: z.infer<typeof PrescriberSchema>[], message?: string }> => {
    try {
      const prescribersFromDB: PrescriberRecord[] = await findPrescribersInDB({
        medicationName: input.medicationName,
        zipcode: input.zipcode,
        searchRadius: input.searchRadius,
      });

      const formattedResults = prescribersFromDB.map(p => {
        const prescriberName = [p.provider_first_name, p.provider_last_name_legal_name]
                                .filter(Boolean)
                                .join(' ')
                                .trim();
        
        const addressParts = [
            p.practice_address1,
            p.practice_address2,
            p.practice_city,
            p.practice_state,
        ];
        const fullAddress = addressParts.filter(part => part && part.trim() !== '').join(', ').trim();
        
        return {
          prescriberName: prescriberName || "N/A",
          credentials: normalizeCredentials(p.provider_credential_text), 
          specialization: p.healthcare_provider_taxonomy_1_specialization || undefined,
          taxonomyClass: p.taxonomy_class || undefined,
          address: fullAddress || "N/A",
          zipcode: p.practice_zip || "N/A",
          phoneNumber: p.provider_business_practice_location_address_telephone_number || undefined,
          medicationMatch: p.drug || "N/A", 
          confidenceScore: Math.min( (p.claims || 0) * 5, 100), 
          distance: p.distance_miles != null ? parseFloat(p.distance_miles.toFixed(1)) : undefined,
        };
      });
      
      const searchDescription = `within ${input.searchRadius} miles of zipcode ${input.zipcode}`;
      
      if (formattedResults.length === 0) {
        return { 
            results: [], 
            message: `No prescribers found for "${input.medicationName}" ${searchDescription}. Please check your spelling or try a different search. Ensure your database function 'public.calculate_distance' is working correctly and the underlying tables (npi_prescriptions, npi_addresses, npi_details, npi_addresses_usps) contain relevant data.`
        };
      }

      return { results: formattedResults, message: `Found ${formattedResults.length} prescriber(s) for "${input.medicationName}" ${searchDescription}.` };
    } catch (error) {
      console.error("Error in searchPrescribersFlow:", error);
      let errorMessage = "An unexpected error occurred while searching for prescribers.";
      if (error instanceof Error) {
        errorMessage = `Flow Error: ${error.message}`; 
      }
      return { results: [], message: errorMessage };
    }
  }
);

// Explicitly type the output of the wrapper to match the flow's outputSchema
export async function findPrescribers(input: PrescriberSearchInput): Promise<{ results: z.infer<typeof PrescriberSchema>[], message?: string }> {
  return searchPrescribersFlow(input);
}
