import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useAuth } from "@/context/auth-context";

// Dashboard data hooks
export function useActivityLog() {
  const { user } = useAuth();
  const organizationId = user?.organization_id;

  return useQuery({
    queryKey: ['/api/activity-log', organizationId],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!organizationId,
  });
}

export function useStatistics() {
  const { user } = useAuth();
  const organizationId = user?.organization_id;

  return useQuery({
    queryKey: ['/api/statistics', organizationId],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!organizationId,
  });
}

export function useProjectsStatus() {
  const { user } = useAuth();
  const organizationId = user?.organization_id;

  return useQuery({
    queryKey: ['/api/projects/status', organizationId],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!organizationId,
  });
}

export function useInvoicesData() {
  const { user } = useAuth();
  const organizationId = user?.organization_id;

  return useQuery({
    queryKey: ['/api/invoices/summary', organizationId],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!organizationId,
  });
}

export function useUpcomingTasks() {
  const { user } = useAuth();
  const organizationId = user?.organization_id;

  return useQuery({
    queryKey: ['/api/tasks/upcoming', organizationId],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!organizationId,
  });
}

export function useTimeTrackingData() {
  const { user } = useAuth();
  const organizationId = user?.organization_id;

  return useQuery({
    queryKey: ['/api/time-tracking/summary', organizationId],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!organizationId,
  });
}

export function useUpcomingEvents() {
  const { user } = useAuth();
  const organizationId = user?.organization_id;

  return useQuery({
    queryKey: ['/api/events/upcoming', organizationId],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!organizationId,
  });
}