
'use server';
/**
 * @fileOverview A Genkit flow to search for prescribers based on medication, zipcode, and search area type.
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
  zipcode: z.string().length(5).describe('The 5-digit ZIP code to search within or derive a prefix from.'),
  searchAreaType: z.enum(['exact', 'prefix3']).describe("The type of area search: 'exact' for the specific zipcode, 'prefix3' for areas starting with the first 3 digits of the zipcode."),
});
export type PrescriberSearchInput = z.infer<typeof PrescriberSearchInputSchema>;

const PrescriberSchema = z.object({
  prescriberName: z.string().describe("The name of the prescriber."),
  credentials: z.string().optional().describe("The prescriber's credentials (e.g., MD, DDS)."),
  specialization: z.string().optional().describe("The prescriber's specialization."),
  address: z.string().describe("The full address of the prescriber."),
  zipcode: z.string().describe("The prescriber's zipcode."),
  phoneNumber: z.string().optional().describe("The prescriber's phone number."),
  medicationMatch: z.string().describe("The name of the medication that matched the search."),
  confidenceScore: z.number().min(0).max(100).describe("A confidence score based on claim count (0-100)."),
});
export type PrescriberSearchOutput = z.infer<typeof PrescriberSearchOutputSchema>;

const normalizeCredentials = (credentials?: string): string | undefined => {
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
    outputSchema: PrescriberSearchOutputSchema,
  },
  async (input: PrescriberSearchInput): Promise<PrescriberSearchOutput> => {
    try {
      const prescribersFromDB: PrescriberRecord[] = await findPrescribersInDB({
        medicationName: input.medicationName,
        zipcode: input.zipcode,
        searchAreaType: input.searchAreaType,
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
          credentials: normalizeCredentials(p.credentials),
          specialization: p.specialization || undefined,
          address: fullAddress || "N/A",
          zipcode: p.practice_zip || "N/A",
          phoneNumber: p.phone_number || undefined,
          medicationMatch: p.drug_name || "N/A", // Was p.drug
          confidenceScore: Math.min( (p.total_claim_count || 0) * 5, 100), // Was p.claims
        };
      });

      let searchDescription = `in zipcode ${input.zipcode}`;
      if (input.searchAreaType === 'prefix3') {
        searchDescription = `in the area starting with zipcode prefix ${input.zipcode.substring(0,3)}`;
      }
      
      if (formattedResults.length === 0) {
        return { 
            results: [], 
            message: `No prescribers found for "${input.medicationName}" ${searchDescription}. Please check your spelling or try a different search. Ensure your database contains the necessary tables (npi_prescriptions, npi_addresses, npi_details), that they are correctly linked by NPI, and contain the relevant data.`
        };
      }

      return { results: formattedResults, message: `Found ${formattedResults.length} prescriber(s) for "${input.medicationName}" ${searchDescription}.` };
    } catch (error) {
      console.error("Error in searchPrescribersFlow:", error);
      let errorMessage = "An unexpected error occurred while searching for prescribers.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return { results: [], message: `Flow Error: ${errorMessage}` };
    }
  }
);

export async function findPrescribers(input: PrescriberSearchInput): Promise<PrescriberSearchOutput> {
  return searchPrescribersFlow(input);
}
