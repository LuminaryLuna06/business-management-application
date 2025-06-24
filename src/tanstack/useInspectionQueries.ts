import { useQuery } from "@tanstack/react-query";
import type {
  InspectionSchedule,
  InspectionReport,
  ViolationResult,
} from "../types/schedule";
import {
  getInspectionsByBusinessId,
  getAllReportsByBusinessId,
  getAllViolationsByBusinessId,
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
