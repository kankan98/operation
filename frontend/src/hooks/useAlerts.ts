import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsApi } from '@/services/api';

export function useAlerts() {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: alertsApi.list,
  });
}

export function useMarkAlertAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => alertsApi.update(id, { isRead: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

export function useDeleteAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: alertsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}
