
"use server";

import { findPrescribers, type PrescriberSearchInput, type PrescriberSearchOutput } from '@/ai/flows/prescriber-search-flow';

export async function findPrescribersAction(input: PrescriberSearchInput): Promise<PrescriberSearchOutput> {
  // Basic validation, more complex validation can be in the Zod schema of the flow
  if (!input.medicationName || !input.zipcode) {
    return { results: [], message: "Medication name and zipcode are required." };
  }
  try {
    const result = await findPrescribers(input);
    return result;
  } catch (error: any) {
    console.error("Error in findPrescribersAction:", error);
    return { results: [], message: error.message || "An error occurred while searching for prescribers." };
  }
}
