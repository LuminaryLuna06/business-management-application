import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllIndustries,
  addIndustry,
  updateIndustry,
  deleteIndustry,
} from "../firebase/firestoreFunctions";
import type { Industry } from "../types/industry";

// Query keys
export const industryKeys = {
  all: ["industries"] as const,
  lists: () => [...industryKeys.all, "list"] as const,
  details: () => [...industryKeys.all, "detail"] as const,
  detail: (id: string) => [...industryKeys.details(), id] as const,
};

// Hook để lấy tất cả ngành nghề
export const useGetAllIndustries = () => {
  return useQuery({
    queryKey: industryKeys.lists(),
    queryFn: getAllIndustries,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Hook để thêm ngành nghề
export const useAddIndustry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (industry: Industry) => addIndustry(industry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: industryKeys.lists() });
    },
    onError: (error) => {
      console.error("Error adding industry:", error);
    },
  });
};

// Hook để cập nhật ngành nghề
export const useUpdateIndustry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Industry> }) =>
      updateIndustry(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: industryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: industryKeys.detail(id) });
    },
    onError: (error) => {
      console.error("Error updating industry:", error);
    },
  });
};

// Hook để xóa ngành nghề
export const useDeleteIndustry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteIndustry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: industryKeys.lists() });
    },
    onError: (error) => {
      console.error("Error deleting industry:", error);
    },
  });
};
