
"use server";

import { findPrescribers, type PrescriberSearchInput as FlowInputType } from '@/ai/flows/prescriber-search-flow'; // Renamed to FlowInputType to avoid conflict

// This interface is for the data coming from the form/client
export interface ClientPrescriberSearchInput {
  medicationName: string; // This will be the comma-separated string from the UI
  zipcode: string;
  searchRadius: number;
}

// This interface matches the Genkit flow's actual output structure
export interface PrescriberSearchActionOutput {
  results: {
    prescriberName: string;
    credentials?: string;
    specialization?: string;
    taxonomyClass?: string;
    address: string;
    zipcode: string;
    phoneNumber?: string;
    matchedMedications: string[];
    confidenceScore: number;
    distance?: number;
  }[];
  message?: string;
}


export async function findPrescribersAction(input: ClientPrescriberSearchInput): Promise<PrescriberSearchActionOutput> {
  const medicationNamesArray = input.medicationName.split(',')
    .map(name => name.trim())
    .filter(name => name.length > 0);

  if (medicationNamesArray.length === 0) {
    return { results: [], message: "At least one medication name is required." };
  }
  if (!input.zipcode || input.zipcode.length !== 5 || !/^\d{5}$/.test(input.zipcode)) {
     return { results: [], message: "A valid 5-digit zipcode is required." };
  }
  if (input.searchRadius <=0) {
      return { results: [], message: "Search radius must be a positive number." };
  }

  const flowInput: FlowInputType = {
    medicationNames: medicationNamesArray,
    zipcode: input.zipcode,
    searchRadius: input.searchRadius,
  };

  try {
    // The findPrescribers function from the flow is expected to return an object
    // that matches { results: PrescriberResult[], message?: string }
    // which is compatible with PrescriberSearchActionOutput
    const result = await findPrescribers(flowInput);
    return result;
  } catch (error: any) {
    console.error("Error in findPrescribersAction:", error);
    return { results: [], message: error.message || "An error occurred while searching for prescribers." };
  }
}

    