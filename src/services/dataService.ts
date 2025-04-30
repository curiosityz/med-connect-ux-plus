import { supabase, Provider, Medication, ProviderMedication, ArkansasProvider, NpiProviderDetail } from '@/lib/supabase';

export async function getProviders(): Promise<Provider[]> {
  const { data, error } = await supabase
    .from('providers')
    .select('*, npi_provider_detail:npi_providers(*)')
    .order('name');
    
  if (error) {
    console.error('Error fetching providers:', error);
    return [];
  }
  
  return data || [];
}

export async function getProviderById(id: string): Promise<Provider | null> {
  const { data, error } = await supabase
    .from('providers')
    .select('*, npi_provider_detail:npi_providers(*)')
    .eq('id', id)
    .single();
    
  if (error) {
    console.error(`Error fetching provider with ID ${id}:`, error);
    return null;
  }
  
  return data;
}

export async function getMedications(): Promise<Medication[]> {
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .order('name');
    
  if (error) {
    console.error('Error fetching medications:', error);
    return [];
  }
  
  return data || [];
}

export async function getMedicationById(id: string): Promise<Medication | null> {
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) {
    console.error(`Error fetching medication with ID ${id}:`, error);
    return null;
  }
  
  return data;
}

export async function getProvidersByMedication(medicationId: string): Promise<Provider[]> {
  const { data, error } = await supabase
    .from('provider_medications')
    .select('provider_id')
    .eq('medication_id', medicationId);
    
  if (error) {
    console.error(`Error fetching provider IDs for medication ${medicationId}:`, error);
    return [];
  }
  
  if (!data || data.length === 0) {
    return [];
  }
  
  const providerIds = data.map(item => item.provider_id);
  
  const { data: providers, error: providersError } = await supabase
    .from('providers')
    .select('*, npi_provider_detail:npi_providers(*)')
    .in('id', providerIds)
    .order('name');
    
  if (providersError) {
    console.error('Error fetching providers by IDs:', providersError);
    return [];
  }
  
  return providers || [];
}

export async function getMedicationsByProvider(providerId: string): Promise<Medication[]> {
  const { data, error } = await supabase
    .from('provider_medications')
    .select('medication_id')
    .eq('provider_id', providerId);
    
  if (error) {
    console.error(`Error fetching medication IDs for provider ${providerId}:`, error);
    return [];
  }
  
  if (!data || data.length === 0) {
    return [];
  }
  
  const medicationIds = data.map(item => item.medication_id);
  
  const { data: medications, error: medicationsError } = await supabase
    .from('medications')
    .select('*')
    .in('id', medicationIds)
    .order('name');
    
  if (medicationsError) {
    console.error('Error fetching medications by IDs:', medicationsError);
    return [];
  }
  
  return medications || [];
}

export async function searchProviders(query: string): Promise<Provider[]> {
  const { data, error } = await supabase
    .from('providers')
    .select('*, npi_provider_detail:npi_providers(*)')
    .or(`name.ilike.%${query}%, specialties.cs.{${query}}`)
    .order('name');
    
  if (error) {
    console.error('Error searching providers:', error);
    return [];
  }
  
  return data || [];
}

export async function searchMedications(query: string): Promise<Medication[]> {
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .or(`name.ilike.%${query}%, generic_name.ilike.%${query}%, category.ilike.%${query}%`)
    .order('name');
    
  if (error) {
    console.error('Error searching medications:', error);
    return [];
  }
  
  return data || [];
}

// New functions for Arkansas data
export async function getArkansasProviders(limit = 50, offset = 0): Promise<ArkansasProvider[]> {
  const { data, error } = await supabase
    .from('arkansas_providers')
    .select('*')
    .range(offset, offset + limit - 1)
    .order('prscrbr_last_org_name');
    
  if (error) {
    console.error('Error fetching Arkansas providers:', error);
    return [];
  }
  
  return data || [];
}

export async function getArkansasProviderByNpi(npi: string): Promise<ArkansasProvider | null> {
  const { data, error } = await supabase
    .from('arkansas_providers')
    .select('*')
    .eq('prscrbr_npi', npi)
    .single();
    
  if (error) {
    console.error(`Error fetching Arkansas provider with NPI ${npi}:`, error);
    return null;
  }
  
  return data;
}

export async function getNpiDetailByNpi(npi: string): Promise<NpiProviderDetail | null> {
  const { data, error } = await supabase
    .from('npi_providers')
    .select('*')
    .eq('npi', npi)
    .single();
    
  if (error) {
    console.error(`Error fetching NPI details with NPI ${npi}:`, error);
    return null;
  }
  
  return data;
}

export async function getArkansasProviderWithDetails(npi: string): Promise<{provider: ArkansasProvider | null, details: NpiProviderDetail | null}> {
  const provider = await getArkansasProviderByNpi(npi);
  const details = await getNpiDetailByNpi(npi);
  
  return { provider, details };
}

export async function searchArkansasProviders(query: string): Promise<ArkansasProvider[]> {
  // Clean and prepare the search query
  const cleanedQuery = query.trim().toLowerCase();
  
  // Log the search query for debugging
  console.log(`Searching Arkansas providers for: "${cleanedQuery}"`);
  
  const { data, error } = await supabase
    .from('arkansas_providers')
    .select('*')
    .or(`prscrbr_last_org_name.ilike.%${cleanedQuery}%, prscrbr_first_name.ilike.%${cleanedQuery}%, prscrbr_city.ilike.%${cleanedQuery}%, brnd_name.ilike.%${cleanedQuery}%, gnrc_name.ilike.%${cleanedQuery}%`)
    .order('tot_clms', { ascending: false })
    .limit(100);
    
  if (error) {
    console.error('Error searching Arkansas providers:', error);
    return [];
  }
  
  console.log(`Found ${data?.length || 0} results for "${cleanedQuery}"`);
  return data || [];
}

export async function getProvidersForMedication(brandName: string, genericName: string): Promise<ArkansasProvider[]> {
  const { data, error } = await supabase
    .from('arkansas_providers')
    .select('*')
    .or(`brnd_name.ilike.%${brandName}%, gnrc_name.ilike.%${genericName}%`)
    .order('tot_clms', { ascending: false })
    .limit(50);
    
  if (error) {
    console.error(`Error fetching providers for medication ${brandName}/${genericName}:`, error);
    return [];
  }
  
  return data || [];
}

// Helper function to seed initial data (for development only)
export async function seedInitialData() {
  const { error: providerError } = await supabase
    .from('providers')
    .insert([
      {
        id: 'prov-1',
        npi: '1234567890',
        name: 'Dr. Sarah Chen',
        first_name: 'Sarah',
        last_name: 'Chen',
        title: 'Psychiatrist',
        specialties: ['Anxiety', 'Depression', 'ADHD'],
        location: 'San Francisco, CA',
        city: 'San Francisco',
        state: 'CA',
        rating: 4.9,
        review_count: 124,
        availability: 'Available this week',
        bio: 'Dr. Chen specializes in medication management for various mental health conditions. She has over 10 years of experience and focuses on personalized care for each patient.'
      },
      // Add more providers from your mockData here
    ]);
  
  if (providerError) {
    console.error('Error seeding providers:', providerError);
  }
  
  const { error: medicationError } = await supabase
    .from('medications')
    .insert([
      {
        id: 'med-1',
        name: 'Sertraline',
        generic_name: 'Sertraline HCl',
        category: 'Antidepressant',
        description: 'Selective serotonin reuptake inhibitor (SSRI) commonly prescribed for depression, anxiety disorders, and OCD.',
        provider_count: 12
      },
      // Add more medications from your mockData here
    ]);
    
  if (medicationError) {
    console.error('Error seeding medications:', medicationError);
  }
  
  const { error: relationError } = await supabase
    .from('provider_medications')
    .insert([
      { provider_id: 'prov-1', medication_id: 'med-1' },
      { provider_id: 'prov-1', medication_id: 'med-2' },
      { provider_id: 'prov-1', medication_id: 'med-6' },
      // Add more relationships from your mockData here
    ]);
    
  if (relationError) {
    console.error('Error seeding provider-medication relationships:', relationError);
  }
}
