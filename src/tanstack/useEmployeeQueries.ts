import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getEmployeesByBusinessId,
  addEmployee,
} from "../firebase/firestoreFunctions";
import type { Worker } from "../types/worker";

export function useEmployeesQuery(businessId: string) {
  return useQuery<Worker[]>({
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
