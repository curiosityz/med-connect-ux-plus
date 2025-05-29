
'use server';
/**
 * @fileOverview A Genkit flow to search for prescribers based on medication(s), zipcode, and search radius.
 *
 * - findPrescribers - The main async function to call the flow.
 * - PrescriberSearchInput - Input type for the flow.
 * - PrescriberSearchOutput - Output type for the flow, used by the action.
 */

import {ai} from '@/ai/genkit';
import { findPrescribersInDB, type PrescriberRecord } from '@/services/databaseService';
import { z } from 'genkit'; // Use z from genkit

const PrescriberSearchInputSchema = z.object({
  medicationNames: z.array(z.string().trim().min(1)).min(1).describe('An array of medication names to search for.'),
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
  matchedMedications: z.array(z.string()).describe("The names of the medications from the search query that matched."), // Changed
  confidenceScore: z.number().min(0).max(100).describe("A confidence score based on claim count (0-100)."),
  distance: z.number().optional().describe("Approximate distance in miles from the searched zipcode center."),
});

// Define the output type for the flow, which will be used by the action
export interface PrescriberSearchOutput {
  results: z.infer<typeof PrescriberSchema>[];
  message?: string;
}


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
    outputSchema: z.object({ // This schema matches PrescriberSearchOutput
        results: z.array(PrescriberSchema),
        message: z.string().optional(),
    }),
  },
  async (input: PrescriberSearchInput): Promise<PrescriberSearchOutput> => {
    try {
      const prescribersFromDB: PrescriberRecord[] = await findPrescribersInDB({
        medicationNames: input.medicationNames,
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

        // Ensure matched_medications is an array, even if null/undefined from DB
        const matchedMedsArray = Array.isArray(p.matched_medications) ? p.matched_medications : [];

        return {
          prescriberName: prescriberName || "N/A",
          credentials: normalizeCredentials(p.provider_credential_text),
          specialization: p.healthcare_provider_taxonomy_1_specialization || undefined,
          taxonomyClass: p.taxonomy_class || undefined,
          address: fullAddress || "N/A",
          zipcode: p.practice_zip || "N/A",
          phoneNumber: p.provider_business_practice_location_address_telephone_number || undefined,
          matchedMedications: matchedMedsArray, // Use the processed array
          confidenceScore: Math.min( (p.total_claims_for_matched_meds || 0) * 5, 100), // Based on sum of claims for matched meds
          distance: p.distance_miles != null ? parseFloat(p.distance_miles.toFixed(1)) : undefined,
        };
      });

      const searchMedicationsString = input.medicationNames.join(', ');
      const searchDescription = `for "${searchMedicationsString}" within ${input.searchRadius} miles of zipcode ${input.zipcode}`;

      if (formattedResults.length === 0) {
        return {
            results: [],
            message: `No prescribers found who prescribed ALL of the medications ${searchDescription}. Please check your spelling or try a different search. Ensure your database and 'public.calculate_distance' function are working correctly.`
        };
      }

      return { results: formattedResults, message: `Found ${formattedResults.length} prescriber(s) matching ALL medications ${searchDescription}.` };
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

export async function findPrescribers(input: PrescriberSearchInput): Promise<PrescriberSearchOutput> {
  return searchPrescribersFlow(input);
}

    