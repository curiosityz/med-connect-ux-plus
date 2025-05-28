
"use server";

import { findPrescribers, type PrescriberSearchInput, type PrescriberSearchOutput } from '@/ai/flows/prescriber-search-flow';

export async function findPrescribersAction(input: PrescriberSearchInput): Promise<PrescriberSearchOutput> {
  if (!input.medicationName || !input.zipcode || !input.searchAreaType) {
    return { results: [], message: "Medication name, zipcode, and search area type are required." };
  }
  if (input.zipcode.length !== 5 || !/^\d{5}$/.test(input.zipcode)) {
     return { results: [], message: "Zipcode must be exactly 5 digits." };
  }
  // searchAreaType is validated by its enum type in the Zod schema.

  try {
    const result = await findPrescribers(input);
    return result;
  } catch (error: any) {
    console.error("Error in findPrescribersAction:", error);
    return { results: [], message: error.message || "An error occurred while searching for prescribers." };
  }
}
