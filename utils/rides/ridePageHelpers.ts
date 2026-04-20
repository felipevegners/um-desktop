import { CalendarDate } from '@internationalized/date';

export function buildAvailableRideUsers(accounts: any[] | undefined) {
  const filteredUsers = (accounts || []).filter(
    (user: any) =>
      user.enabled === true && user.role !== 'admin' && user.role !== 'platform-driver',
  );

  return {
    filteredUsers,
    options: filteredUsers.map((user: any) => ({
      label: user.username,
      value: user.id,
    })),
  };
}

export function findSelectedRideUser(accounts: any[] | undefined, ride: any) {
  const rideUserId = ride?.user?.id;
  if (!rideUserId) return null;
  return (accounts || []).find((user: any) => user.id === rideUserId) ?? null;
}

export function resolveRideContractId(ride: any): string | undefined {
  const paymentData = ride?.billing?.paymentData;
  const contractId = paymentData?.contractId || paymentData?.contract;
  return typeof contractId === 'string' && contractId !== '-' ? contractId : undefined;
}

export function resolveRideTravelCalendarDate(
  rawTravelDate: string | undefined,
): CalendarDate | null {
  if (typeof rawTravelDate !== 'string' || rawTravelDate.trim().length === 0) {
    return null;
  }

  if (rawTravelDate.includes('/')) {
    const parts = rawTravelDate
      .split('/')
      .reverse()
      .map((value) => Number(value));
    if (parts.length === 3 && parts.every((value) => Number.isFinite(value))) {
      return new CalendarDate(parts[0], parts[1], parts[2]);
    }
  }

  const parsedDate = new Date(rawTravelDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return new CalendarDate(
    parsedDate.getFullYear(),
    parsedDate.getMonth() + 1,
    parsedDate.getDate(),
  );
}
