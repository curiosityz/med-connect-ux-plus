
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getProviders,
  getProviderById,
  getMedications,
  getMedicationById,
  getProvidersByMedication,
  getMedicationsByProvider,
  searchProviders, 
  searchMedications,
  getArkansasProviders,
  getArkansasProviderByNpi,
  getNpiDetailByNpi,
  getArkansasProviderWithDetails,
  searchArkansasProviders,
  getProvidersForMedication,
  getNpiDetails,
  getNpiDetailsByNpi,
  getNpiAddressByNpi,
  getNpiPrescriptionsByNpi,
  getNpiPrescriptionsByDrug,
  getNpiPrescriptionsByGeneric,
  searchNpiPrescriptions,
  getComprehensiveProviderData
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

export function useArkansasProviders(limit = 50, offset = 0) {
  return useQuery({
    queryKey: ['arkansas_providers', limit, offset],
    queryFn: () => getArkansasProviders(limit, offset)
  });
}

export function useArkansasProvider(npi: string | undefined) {
  return useQuery({
    queryKey: ['arkansas_provider', npi],
    queryFn: () => npi ? getArkansasProviderByNpi(npi) : null,
    enabled: !!npi
  });
}

export function useNpiDetails(npi: string | undefined) {
  return useQuery({
    queryKey: ['npi_details', npi],
    queryFn: () => npi ? getNpiDetailByNpi(npi) : null,
    enabled: !!npi
  });
}

export function useArkansasProviderWithDetails(npi: string | undefined) {
  return useQuery({
    queryKey: ['arkansas_provider_with_details', npi],
    queryFn: () => npi ? getArkansasProviderWithDetails(npi) : { provider: null, details: null },
    enabled: !!npi
  });
}

export function useSearchArkansasProviders(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['arkansas_providers', 'search', query],
    queryFn: () => searchArkansasProviders(query),
    enabled: enabled && query.length >= 2
  });
}

export function useProvidersForMedication(brandName: string, genericName: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['arkansas_providers', 'medication', brandName, genericName],
    queryFn: () => getProvidersForMedication(brandName, genericName),
    enabled: enabled && (brandName.length > 0 || genericName.length > 0)
  });
}

// New hooks for the additional NPI data

export function useNpiDetailsList(limit = 50, offset = 0) {
  return useQuery({
    queryKey: ['npi_details_list', limit, offset],
    queryFn: () => getNpiDetails(limit, offset)
  });
}

export function useNpiDetailsByNpi(npi: string | undefined) {
  return useQuery({
    queryKey: ['npi_details_by_npi', npi],
    queryFn: () => npi ? getNpiDetailsByNpi(npi) : null,
    enabled: !!npi
  });
}

export function useNpiAddressByNpi(npi: string | undefined) {
  return useQuery({
    queryKey: ['npi_address', npi],
    queryFn: () => npi ? getNpiAddressByNpi(npi) : null,
    enabled: !!npi
  });
}

export function useNpiPrescriptionsByNpi(npi: string | undefined) {
  return useQuery({
    queryKey: ['npi_prescriptions', 'by_npi', npi],
    queryFn: () => npi ? getNpiPrescriptionsByNpi(npi) : [],
    enabled: !!npi
  });
}

export function useNpiPrescriptionsByDrug(drugName: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['npi_prescriptions', 'by_drug', drugName],
    queryFn: () => getNpiPrescriptionsByDrug(drugName),
    enabled: enabled && drugName.length >= 2
  });
}

export function useNpiPrescriptionsByGeneric(genericName: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['npi_prescriptions', 'by_generic', genericName],
    queryFn: () => getNpiPrescriptionsByGeneric(genericName),
    enabled: enabled && genericName.length >= 2
  });
}

export function useSearchNpiPrescriptions(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['npi_prescriptions', 'search', query],
    queryFn: () => searchNpiPrescriptions(query),
    enabled: enabled && query.length >= 2
  });
}

export function useComprehensiveProviderData(npi: string | undefined) {
  return useQuery({
    queryKey: ['comprehensive_provider_data', npi],
    queryFn: () => npi ? getComprehensiveProviderData(npi) : { npiDetail: null, npiAddress: null, npiPrescriptions: [] },
    enabled: !!npi
  });
}
