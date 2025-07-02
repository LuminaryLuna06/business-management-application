import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  InspectionSchedule,
  InspectionReport,
  ViolationResult,
  InspectionBatch,
} from "../types/schedule";
import {
  getInspectionsByBusinessId,
  getAllReportsByBusinessId,
  getAllViolationsByBusinessId,
  addInspection,
  addReport,
  addViolation,
  updateInspection,
  updateReport,
  updateViolation,
  deleteViolation,
  getAllViolations,
  deleteInspectionAndLinkedData,
  deleteReportAndLinkedViolations,
  addSchedule,
  createInspectionBatchAndSchedules,
  getInspectionStatsByBatchId,
  getAllSchedules,
  getViolationStatsByBatchId,
  deleteInspectionBatchAndAllLinkedData,
  updateInspectionBatch,
  updateInspectionBatchAndSchedules,
} from "../firebase/firestoreFunctions";

export function useInspectionSchedules(businessId: string) {
  return useQuery<(InspectionSchedule & { id: string })[]>({
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
  return useQuery<(InspectionReport & { id: string })[]>({
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
  return useQuery<(ViolationResult & { id: string })[]>({
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

export function useUpdateInspectionMutation(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      inspectionId,
      inspectionData,
    }: {
      inspectionId: string;
      inspectionData: Partial<InspectionSchedule>;
    }) => updateInspection(businessId, inspectionId, inspectionData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["inspection-schedules", businessId],
      });
    },
  });
}

export function useDeleteInspectionMutation(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      inspectionId,
      inspectionDocId,
    }: {
      inspectionId: string;
      inspectionDocId: string;
    }) =>
      deleteInspectionAndLinkedData(businessId, inspectionId, inspectionDocId),
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

export function useUpdateReportMutation(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      reportId,
      reportData,
    }: {
      reportId: string;
      reportData: Partial<InspectionReport>;
    }) => updateReport(businessId, reportId, reportData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["inspection-reports", businessId],
      });
    },
  });
}

export function useDeleteReportMutation(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      reportId,
      reportDocId,
    }: {
      reportId: string;
      reportDocId: string;
    }) => deleteReportAndLinkedViolations(businessId, reportId, reportDocId),
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

export function useUpdateViolationMutation(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      violationId,
      violationData,
    }: {
      violationId: string;
      violationData: Partial<ViolationResult>;
    }) => updateViolation(businessId, violationId, violationData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["violation-decisions", businessId],
      });
    },
  });
}

export function useDeleteViolationMutation(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (violationId: string) =>
      deleteViolation(businessId, violationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["violation-decisions", businessId],
      });
    },
  });
}

export function useAllViolationsQuery() {
  return useQuery<any[]>({
    queryKey: ["all-violations"],
    queryFn: getAllViolations,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useAddScheduleMutation() {
  return useMutation({
    mutationFn: async (batch: InspectionBatch) => addSchedule(batch),
  });
}

export function useCreateInspectionBatchAndSchedulesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      batch,
      businesses,
    }: {
      batch: Omit<InspectionBatch, "batch_id">;
      businesses: { business_id: string }[];
    }) => createInspectionBatchAndSchedules(batch, businesses),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inspection-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
    },
  });
}

export function useInspectionStatsByBatchId(inspection_id: string) {
  return useQuery<{ total: number; checked: number }>({
    queryKey: ["inspection-stats", inspection_id],
    queryFn: () => getInspectionStatsByBatchId(inspection_id),
    enabled: !!inspection_id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useAllSchedulesQuery() {
  return useQuery({
    queryKey: ["schedules"],
    queryFn: getAllSchedules,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useViolationStatsByBatchId(inspection_id: string) {
  return useQuery<{ violated: number; nonViolated: number }>({
    queryKey: ["violation-stats", inspection_id],
    queryFn: () => getViolationStatsByBatchId(inspection_id),
    enabled: !!inspection_id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useDeleteInspectionBatchAndAllLinkedDataMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      batchId,
      scheduleDocId,
    }: {
      batchId: string;
      scheduleDocId?: string;
    }) => deleteInspectionBatchAndAllLinkedData(batchId, scheduleDocId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.invalidateQueries({ queryKey: ["inspection-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["violation-stats"] });
      queryClient.invalidateQueries({ queryKey: ["inspection-stats"] });
      queryClient.invalidateQueries({ queryKey: ["all-violations"] });
    },
  });
}

export function useUpdateInspectionBatchMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      scheduleDocId,
      batchData,
    }: {
      scheduleDocId: string;
      batchData: Partial<InspectionBatch>;
    }) => updateInspectionBatch(scheduleDocId, batchData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
    },
  });
}

export function useUpdateInspectionBatchAndSchedulesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      scheduleDocId,
      batchData,
    }: {
      scheduleDocId: string;
      batchData: Partial<InspectionBatch>;
    }) => updateInspectionBatchAndSchedules(scheduleDocId, batchData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.invalidateQueries({ queryKey: ["inspection-schedules"] });
    },
  });
}
