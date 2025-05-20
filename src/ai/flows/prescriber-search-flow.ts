
'use server';
/**
 * @fileOverview A Genkit flow to search for prescribers based on medication, zipcode, and search radius.
 *
 * - findPrescribers - The main async function to call the flow.
 * - PrescriberSearchInput - Input type for the flow.
 * - PrescriberSearchOutput - Output type for the flow.
 */

import { ai } from '@/ai/genkit';
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
  credentials: z.string().optional().describe("The prescriber's credentials (e.g., MD, DDS)."),
  specialization: z.string().optional().describe("The prescriber's specialization."),
  address: z.string().describe("The full address of the prescriber."),
  zipcode: z.string().describe("The prescriber's zipcode."),
  phoneNumber: z.string().optional().describe("The prescriber's phone number."),
  medicationMatch: z.string().describe("The name of the medication that matched the search."),
  distance: z.number().describe("The distance in miles from the searched zipcode's center."),
  confidenceScore: z.number().min(0).max(100).describe("A confidence score based on claim count (0-100)."),
});

const PrescriberSearchOutputSchema = z.object({
  results: z.array(PrescriberSchema).describe('A list of prescribers matching the criteria.'),
  message: z.string().optional().describe('An optional message, e.g., if no results are found or details about the search performed.'),
});
export type PrescriberSearchOutput = z.infer<typeof PrescriberSearchOutputSchema>;

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

      const formattedResults = prescribersFromDB.map(p => ({
        prescriberName: p.prescriber_name,
        credentials: normalizeCredentials(p.credentials),
        specialization: p.specialization, // Specialization is often a phrase, less straightforward to normalize simply
        address: p.prescriber_address,
        zipcode: p.prescriber_zipcode,
        phoneNumber: p.phone_number,
        medicationMatch: p.medication_name_match,
        distance: parseFloat(p.distance.toFixed(1)), // Round to 1 decimal place
        confidenceScore: Math.min( (p.total_claim_count || 0) * 5, 100), // Updated: 20 claims = 100%
      }));

      let searchDescription = `within ${input.searchRadius} miles of zipcode ${input.zipcode}`;
      
      if (formattedResults.length === 0) {
        return { 
            results: [], 
            message: `No prescribers found for "${input.medicationName}" ${searchDescription}. This could be due to no matches, the input zipcode not being found in our location data, or no prescribers having valid geocoded addresses. Please ensure your database contains the 'npi_addresses_usps' table with zipcode coordinates and that the 'calculate_distance' SQL function is defined.`
        };
      }

      return { results: formattedResults, message: `Found ${formattedResults.length} prescriber(s) for "${input.medicationName}" ${searchDescription}.` };
    } catch (error) {
      console.error("Error in searchPrescribersFlow:", error);
      let errorMessage = "An unexpected error occurred while searching for prescribers.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return { results: [], message: errorMessage };
    }
  }
);

export async function findPrescribers(input: PrescriberSearchInput): Promise<PrescriberSearchOutput> {
  return searchPrescribersFlow(input);
}

