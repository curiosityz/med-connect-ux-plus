
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getProviders,
  getProviderById,
  getMedications,
  getMedicationById,
  getProvidersByMedication,
  getMedicationsByProvider,
  searchProviders, 
  searchMedications
} from '@/services/dataService';

export function useProviders() {
  return useQuery({
    queryKey: ['providers'],
    queryFn: getProviders
  });
}

export function useProvider(id: string | undefined) {
  return useQuery({
    queryKey: ['provider', id],
    queryFn: () => id ? getProviderById(id) : null,
    enabled: !!id
  });
}

export function useMedications() {
  return useQuery({
    queryKey: ['medications'],
    queryFn: getMedications
  });
}

export function useMedication(id: string | undefined) {
  return useQuery({
    queryKey: ['medication', id],
    queryFn: () => id ? getMedicationById(id) : null,
    enabled: !!id
  });
}

export function useProvidersByMedication(medicationId: string | undefined) {
  return useQuery({
    queryKey: ['providers', 'medication', medicationId],
    queryFn: () => medicationId ? getProvidersByMedication(medicationId) : [],
    enabled: !!medicationId
  });
}

export function useMedicationsByProvider(providerId: string | undefined) {
  return useQuery({
    queryKey: ['medications', 'provider', providerId],
    queryFn: () => providerId ? getMedicationsByProvider(providerId) : [],
    enabled: !!providerId
  });
}

export function useSearchProviders(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['providers', 'search', query],
    queryFn: () => searchProviders(query),
    enabled: enabled && query.length >= 2
  });
}

export function useSearchMedications(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['medications', 'search', query],
    queryFn: () => searchMedications(query),
    enabled: enabled && query.length >= 2
  });
}
