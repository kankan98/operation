import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { opportunitiesApi, type OpportunityFilters } from '@/services/api';
import type {
  OpportunityResearchComparisonRequest,
  OpportunityResearchExportRequest,
  OpportunityResearchListQuery,
  OpportunityResearchUpdate,
  OpportunityResearchUpsert,
} from '@/types';

export function useOpportunities(filters: OpportunityFilters = {}) {
  return useQuery({
    queryKey: ['opportunities', filters],
    queryFn: () => opportunitiesApi.list(filters),
  });
}

export function useProductOpportunity(productId?: string) {
  return useQuery({
    queryKey: ['opportunities', productId],
    queryFn: () => opportunitiesApi.explain(productId!),
    enabled: !!productId,
  });
}

export function useOpportunityResearch(productId?: string) {
  return useQuery({
    queryKey: ['opportunity-research', productId],
    queryFn: () => opportunitiesApi.research(productId!),
    enabled: !!productId,
  });
}

export function useOpportunityResearchList(
  filters: Partial<OpportunityResearchListQuery> = {},
) {
  return useQuery({
    queryKey: ['opportunity-research-list', filters],
    queryFn: () => opportunitiesApi.listResearch(filters),
  });
}

export function useUpsertOpportunityResearch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: string;
      data: OpportunityResearchUpsert;
    }) => opportunitiesApi.upsertResearch(productId, data),
    onSuccess: (_data, variables) => {
      invalidateOpportunityResearch(queryClient, variables.productId);
    },
  });
}

export function useUpdateOpportunityResearch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: string;
      data: OpportunityResearchUpdate;
    }) => opportunitiesApi.updateResearch(productId, data),
    onSuccess: (_data, variables) => {
      invalidateOpportunityResearch(queryClient, variables.productId);
    },
  });
}

export function useArchiveOpportunityResearch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => opportunitiesApi.archiveResearch(productId),
    onSuccess: (_data, productId) => {
      invalidateOpportunityResearch(queryClient, productId);
    },
  });
}

export function useCompareOpportunityResearch() {
  return useMutation({
    mutationFn: (data: OpportunityResearchComparisonRequest) =>
      opportunitiesApi.compareResearch(data),
  });
}

export function useExportOpportunityResearch() {
  return useMutation({
    mutationFn: (data: OpportunityResearchExportRequest) =>
      opportunitiesApi.exportResearch(data),
  });
}

function invalidateOpportunityResearch(
  queryClient: ReturnType<typeof useQueryClient>,
  productId: string,
) {
  void queryClient.invalidateQueries({ queryKey: ['opportunities'] });
  void queryClient.invalidateQueries({ queryKey: ['opportunities', productId] });
  void queryClient.invalidateQueries({ queryKey: ['opportunity-research'] });
  void queryClient.invalidateQueries({ queryKey: ['opportunity-research', productId] });
  void queryClient.invalidateQueries({ queryKey: ['opportunity-research-list'] });
}
