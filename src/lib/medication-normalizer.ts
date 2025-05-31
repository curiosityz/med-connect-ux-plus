
export interface MedicationNormalizationEntry {
  canonicalGenericName: string;
  commonBrandNames: string[];
  searchableVariations: string[];
}

const normalizationData: MedicationNormalizationEntry[] = [
  { canonicalGenericName: "Levothyroxine Sodium", commonBrandNames: ["Synthroid", "Levoxyl", "Euthyrox"], searchableVariations: ["Levothyroxin", "L-thyroxine", "T4", "Thyroid hormone"] },
  { canonicalGenericName: "Atorvastatin Calcium", commonBrandNames: ["Lipitor"], searchableVariations: ["Atorvastatin", "Statin", "Cholesterol medication"] },
  { canonicalGenericName: "Lisinopril", commonBrandNames: ["Zestril", "Prinivil"], searchableVariations: ["Lisinopryl", "ACE inhibitor", "Blood pressure medication"] },
  { canonicalGenericName: "Metformin Hydrochloride", commonBrandNames: ["Glucophage", "Fortamet", "Riomet"], searchableVariations: ["Metformin", "Diabetes medication", "Blood sugar medication"] },
  { canonicalGenericName: "Amlodipine Besylate", commonBrandNames: ["Norvasc"], searchableVariations: ["Amlodipin", "Calcium channel blocker"] },
  { canonicalGenericName: "Metoprolol Succinate", commonBrandNames: ["Toprol XL"], searchableVariations: ["Metoprolol (extended release)", "Beta blocker"] },
  { canonicalGenericName: "Metoprolol Tartrate", commonBrandNames: ["Lopressor"], searchableVariations: ["Metoprolol (immediate release)", "Beta blocker"] },
  { canonicalGenericName: "Albuterol Sulfate", commonBrandNames: ["Ventolin HFA", "ProAir HFA", "Proventil HFA"], searchableVariations: ["Salbutamol", "Asthma inhaler", "Rescue inhaler"] },
  { canonicalGenericName: "Omeprazole", commonBrandNames: ["Prilosec"], searchableVariations: ["Omeprazol", "PPI", "Proton pump inhibitor", "Acid reflux", "Heartburn"] },
  { canonicalGenericName: "Losartan Potassium", commonBrandNames: ["Cozaar"], searchableVariations: ["Losartan", "ARB", "Angiotensin II receptor blocker"] },
  { canonicalGenericName: "Simvastatin", commonBrandNames: ["Zocor"], searchableVariations: ["Statin", "Cholesterol medication"] },
  { canonicalGenericName: "Gabapentin", commonBrandNames: ["Neurontin", "Gralise"], searchableVariations: ["Gabapentinum", "Nerve pain", "Anti-seizure"] },
  { canonicalGenericName: "Hydrochlorothiazide", commonBrandNames: ["Microzide", "Oretic"], searchableVariations: ["HCTZ", "Diuretic", "Water pill"] },
  { canonicalGenericName: "Sertraline Hydrochloride", commonBrandNames: ["Zoloft"], searchableVariations: ["Sertralin", "SSRI", "Antidepressant"] },
  { canonicalGenericName: "Acetaminophen", commonBrandNames: ["Tylenol"], searchableVariations: ["Paracetamol", "APAP", "Pain reliever", "Fever reducer"] },
  { canonicalGenericName: "Ibuprofen", commonBrandNames: ["Advil", "Motrin"], searchableVariations: ["NSAID", "Non-steroidal anti-inflammatory", "Pain reliever", "Anti-inflammatory"] },
  { canonicalGenericName: "Amoxicillin", commonBrandNames: ["Amoxil", "Moxatag"], searchableVariations: ["Amoxycillin", "Penicillin antibiotic"] },
  { canonicalGenericName: "Azithromycin", commonBrandNames: ["Zithromax", "Z-Pak"], searchableVariations: ["Azithromycn", "Macrolide antibiotic"] },
  { canonicalGenericName: "Alprazolam", commonBrandNames: ["Xanax"], searchableVariations: ["Benzodiazepine", "Anti-anxiety"] },
  { canonicalGenericName: "Amphetamine/Dextroamphetamine Salts", commonBrandNames: ["Adderall", "Mydayis"], searchableVariations: ["Amphetamine salts", "Mixed amphetamine salts", "Dextroamphetamine", "ADHD medication", "Stimulant"] },
  { canonicalGenericName: "Rosuvastatin Calcium", commonBrandNames: ["Crestor"], searchableVariations: ["Rosuvastatin", "Statin", "Cholesterol medication"] },
  { canonicalGenericName: "Pantoprazole Sodium", commonBrandNames: ["Protonix"], searchableVariations: ["Pantoprazol", "PPI", "Proton pump inhibitor", "Acid reflux"] },
  { canonicalGenericName: "Prednisone", commonBrandNames: ["Deltasone", "Rayos"], searchableVariations: ["Corticosteroid", "Steroid", "Anti-inflammatory"] },
];

// Build a reverse lookup: searchTerm (lowercase) -> Set<canonicalGenericName>
const reverseLookupMap = new Map<string, Set<string>>();

normalizationData.forEach(entry => {
  const termsToMap = [
    entry.canonicalGenericName.toLowerCase(), // Also allow searching by canonical name itself
    ...entry.commonBrandNames.map(name => name.toLowerCase()),
    ...entry.searchableVariations.map(variation => variation.toLowerCase()),
  ];
  termsToMap.forEach(term => {
    if (term) { // Ensure term is not empty or null
      const trimmedTerm = term.trim();
      if (trimmedTerm.length > 0) {
        if (!reverseLookupMap.has(trimmedTerm)) {
          reverseLookupMap.set(trimmedTerm, new Set());
        }
        reverseLookupMap.get(trimmedTerm)!.add(entry.canonicalGenericName);
      }
    }
  });
});

function getCanonicalNamesForSearchTerm(searchTerm: string): Set<string> {
  const lowerSearchTerm = searchTerm.toLowerCase().trim();
  // If the term is not in the map, return it as-is in a Set
  return reverseLookupMap.get(lowerSearchTerm) || new Set([searchTerm.trim()].filter(t => t.length > 0));
}

export function normalizeMedicationSearchTerms(searchTerms: string[]): string[] {
  const allCanonicalNames = new Set<string>();
  searchTerms.forEach(term => {
    const trimmedTerm = term.trim();
    if (trimmedTerm.length > 0) {
      const canonicals = getCanonicalNamesForSearchTerm(trimmedTerm);
      canonicals.forEach(canonicalName => {
        if (canonicalName.length > 0) { // Ensure canonical name is not empty
            allCanonicalNames.add(canonicalName);
        }
      });
    }
  });
  // Convert Set to array and filter out any potential empty strings again, just in case.
  return Array.from(allCanonicalNames).filter(name => name.length > 0);
}
