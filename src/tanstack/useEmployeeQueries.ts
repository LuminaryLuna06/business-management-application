import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getEmployeesByBusinessId,
  addEmployee,
  updateEmployee,
  deleteEmployee,
} from "../firebase/firestoreFunctions";
import type { Worker } from "../types/worker";

export function useEmployeesQuery(businessId: string) {
  return useQuery<(Worker & { id: string })[]>({
    queryKey: ["employees", businessId],
    queryFn: async () => {
      if (!businessId) return [];
      return getEmployeesByBusinessId(businessId);
    },
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useAddEmployeeMutation(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (employeeData: Omit<Worker, "id">) => {
      await addEmployee(businessId, employeeData as Worker);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees", businessId] });
    },
  });
}

export function useUpdateEmployeeMutation(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      employeeId,
      employeeData,
    }: {
      employeeId: string;
      employeeData: Partial<Worker>;
    }) => updateEmployee(businessId, employeeId, employeeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees", businessId] });
    },
  });
}

export function useDeleteEmployeeMutation(businessId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (employeeId: string) =>
      deleteEmployee(businessId, employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees", businessId] });
    },
  });
}
