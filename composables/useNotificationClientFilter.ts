import { useAuth } from '#imports';
import { computed } from 'vue';
import type { NotificationHistoryItem } from '~/utils/notifications';

export function useNotificationClientFilter(notifications: NotificationHistoryItem[]) {
  const { data, status } = useAuth();
  return computed(() => {
    if (status.value === 'loading') return null;

    const user = (data.value as any)?.user;
    const role = user?.role;
    const branchId = user?.contract?.branchId;

    // Keep a client-side branch safeguard for manager roles, but avoid blocking
    // rendering when user contract data arrives later than auth status.
    if (role === 'branch-manager' || role === 'platform-admin') {
      if (!branchId) return notifications;

      const sanitize = (v: unknown) =>
        typeof v === 'string' ? v.trim() : String(v ?? '').trim();
      return notifications.filter((n: NotificationHistoryItem) => {
        const body =
          n.body && typeof n.body === 'object' ? (n.body as Record<string, unknown>) : {};
        const billing =
          body.billing && typeof body.billing === 'object'
            ? (body.billing as Record<string, unknown>)
            : {};
        const paymentData =
          billing.paymentData && typeof billing.paymentData === 'object'
            ? (billing.paymentData as Record<string, unknown>)
            : {};
        const contract =
          body.contract && typeof body.contract === 'object'
            ? (body.contract as Record<string, unknown>)
            : {};
        const userContract =
          body.user &&
          typeof body.user === 'object' &&
          (body.user as any).contract &&
          typeof (body.user as any).contract === 'object'
            ? ((body.user as any).contract as Record<string, unknown>)
            : {};

        const notifBranchId =
          (n as any)['branchId'] ??
          (body as any).branchId ??
          (paymentData as any).branchId ??
          (paymentData as any).branch ??
          (contract as any).branchId ??
          (userContract as any).branchId ??
          null;
        return sanitize(notifBranchId) === sanitize(branchId);
      });
    }
    return notifications;
  });
}
