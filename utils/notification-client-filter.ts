import type { NotificationHistoryItem } from './notifications';

/**
 * Filtra notificações para branch-manager no client-side.
 * Retorna apenas notificações do mesmo branchId do usuário logado.
 */
export function filterNotificationsForBranchManager(
  notifications: NotificationHistoryItem[],
  userBranchId: string | null | undefined,
): NotificationHistoryItem[] {
  if (!userBranchId) return [];
  const sanitize = (v: any) =>
    typeof v === 'string' ? v.trim() : String(v ?? '').trim();
  return notifications.filter((n) => {
    const branchId =
      n.branchId ??
      n.body?.billing?.paymentData?.branchId ??
      n.body?.contract?.branchId ??
      n.body?.user?.contract?.branchId ??
      n.body?.branchId ??
      null;
    return sanitize(branchId) === sanitize(userBranchId);
  });
}
