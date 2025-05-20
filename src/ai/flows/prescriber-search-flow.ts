
'use server';
/**
 * @fileOverview A Genkit flow to search for prescribers based on medication and zipcode.
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
  zipcode: z.string().min(5).max(10).describe('The 5-digit or 9-digit ZIP code to search within.'),
});
export type PrescriberSearchInput = z.infer<typeof PrescriberSearchInputSchema>;

const PrescriberSchema = z.object({
  prescriberName: z.string().describe("The name of the prescriber."),
  address: z.string().describe("The full address of the prescriber."),
  zipcode: z.string().describe("The prescriber's zipcode."),
  medicationMatch: z.string().describe("The name of the medication that matched the search."),
});

const PrescriberSearchOutputSchema = z.object({
  results: z.array(PrescriberSchema).describe('A list of prescribers matching the criteria.'),
  message: z.string().optional().describe('An optional message, e.g., if no results are found.'),
});
export type PrescriberSearchOutput = z.infer<typeof PrescriberSearchOutputSchema>;


// This flow doesn't use an LLM prompt directly for generation,
// but rather orchestrates the call to the database service.
// It's defined as a flow for structural consistency within Genkit-powered features.
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
      });

      const formattedResults = prescribersFromDB.map(p => ({
        prescriberName: p.prescriber_name,
        address: p.prescriber_address,
        zipcode: p.prescriber_zipcode,
        medicationMatch: p.medication_name_match,
      }));

      if (formattedResults.length === 0) {
        return { results: [], message: `No prescribers found for "${input.medicationName}" in zipcode ${input.zipcode}. Please check your spelling or try a different search. Ensure your database contains the necessary tables (npi_prescriptions, npi_addresses, npi_details), that they are correctly linked by NPI, and contain the relevant data.` };
      }

      return { results: formattedResults };
    } catch (error) {
      console.error("Error in searchPrescribersFlow:", error);
      let errorMessage = "An unexpected error occurred while searching for prescribers.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      // Ensure the output matches the schema even on error
      return { results: [], message: errorMessage };
    }
  }
);

// Exported wrapper function
export async function findPrescribers(input: PrescriberSearchInput): Promise<PrescriberSearchOutput> {
  return searchPrescribersFlow(input);
}
