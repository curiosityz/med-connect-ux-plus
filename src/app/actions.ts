
"use server";

import { findPrescribers, type PrescriberSearchInput, type PrescriberSearchOutput } from '@/ai/flows/prescriber-search-flow';

export async function findPrescribersAction(input: PrescriberSearchInput): Promise<PrescriberSearchOutput> {
  if (!input.medicationName || !input.zipcode || !input.searchRadius) {
    return { results: [], message: "Medication name, 5-digit zipcode, and search radius are required." };
  }
  if (input.zipcode.length !== 5 || !/^\d{5}$/.test(input.zipcode)) {
     return { results: [], message: "Zipcode must be exactly 5 digits." };
  }
  if (input.searchRadius <=0) {
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
