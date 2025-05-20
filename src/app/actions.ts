
"use server";

import { findPrescribers, type PrescriberSearchInput, type PrescriberSearchOutput } from '@/ai/flows/prescriber-search-flow';

export async function findPrescribersAction(input: PrescriberSearchInput): Promise<PrescriberSearchOutput> {
  // Basic validation, more complex validation can be in the Zod schema of the flow
  if (!input.medicationName || !input.zipcode || !input.searchRadius) {
    return { results: [], message: "Medication name, zipcode, and search radius are required." };
  }
  if (input.zipcode.length !== 5 || !/^\d{5}$/.test(input.zipcode)) {
     return { results: [], message: "Zipcode must be exactly 5 digits for radius search." };
  }
  if (input.searchRadius <= 0) {
    return { results: [], message: "Search radius must be a positive number." };
  }

  try {
    const result = await findPrescribers(input);
    return result;
  } catch (error: any) {
    console.error("Error in findPrescribersAction:", error);
    return { results: [], message: error.message || "An error occurred while searching for prescribers." };
  }
}
