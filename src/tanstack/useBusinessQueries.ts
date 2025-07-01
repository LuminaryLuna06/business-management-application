import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllBusinesses,
  getBusinessById,
  deleteBusiness,
  updateBusiness,
  deleteBusinessWithBatch,
} from "../firebase/firestoreFunctions";

// Query keys
export const businessKeys = {
  all: ["businesses"] as const,
  lists: () => [...businessKeys.all, "list"] as const,
  list: (filters: string) => [...businessKeys.lists(), { filters }] as const,
  details: () => [...businessKeys.all, "detail"] as const,
  detail: (id: string) => [...businessKeys.details(), id] as const,
};

// Hook để lấy tất cả doanh nghiệp
export const useGetAllBusinesses = () => {
  return useQuery({
    queryKey: businessKeys.lists(),
    queryFn: getAllBusinesses,
    staleTime: 5 * 60 * 1000, // 5 phút
    gcTime: 10 * 60 * 1000, // 10 phút (trước đây là cacheTime)
  });
};

// Hook để lấy doanh nghiệp theo ID
export const useGetBusinessById = (businessId: string) => {
  return useQuery({
    queryKey: businessKeys.detail(businessId),
    queryFn: () => getBusinessById(businessId),
    enabled: !!businessId, // Chỉ chạy khi có businessId
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Hook để xóa doanh nghiệp
export const useDeleteBusiness = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBusinessWithBatch,
    onSuccess: () => {
      // Invalidate và refetch danh sách doanh nghiệp
      queryClient.invalidateQueries({ queryKey: businessKeys.lists() });
    },
    onError: (error) => {
      console.error("Error deleting business:", error);
    },
  });
};

// Hook để cập nhật doanh nghiệp
export const useUpdateBusiness = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      businessId,
      businessData,
    }: {
      businessId: string;
      businessData: any;
    }) => updateBusiness(businessId, businessData),
    onSuccess: (_, { businessId }) => {
      // Invalidate và refetch danh sách doanh nghiệp và chi tiết doanh nghiệp
      queryClient.invalidateQueries({ queryKey: businessKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: businessKeys.detail(businessId),
      });
    },
    onError: (error) => {
      console.error("Error updating business:", error);
    },
  });
};
