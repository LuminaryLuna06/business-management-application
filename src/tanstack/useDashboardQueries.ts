import { useQuery } from "@tanstack/react-query";
import {
  getAllViolations,
  getViolationStats,
  getUpcomingInspections,
} from "../firebase/firestoreFunctions";

export function useAllViolationsQuery() {
  return useQuery({
    queryKey: ["violations", "all"],
    queryFn: getAllViolations,
  });
}

export function useViolationStatsQuery() {
  return useQuery({
    queryKey: ["violations", "stats"],
    queryFn: getViolationStats,
  });
}

export function useUpcomingInspectionsQuery(top = 20) {
  return useQuery({
    queryKey: ["inspections", "upcoming", top],
    queryFn: () => getUpcomingInspections(top),
  });
}
