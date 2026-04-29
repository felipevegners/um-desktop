import { getServerSession } from '#auth';
import type { H3Event } from 'h3';

const managerRoles = new Set([
  'master-manager',
  'branch-manager',
  'platform-admin',
]);

export type NotificationRequestScope = {
  role: string | null;
  contractId: string | null;
  branchId: string | null;
  driverId: string | null;
  isAdmin: boolean;
  isManager: boolean;
};

export async function resolveNotificationRequestScope(
  event: H3Event,
): Promise<NotificationRequestScope> {
  const session = await getServerSession(event as any);
  const user = (session?.user as any) ?? null;
  const role = typeof user?.role === 'string' ? user.role : null;
  const contract =
    user?.contract && typeof user.contract === 'object' ? user.contract : null;
  const contractId =
    contract && typeof contract.contractId === 'string' ? contract.contractId : null;
  const branchId =
    contract && typeof contract.branchId === 'string' ? contract.branchId : null;
  const driverId =
    typeof user?.driverId === 'string'
      ? user.driverId
      : typeof user?.driver?.id === 'string'
        ? user.driver.id
        : null;

  return {
    role,
    contractId,
    branchId,
    driverId,
    isAdmin: role === 'admin',
    isManager: role !== null && managerRoles.has(role),
  };
}
