import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllSubLicenses,
  addSubLicense,
  getLicensesByBusinessId,
  addBusinessSubLicense,
} from "../firebase/firestoreFunctions";
import type { SubLicense, License } from "../types/licenses";

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
  return useQuery<License[]>({
    queryKey: subLicenseKeys.business(businessId),
    queryFn: () => getLicensesByBusinessId(businessId),
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

// Hook mutation thêm giấy phép con
export const useAddSubLicenseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subLicense: SubLicense) => addSubLicense(subLicense),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subLicenseKeys.list() });
    },
  });
};

// Hook mutation thêm giấy phép con cho doanh nghiệp
export const useAddBusinessSublicenseMutation = (businessId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (license: {
      license_id: string;
      license_number: string;
      issue_date: Date;
      expiration_date: Date;
    }) => addBusinessSubLicense(businessId, license),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: subLicenseKeys.business(businessId),
      });
    },
  });
};
