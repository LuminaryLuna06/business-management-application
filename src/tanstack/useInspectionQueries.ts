import { useQuery } from "@tanstack/react-query";
import type {
  InspectionSchedule,
  InspectionReport,
  ViolationResult,
} from "../types/schedule";
import {
  getInspectionsByBusinessId,
  getReportsByInspectionId,
  getViolationsByReportId,
} from "../firebase/firestoreFunctions";

export function useInspectionSchedules(businessId: string) {
  return useQuery<InspectionSchedule[]>({
    queryKey: ["inspection-schedules", businessId],
    queryFn: async () => {
      if (!businessId) return [];
      return getInspectionsByBusinessId(businessId);
    },
    enabled: !!businessId,
  });
}

export function useInspectionReports(businessId: string, inspectionId: string) {
  return useQuery<InspectionReport[]>({
    queryKey: ["inspection-reports", businessId, inspectionId],
    queryFn: async () => {
      if (!businessId || !inspectionId) return [];
      return getReportsByInspectionId(businessId, inspectionId);
    },
    enabled: !!businessId && !!inspectionId,
  });
}

export function useViolationDecisions(
  businessId: string,
  inspectionId: string,
  reportId: string
) {
  return useQuery<ViolationResult[]>({
    queryKey: ["violation-decisions", businessId, inspectionId, reportId],
    queryFn: async () => {
      if (!businessId || !inspectionId || !reportId) return [];
      return getViolationsByReportId(businessId, inspectionId, reportId);
    },
    enabled: !!businessId && !!inspectionId && !!reportId,
  });
}
