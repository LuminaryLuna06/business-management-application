import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllUsers,
  addUserWithAuth,
  updateUser,
  deleteUser,
} from "../firebase/firestoreFunctions";
import type { StaffUser } from "../types/user";

export function useUsersQuery() {
  return useQuery<StaffUser[], Error>({
    queryKey: ["users"],
    queryFn: getAllUsers,
  });
}

export function useAddUserWithAuthMutation(options?: {
  onSuccess?: (data: string) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addUserWithAuth,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      options?.onSuccess?.(data);
    },
  });
}

export function useUpdateUserMutation(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uid, data }: { uid: string; data: Partial<StaffUser> }) =>
      updateUser(uid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      options?.onSuccess?.();
    },
  });
}

export function useDeleteUserMutation(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uid: string) => deleteUser(uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      options?.onSuccess?.();
    },
  });
}
