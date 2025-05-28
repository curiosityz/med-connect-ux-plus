
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
  zipcode: z.string().length(5).describe('The 5-digit ZIP code to search around.'),
  searchRadius: z.number().positive().describe("The search radius in miles from the zipcode's center."),
});
export type PrescriberSearchInput = z.infer<typeof PrescriberSearchInputSchema>;

const PrescriberSchema = z.object({
  prescriberName: z.string().describe("The name of the prescriber."),
  credentials: z.string().optional().describe("The prescriber's credentials (e.g., MD, DDS)."), // Will be undefined if not provided by SQL function
  specialization: z.string().optional().describe("The prescriber's specialization."), // Will be undefined if not provided by SQL function
  address: z.string().describe("The full address of the prescriber."),
  zipcode: z.string().describe("The prescriber's zipcode."),
  phoneNumber: z.string().optional().describe("The prescriber's phone number."), // Will be undefined if not provided by SQL function
  medicationMatch: z.string().describe("The name of the medication that matched the search."),
  distance: z.number().describe("The distance in miles from the searched zipcode's center."),
  confidenceScore: z.number().min(0).max(100).describe("A confidence score based on claim count (0-100)."),
});

const PrescriberSearchOutputSchema = z.object({
  results: z.array(PrescriberSchema).describe('A list of prescribers matching the criteria.'),
  message: z.string().optional().describe('An optional message, e.g., if no results are found or details about the search performed.'),
});
export type PrescriberSearchOutput = z.infer<typeof PrescriberSearchOutputSchema>;

// Credentials normalization is kept here in case it's sourced from somewhere else in the future,
// but currently, the SQL function doesn't return raw credentials for this flow to normalize.
const normalizeCredentials = (credentials?: string): string | undefined => {
  if (!credentials) return undefined;
  return credentials
    .replace(/\./g, '') // Remove periods: M.D. -> MD
    .replace(/\s+/g, '') // Remove spaces: M D -> MD
    .toUpperCase();     // Convert to uppercase: md -> MD
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
        searchRadius: input.searchRadius,
      });

      const formattedResults = prescribersFromDB.map(p => {
        const prescriberName = [p.provider_first_name, p.provider_last_name_legal_name]
                                .filter(Boolean) // Remove null or empty parts
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
          // Credentials, specialization, phone number are not directly returned by the user's SQL function
          // If they were, they'd be mapped here. For now, they'll be undefined.
          // Example: credentials: normalizeCredentials(p.some_credential_field_from_sql_function), 
          credentials: undefined, // Placeholder as SQL function doesn't return it
          specialization: undefined, // Placeholder
          address: fullAddress || "N/A",
          zipcode: p.practice_zip || "N/A",
          phoneNumber: undefined, // Placeholder
          medicationMatch: p.drug || "N/A",
          distance: p.distance_miles !== null ? parseFloat(p.distance_miles.toFixed(1)) : 0,
          confidenceScore: Math.min( (p.claims || 0) * 5, 100), 
        };
      });

      let searchDescription = `within ${input.searchRadius} miles of zipcode ${input.zipcode}`;
      
      if (formattedResults.length === 0) {
        return { 
            results: [], 
            message: `No prescribers found for "${input.medicationName}" ${searchDescription} using the 'find_prescribers_near_zip' database function. This could mean no matches were found by the function, or the function encountered an issue. Please check the database function's logic and data.`
        };
      }

      return { results: formattedResults, message: `Found ${formattedResults.length} prescriber(s) for "${input.medicationName}" ${searchDescription} using the 'find_prescribers_near_zip' database function.` };
    } catch (error) {
      console.error("Error in searchPrescribersFlow (calling find_prescribers_near_zip):", error);
      let errorMessage = "An unexpected error occurred while searching for prescribers using the database function.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      // Ensure the error message from databaseService (if any) is propagated
      return { results: [], message: errorMessage.startsWith("Database query failed") ? errorMessage : `Flow Error: ${errorMessage}` };
    }
  }
);

export async function findPrescribers(input: PrescriberSearchInput): Promise<PrescriberSearchOutput> {
  return searchPrescribersFlow(input);
}
