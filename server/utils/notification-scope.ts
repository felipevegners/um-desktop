import { getServerSession } from '#auth';
import type { H3Event } from 'h3';

const managerRoles = new Set(['master-manager', 'branch-manager', 'platform-admin']);
const corpRoles = new Set(['platform-corp-user']);
const driverRoles = new Set(['platform-driver']);
const userRoles = new Set(['platform-user']);

export type NotificationRequestScope = {
  role: string | null;
  contractId: string | null;
  branchId: string | null;
  driverId: string | null;
  userId: string | null;
  isAdmin: boolean;
  isManager: boolean;
  isCorp: boolean;
  isDriver: boolean;
  isUser: boolean;
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
  const userId = typeof user?.id === 'string' ? user.id : null;

  return {
    role,
    contractId,
    branchId,
    driverId,
    userId,
    isAdmin: role === 'admin',
    isManager: role !== null && managerRoles.has(role),
    isCorp: role !== null && corpRoles.has(role),
    isDriver: role !== null && driverRoles.has(role),
    isUser: role !== null && userRoles.has(role),
  };
}
