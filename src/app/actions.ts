
"use server";

import { findPrescribers, type PrescriberSearchInput, type PrescriberSearchOutput } from '@/ai/flows/prescriber-search-flow';

export async function findPrescribersAction(input: PrescriberSearchInput): Promise<PrescriberSearchOutput> {
  // Basic validation, more complex validation can be in the Zod schema of the flow
  if (!input.medicationName || !input.zipcode || !input.searchAreaType) {
    return { results: [], message: "Medication name, zipcode, and search area type are required." };
  }
  if (input.searchAreaType === "prefix3" && input.zipcode.length < 3) {
     return { results: [], message: "Zipcode must be at least 3 digits for a wider area search." };
  }
  try {
    const result = await findPrescribers(input);
    return result;
  } catch (error: any) {
    console.error("Error in findPrescribersAction:", error);
    return { results: [], message: error.message || "An error occurred while searching for prescribers." };
  }
}
