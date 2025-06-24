import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  InspectionSchedule,
  InspectionReport,
  ViolationResult,
} from "../types/schedule";
import {
  getInspectionsByBusinessId,
  getAllReportsByBusinessId,
  getAllViolationsByBusinessId,
  addInspection,
  addReport,
  addViolation,
} from "../firebase/firestoreFunctions";

export function useInspectionSchedules(businessId: string) {
  return useQuery<InspectionSchedule[]>({
    queryKey: ["inspection-schedules", businessId],
    queryFn: async () => {
      if (!businessId) return [];
      return getInspectionsByBusinessId(businessId);
    },
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useInspectionReports(businessId: string) {
  return useQuery<InspectionReport[]>({
    queryKey: ["inspection-reports", businessId],
    queryFn: async () => {
      if (!businessId) return [];
      return getAllReportsByBusinessId(businessId);
    },
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useViolationDecisions(businessId: string) {
  return useQuery<ViolationResult[]>({
    queryKey: ["violation-decisions", businessId],
    queryFn: async () => {
      if (!businessId) return [];
      return getAllViolationsByBusinessId(businessId);
    },
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useAddInspectionMutation(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inspectionData: any) =>
      addInspection(businessId, inspectionData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["inspection-schedules", businessId],
      });
    },
  });
}

export function useAddReportMutation(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reportData: any) => addReport(businessId, reportData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["inspection-reports", businessId],
      });
    },
  });
}

export function useAddViolationMutation(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (violationData: any) => addViolation(businessId, violationData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["violation-decisions", businessId],
      });
    },
  });
}
