import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllSubLicenses,
  getLicensesByBusinessId,
  addSubLicense,
  updateSubLicense,
  deleteSubLicense,
  addBusinessSubLicense,
  updateBusinessSubLicense,
  deleteBusinessSubLicense,
} from "../firebase/firestoreFunctions";
import type { License, SubLicense } from "../types/licenses";

export const subLicenseKeys = {
  all: ["sub-licenses"] as const,
  lists: () => [...subLicenseKeys.all, "list"] as const,
  list: () => [...subLicenseKeys.lists()] as const,
  business: (businessId: string) =>
    [...subLicenseKeys.all, "business", businessId] as const,
};

// Hook lấy tất cả giấy phép con
export const useGetAllSubLicenses = () => {
  return useQuery<SubLicense[]>({
    queryKey: subLicenseKeys.list(),
    queryFn: getAllSubLicenses,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Hook lấy giấy phép con của doanh nghiệp
export const useBusinessSubLicenses = (businessId: string) => {
  return useQuery<(License & { id: string })[]>({
    queryKey: ["business-sub-licenses", businessId],
    queryFn: async () => {
      if (!businessId) return [];
      return getLicensesByBusinessId(businessId);
    },
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Hook mutation thêm giấy phép con
export const useAddSubLicenseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (subLicense: Omit<SubLicense, "id">) => {
      await addSubLicense(subLicense);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subLicenseKeys.list() });
    },
  });
};

// Hook mutation cập nhật giấy phép con
export const useUpdateSubLicenseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      licenseId,
      licenseData,
    }: {
      licenseId: string;
      licenseData: Partial<SubLicense>;
    }) => updateSubLicense(licenseId, licenseData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subLicenseKeys.list() });
    },
  });
};

// Hook mutation xóa giấy phép con
export const useDeleteSubLicenseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (licenseId: string) => deleteSubLicense(licenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subLicenseKeys.list() });
    },
  });
};

// Hook mutation thêm giấy phép con cho doanh nghiệp
export const useAddBusinessSublicenseMutation = (businessId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (license: {
      license_id: string;
      license_number: string;
      issue_date: Date;
      expiration_date: Date;
      file_link?: string;
    }) => addBusinessSubLicense(businessId, license),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["business-sub-licenses", businessId],
      });
    },
  });
};

export const useUpdateBusinessSubLicenseMutation = (businessId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      licenseId,
      licenseData,
    }: {
      licenseId: string;
      licenseData: {
        license_id: string;
        license_number: string;
        issue_date: Date;
        expiration_date: Date;
        file_link?: string;
      };
    }) => updateBusinessSubLicense(businessId, licenseId, licenseData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["business-sub-licenses", businessId],
      });
    },
  });
};

export const useDeleteBusinessSubLicenseMutation = (businessId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (licenseId: string) =>
      deleteBusinessSubLicense(businessId, licenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["business-sub-licenses", businessId],
      });
    },
  });
};
