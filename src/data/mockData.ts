
export interface Medication {
  id: string;
  name: string;
  genericName: string;
  category: string;
  description: string;
  providerCount: number;
}

export interface Provider {
  id: string;
  name: string;
  title: string;
  specialties: string[];
  rating: number;
  reviewCount: number;
  location: string;
  availability: string;
  imageUrl?: string;
  bio?: string;
  medications: string[];
}

export const medications: Medication[] = [
  {
    id: "med-1",
    name: "Sertraline",
    genericName: "Sertraline HCl",
    category: "Antidepressant",
    description: "Selective serotonin reuptake inhibitor (SSRI) commonly prescribed for depression, anxiety disorders, and OCD.",
    providerCount: 12
  },
  {
    id: "med-2",
    name: "Adderall",
    genericName: "Amphetamine/Dextroamphetamine",
    category: "Stimulant",
    description: "Central nervous system stimulant prescribed for ADHD and narcolepsy.",
    providerCount: 8
  },
  {
    id: "med-3",
    name: "Metformin",
    genericName: "Metformin HCl",
    category: "Antidiabetic",
    description: "First-line medication for the treatment of type 2 diabetes, particularly in overweight individuals.",
    providerCount: 15
  },
  {
    id: "med-4",
    name: "Lisinopril",
    genericName: "Lisinopril",
    category: "ACE Inhibitor",
    description: "Used to treat high blood pressure, heart failure, and to improve survival after heart attacks.",
    providerCount: 14
  },
  {
    id: "med-5",
    name: "Levothyroxine",
    genericName: "Levothyroxine Sodium",
    category: "Hormone Replacement",
    description: "Replacement for a hormone normally produced by your thyroid gland to regulate the body's energy and metabolism.",
    providerCount: 10
  },
  {
    id: "med-6",
    name: "Alprazolam",
    genericName: "Alprazolam",
    category: "Benzodiazepine",
    description: "Used to treat anxiety and panic disorders. It is a controlled substance due to risk of dependence.",
    providerCount: 6
  },
];

export const providers: Provider[] = [
  {
    id: "prov-1",
    name: "Dr. Sarah Chen",
    title: "Psychiatrist",
    specialties: ["Anxiety", "Depression", "ADHD"],
    rating: 4.9,
    reviewCount: 124,
    location: "San Francisco, CA",
    availability: "Available this week",
    bio: "Dr. Chen specializes in medication management for various mental health conditions. She has over 10 years of experience and focuses on personalized care for each patient.",
    medications: ["med-1", "med-2", "med-6"]
  },
  {
    id: "prov-2",
    name: "Dr. Michael Rodriguez",
    title: "Endocrinologist",
    specialties: ["Diabetes", "Thyroid Disorders"],
    rating: 4.8,
    reviewCount: 98,
    location: "Los Angeles, CA",
    availability: "Next available: Monday",
    bio: "Dr. Rodriguez is a board-certified endocrinologist who specializes in diabetes management and thyroid disorders. He emphasizes lifestyle changes alongside medication.",
    medications: ["med-3", "med-5"]
  },
  {
    id: "prov-3",
    name: "Dr. James Wilson",
    title: "Cardiologist",
    specialties: ["Hypertension", "Heart Disease"],
    rating: 4.7,
    reviewCount: 112,
    location: "Chicago, IL",
    availability: "Available tomorrow",
    bio: "With 15 years of experience in cardiology, Dr. Wilson specializes in hypertension management and preventive cardiology. He believes in comprehensive heart health.",
    medications: ["med-4"]
  },
  {
    id: "prov-4",
    name: "Dr. Emily Taylor",
    title: "Family Medicine",
    specialties: ["Primary Care", "Diabetes", "Hypertension"],
    rating: 4.6,
    reviewCount: 87,
    location: "New York, NY",
    availability: "Available this week",
    bio: "Dr. Taylor is a family physician with a focus on chronic disease management. She provides comprehensive care for patients with multiple health concerns.",
    medications: ["med-3", "med-4", "med-5"]
  },
  {
    id: "prov-5",
    name: "Dr. Robert Johnson",
    title: "Psychiatrist",
    specialties: ["Depression", "Anxiety", "Bipolar Disorder"],
    rating: 4.8,
    reviewCount: 76,
    location: "Boston, MA",
    availability: "Next available: Thursday",
    bio: "Dr. Johnson specializes in mood disorders and has extensive experience working with patients who have treatment-resistant conditions. He takes a collaborative approach to care.",
    medications: ["med-1", "med-6"]
  },
  {
    id: "prov-6",
    name: "Dr. Lisa Wong",
    title: "Neurologist",
    specialties: ["ADHD", "Sleep Disorders"],
    rating: 4.9,
    reviewCount: 65,
    location: "Seattle, WA", 
    availability: "Limited availability",
    bio: "Dr. Wong is a neurologist with special interest in ADHD and sleep medicine. She focuses on comprehensive neurological assessment and targeted medication management.",
    medications: ["med-2"]
  }
];

export const getProvidersByMedication = (medicationId: string): Provider[] => {
  return providers.filter(provider => 
    provider.medications.includes(medicationId)
  );
};

export const getMedicationById = (id: string): Medication | undefined => {
  return medications.find(med => med.id === id);
};

export const getProviderById = (id: string): Provider | undefined => {
  return providers.find(provider => provider.id === id);
};
